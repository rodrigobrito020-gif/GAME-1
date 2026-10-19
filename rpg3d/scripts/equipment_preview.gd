extends SubViewportContainer
## Shop mannequin uses an isolated inventory; trying equipment never owns it.
const Gear := preload("res://scripts/gear_catalog.gd")
const Loot := preload("res://scripts/loot_items.gd")
const Wardrobe := preload("res://scripts/wardrobe.gd")
const Weapon := preload("res://scripts/client_weapon_visual.gd")
const Shield := preload("res://scripts/shield_mount.gd")
const Carry := preload("res://scripts/shield_carry_pose.gd")
var viewport: SubViewport
var model: Node3D
var camera: Camera3D
var preview_class := "tanque"
var preview_inventory: Dictionary = {}
var _base_inventory: Dictionary = {}
var _base_class := "tanque"
var _fit_weapon := false

func _ready() -> void:
	stretch = true
	custom_minimum_size = Vector2(240, 340)
	size_flags_vertical = Control.SIZE_EXPAND_FILL
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	viewport = SubViewport.new()
	viewport.size = Vector2i(280, 420)
	viewport.own_world_3d = true
	viewport.transparent_bg = true
	add_child(viewport)
	var light := DirectionalLight3D.new()
	light.rotation_degrees = Vector3(-35, -35, 0)
	light.light_energy = 1.8
	viewport.add_child(light)
	var environment := WorldEnvironment.new()
	environment.environment = Environment.new()
	environment.environment.background_mode = Environment.BG_CLEAR_COLOR
	environment.environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.environment.ambient_light_color = Color("a4b3c6")
	environment.environment.ambient_light_energy = 0.7
	viewport.add_child(environment)
	camera = Camera3D.new()
	camera.position = Vector3(0, 1.1, -3)
	viewport.add_child(camera)
	camera.look_at(Vector3(0, 1.0, 0))
	camera.projection = Camera3D.PROJECTION_ORTHOGONAL
	camera.size = 2.4

func set_source(inv: Dictionary, class_id: String) -> void:
	_base_inventory = inv.duplicate(true)
	_base_class = class_id

func show_offer(offer: Dictionary, complete_set := false) -> void:
	if offer.is_empty(): return
	_fit_weapon = offer.source == "weapon"
	preview_class = {"heavy":"tanque", "light":"arqueiro", "robe":"mago"}.get(offer.profile, _base_class)
	if offer.source == "weapon":
		preview_class = {"sword":"tanque", "bow":"arqueiro", "rod":"mago"}.get(offer.weapon_type, "tanque" if _base_class == "arqueiro" else _base_class)
	preview_inventory = _base_inventory.duplicate(true)
	Loot.store_incompatible_equipment(preview_inventory, preview_class)
	for slot: String in Wardrobe.Catalog.CLOTHING_SLOTS:
		if Loot.is_equipped(preview_inventory, slot): continue
		var base := Gear.find_offer("armor", "clothing:" + Wardrobe.Catalog.key_for(preview_class, "No Grade", slot))
		var garment := Gear.create_item(base)
		preview_inventory.loot_items.append(garment)
		Loot.equip_item(preview_inventory, garment.id, preview_class)
	var item := Gear.create_item(offer)
	preview_inventory.loot_items.append(item)
	Loot.equip_item(preview_inventory, item.id, preview_class)
	if complete_set and item.has("lineage_key"):
		var set_id := str(Wardrobe.Catalog.get_entry(item.lineage_key).get("set_id", ""))
		for piece: Dictionary in Gear.offers("armor"):
			if piece.source != "clothing" or piece.profile != offer.profile: continue
			if str(Wardrobe.Catalog.get_entry(piece.catalog_key).get("set_id", "")) != set_id or set_id.is_empty(): continue
			var selected := Gear.create_item(piece)
			preview_inventory.loot_items.append(selected)
			Loot.equip_item(preview_inventory, selected.id, preview_class)
	_build_model()

func _build_model() -> void:
	if is_instance_valid(model):
		viewport.remove_child(model)
		model.queue_free()
	var file := "human_archer" if preview_class == "arqueiro" else "human_mage" if preview_class in ["mago", "healer"] else "human_fighter"
	model = (load("res://assets/" + file + ".glb") as PackedScene).instantiate()
	viewport.add_child(model)
	model.rotation.y = PI
	Wardrobe.install(model, preview_class)
	Wardrobe.apply(model, preview_inventory, preview_class)
	var rig: Skeleton3D = model.find_children("*", "Skeleton3D", true, false)[0]
	var weapon_item := Loot.equipped_item(preview_inventory, "sword")
	if not weapon_item.is_empty():
		var socket := BoneAttachment3D.new()
		socket.bone_name = "Weapon_L_Bone" if preview_class == "arqueiro" else "Weapon_R_Bone"
		rig.add_child(socket)
		var weapon := Weapon.new()
		weapon.scale = Vector3.ONE / 0.038
		weapon.weapon_key = weapon_item.get("weapon_key", {"tanque":"weapon_2", "arqueiro":"weapon_13", "mago":"weapon_7", "healer":"weapon_7"}[preview_class])
		socket.add_child(weapon)
	var has_shield := Loot.is_equipped(preview_inventory, "shield") and preview_class != "arqueiro"
	var carry := Carry.new()
	carry.shield_equipped = has_shield
	rig.add_child(carry)
	if has_shield:
		var socket := BoneAttachment3D.new()
		socket.bone_name = "Shield_L_Bone"
		rig.add_child(socket)
		var mount := Shield.new()
		mount.scale = Vector3.ONE / 0.038
		mount.weapon_key = Loot.equipped_item(preview_inventory, "shield").get("weapon_key", "")
		socket.add_child(mount)
	var animation := model.find_child("AnimationPlayer", true, false) as AnimationPlayer
	for clip: String in animation.get_animation_list():
		if clip.ends_with("idle"):
			animation.play(clip)
			animation.advance(0.3)
			break
	_fit_camera.call_deferred()

func _fit_camera() -> void:
	if not is_instance_valid(model): return
	if not _fit_weapon:
		camera.size = 2.4
		camera.position = Vector3(0, 1.1, -3)
		camera.look_at(Vector3(0, 1.0, 0))
		return
	var bounds := AABB(Vector3(-0.45, 0, -0.3), Vector3(0.9, 2, 0.6))
	for mesh: MeshInstance3D in model.find_children("*", "MeshInstance3D", true, false):
		if mesh.is_visible_in_tree() and mesh.skin == null:
			bounds = bounds.merge(mesh.global_transform * mesh.get_aabb())
	var center := bounds.position + bounds.size * 0.5
	var aspect := float(viewport.size.x) / maxi(1, viewport.size.y)
	camera.size = maxf(2.4, maxf(bounds.size.y, bounds.size.x / aspect) * 1.12)
	camera.position = Vector3(center.x, center.y, -4)
	camera.look_at(Vector3(center.x, center.y, 0))

func _process(_delta: float) -> void:
	if is_instance_valid(viewport): viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS if is_visible_in_tree() else SubViewport.UPDATE_DISABLED
