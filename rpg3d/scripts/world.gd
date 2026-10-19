extends Node3D

const RPGHud := preload("res://scripts/rpg_hud.gd")
const ShieldFit := preload("res://tests/shield_fit.gd")
const ShieldCarryPose := preload("res://scripts/shield_carry_pose.gd")
const ShieldMount := preload("res://scripts/shield_mount.gd")
const LONG_SWORD := preload("res://assets/long_sword.glb")
const FIGHTER := preload("res://assets/human_fighter.glb")
const ARCHER := preload("res://assets/human_archer.glb")
const MAGE := preload("res://assets/human_mage.glb")
const GrelimVisual := preload("res://scripts/grelim_visual.gd")
const RangedMonsterVisual := preload("res://scripts/ranged_monster_visual.gd")
const EnemyRangedCombat := preload("res://scripts/enemy_ranged_combat.gd")
var enemy_ranged_combat := EnemyRangedCombat.new()
const OpenField := preload("res://scripts/open_field.gd")
const Village := preload("res://scripts/village.gd")
const VILLAGE_SCENE := preload("res://levels/village.tscn")
const COMBAT_SCENE := preload("res://levels/combat_world.tscn")
const WorldCatalog := preload("res://scripts/world_catalog.gd")
const PlayerProgress := preload("res://scripts/player_progress.gd")
const TravelGate := preload("res://scripts/travel_gate.gd")
const InstanceRun := preload("res://scripts/instance_run.gd")
const RewardChest := preload("res://scripts/reward_chest.gd")
const LootItems := preload("res://scripts/loot_items.gd")
const PlayerClasses := preload("res://scripts/player_classes.gd")
const ClassMenu := preload("res://scripts/class_menu.gd")
const ClassCombat := preload("res://scripts/class_combat.gd")
const GroundTargeting := preload("res://scripts/ground_targeting.gd")
var ground_targeting := GroundTargeting.new()
const ArenaBossVisual := preload("res://scripts/arena_boss_visual.gd")
const ClassWeapon := preload("res://scripts/class_weapon.gd")
const ClientWeaponVisual := preload("res://scripts/client_weapon_visual.gd")
const Wardrobe := preload("res://scripts/wardrobe.gd")
const MerchantMenu := preload("res://scripts/merchant_menu.gd")
const MerchantStock := preload("res://scripts/merchant_stock.gd")
const EquipmentShop := preload("res://scripts/equipment_shop.gd")
const GearCatalog := preload("res://scripts/gear_catalog.gd")
var equipment_shop: PanelContainer
var equipment_shop_backdrop: ColorRect
const StorageMenu := preload("res://scripts/storage_menu.gd")
const StorageItems := preload("res://scripts/storage_items.gd")
const Balance := preload("res://scripts/combat_balance.gd")
var storage_menu: PanelContainer
var storage_backdrop: ColorRect
var merchant_menu: PanelContainer
var merchant_backdrop: ColorRect
var player_class := "tanque"
var class_menu: PanelContainer
var class_backdrop: ColorRect
var class_combat := ClassCombat.new()
var ranged_attachment: BoneAttachment3D
var ranged_weapon: Node3D
var progress := PlayerProgress.new()
var arena_run: RefCounted
var reward_chest: Node3D
var loot_rng := RandomNumberGenerator.new()
var active_zone: Node3D
var current_world := 0
var instance_kills := 0
var instance_goal := 0
var portal_position := Vector3.ZERO
var save_error_reported := false
var player: CharacterBody3D
var character_model: Node3D
var character_model_kind := ""
var facing: Node3D
var animation: AnimationPlayer
var boom: SpringArm3D
var camera: Camera3D
var hud: CanvasLayer
var notice: Label
var yaw := 0.0
var pitch := -0.10
var hp := 100.0
var level := 1
var xp := 0
var kills := 0
var cooldown := 0.0
var attack_clock := 0.0
var skill_cooldown := 0.0
var spin_cooldown := 0.0
var guard_cooldown := 0.0
var dash_cooldown := 0.0
var guard_clock := 0.0
var dash_clock := 0.0
var dash_direction := Vector3.FORWARD
var attack_kind := 0
var automatic_skills: Array[bool] = [false, false, false, false]
var auto_potion := false
var potion_threshold := 40.0
var potion_clock := 0.0
var zoom_distance := 5.0
var inventory := {"equipped": true, "armor": true, "pants": true, "equipment_version": 2, "gloves": true, "boots": true, "shield": true, "potions": 3, "fangs": 0, "gold": 0}
var powered_attack := false
var shield_carry_pose: SkeletonModifier3D
var shield_attachment: BoneAttachment3D
var sword_attachment: BoneAttachment3D
var attack_pending := false
var attack_direction := Vector3.FORWARD
var enemies: Array[CharacterBody3D] = []
var dead := false
var smoke := false
var failures := 0

func _ready() -> void:
	smoke = "--smoke-test" in OS.get_cmdline_user_args()
	loot_rng.randomize()
	_actions()
	_world()
	_player()
	_ui()
	if not smoke:
		_load_profile()
	_change_zone(0)
	if not smoke:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	else:
		set_physics_process(false)
		_test.call_deferred()

func _actions() -> void:
	for item in [["left", KEY_A], ["right", KEY_D], ["forward", KEY_W], ["back", KEY_S], ["jump", KEY_SPACE], ["sprint", KEY_SHIFT]]:
		if not InputMap.has_action(item[0]):
			InputMap.add_action(item[0])
			var event := InputEventKey.new()
			event.physical_keycode = item[1]
			InputMap.action_add_event(item[0], event)

func _material(color: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.85
	return material

func _world() -> void:
	var environment := WorldEnvironment.new()
	environment.environment = Environment.new()
	environment.environment.background_mode = Environment.BG_COLOR
	environment.environment.background_color = Color("8eabb8")
	environment.environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.environment.ambient_light_color = Color("c0d3dd")
	environment.environment.ambient_light_energy = 0.65
	add_child(environment)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-48, -28, 0)
	sun.light_color = Color("ffe9c1")
	sun.light_energy = 0.8
	sun.shadow_enabled = true
	add_child(sun)
	var sky := Sky.new()
	var sky_material := ProceduralSkyMaterial.new()
	sky_material.sky_top_color = Color("598cbe")
	sky_material.sky_horizon_color = Color("c6d8d5")
	sky_material.ground_horizon_color = Color("c6d8d5")
	sky_material.ground_bottom_color = Color("617550")
	sky.sky_material = sky_material
	environment.environment.sky = sky
	environment.environment.background_mode = Environment.BG_SKY

func _player() -> void:
	player = CharacterBody3D.new()
	player.name = "Player"
	add_child(player)
	player.add_to_group("rpg_player")
	var collision := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.32
	capsule.height = 1.8
	collision.shape = capsule
	collision.position.y = 0.9
	player.add_child(collision)
	facing = Node3D.new()
	player.add_child(facing)
	_set_character_model()
	boom = SpringArm3D.new()
	boom.spring_length = 5.0
	boom.position.y = 1.5
	boom.add_excluded_object(player.get_rid())
	player.add_child(boom)
	camera = Camera3D.new()
	camera.current = true
	camera.fov = 65
	camera.far = 1800
	boom.add_child(camera)

func _set_character_model() -> void:
	var kind := "mage" if player_class in ["mago", "healer"] else ("archer" if player_class == "arqueiro" else "fighter")
	if character_model_kind == kind and is_instance_valid(character_model):
		return
	if is_instance_valid(character_model):
		facing.remove_child(character_model)
		character_model.queue_free()
	character_model_kind = kind
	var scene: PackedScene = MAGE if kind == "mage" else (ARCHER if kind == "archer" else FIGHTER)
	character_model = scene.instantiate()
	character_model.rotation.y = PI
	character_model.set_meta("class_model_kind", kind)
	facing.add_child(character_model)
	animation = character_model.find_child("AnimationPlayer", true, false) as AnimationPlayer
	for clip in animation.get_animation_list():
		animation.get_animation(clip).loop_mode = Animation.LOOP_LINEAR if clip.ends_with("idle") or clip.ends_with("run") or clip.ends_with("walk") else Animation.LOOP_NONE
	_equip_sword(character_model)
	Wardrobe.install(character_model, player_class)
	_apply_equipment()
	_play("idle")
	if is_instance_valid(hud):
		hud.inventory_panel.set_character_source(character_model)

func _equip_sword(model: Node3D) -> void:
	var skeleton: Skeleton3D = model.find_children("*", "Skeleton3D", true, false)[0]
	shield_carry_pose = ShieldCarryPose.new()
	shield_carry_pose.name = "ShieldCarryPose"
	skeleton.add_child(shield_carry_pose)
	sword_attachment = BoneAttachment3D.new()
	sword_attachment.bone_name = "Weapon_R_Bone"
	skeleton.add_child(sword_attachment)
	var sword := Node3D.new()
	sword.name = "Sword"
	sword.scale = Vector3.ONE / 0.038
	sword_attachment.add_child(sword)
	var blade := LONG_SWORD.instantiate()
	blade.name = "OriginalLongSword"
	# A malha está em eixos glTF; o socket conserva os eixos locais originais.
	# Cancelar a conversão (x,y,z) -> (x,z,-y), sem mudar a direção nativa da lâmina.
	blade.basis = Basis(Vector3.RIGHT, PI / 2)
	# Centro do cabo original em X=-1.85 unidades, convertido para metros.
	blade.position.x = 1.85 * 0.038
	sword.add_child(blade)
	var client_blade := ClientWeaponVisual.new()
	client_blade.name = "ClientWeapon"
	sword.add_child(client_blade)
	shield_attachment = BoneAttachment3D.new()
	shield_attachment.name = "ShieldAttachment"
	shield_attachment.bone_name = "Shield_L_Bone"
	skeleton.add_child(shield_attachment)
	var mount := ShieldMount.new()
	mount.name = "ShieldMount"
	mount.scale = Vector3.ONE / 0.038
	shield_attachment.add_child(mount)
	ranged_attachment = BoneAttachment3D.new()
	ranged_attachment.name = "ClassWeaponAttachment"
	ranged_attachment.bone_name = "Weapon_R_Bone"
	skeleton.add_child(ranged_attachment)
	ranged_weapon = ClassWeapon.new()
	ranged_weapon.name = "ClassWeapon"
	ranged_weapon.scale = Vector3.ONE / 0.038
	ranged_attachment.add_child(ranged_weapon)

func _gear_nodes(slot: String, alternate: bool) -> Array[MeshInstance3D]:
	var results: Array[MeshInstance3D] = []
	if alternate:
		var item: Dictionary = LootItems.equipped_item(inventory, slot)
		var key: String = item.get("lineage_key", Wardrobe.Catalog.key_for(player_class, LootItems.grade_for_rarity(str(item.get("rarity", "Comum"))), slot))
		for mesh: MeshInstance3D in character_model.find_children("*", "MeshInstance3D", true, false):
			if mesh.get_meta("wardrobe_key", "") == key:
				results.append(mesh)
		return results
	var suffixes: Array = {"armor": ["_u"], "pants": ["_l"], "gloves": ["_g"], "boots": ["_b"]}[slot]
	var prefix := "mmagic_m000" if character_model_kind == "mage" else "mfighter_m000"
	for node in character_model.find_children("*", "MeshInstance3D", true, false):
		for suffix in suffixes:
			if str(node.name).to_lower().begins_with(prefix + suffix):
				results.append(node)
	return results

func _apply_equipment() -> void:
	var weapon := LootItems.equipped_item(inventory, "sword")
	var weapon_key := str(weapon.get("weapon_key", ""))
	var sword: Node3D = sword_attachment.get_node("Sword")
	sword.get_node("OriginalLongSword").visible = weapon_key.is_empty() or weapon_key == "weapon_2"
	var client_blade: Node3D = sword.get_node("ClientWeapon")
	client_blade.configure(weapon_key if player_class == "tanque" and weapon_key != "weapon_2" else "")
	var shield := LootItems.equipped_item(inventory, "shield")
	shield_attachment.get_node("ShieldMount").set_equipment(str(shield.get("weapon_key", "")))
	sword_attachment.visible = player_class == "tanque" and LootItems.is_equipped(inventory, "sword")
	shield_attachment.visible = player_class in ["tanque", "mago", "healer"] and LootItems.is_equipped(inventory, "shield")
	shield_carry_pose.shield_equipped = shield_attachment.visible
	if is_instance_valid(ranged_attachment):
		ranged_attachment.visible = player_class != "tanque" and LootItems.is_equipped(inventory, "sword")
		ranged_attachment.bone_name = "Weapon_L_Bone" if player_class == "arqueiro" else "Weapon_R_Bone"
		if ranged_weapon.class_id != player_class:
			ranged_weapon.configure(player_class)
		ranged_weapon.set_equipment(weapon_key if player_class != "tanque" else "")
		ranged_weapon.rotation = Vector3.ZERO
	Wardrobe.apply(character_model, inventory, player_class)
	var glove: Dictionary = inventory.get("equipped_loot", {}).get("gloves", {})
	var glove_key: String = glove.get("lineage_key", Wardrobe.Catalog.key_for(player_class, LootItems.grade_for_rarity(str(glove.get("rarity", "Comum"))), "gloves"))
	shield_attachment.get_node("ShieldMount").garment_clearance = float(Wardrobe.Catalog.get_entry(glove_key).get("shield_clearance", 0.0)) if LootItems.is_equipped(inventory, "gloves") else 0.0

func _play(action: String) -> void:
	if action in ["idle", "walk", "run", "death"]:
		animation.speed_scale = 1.0
	for name in animation.get_animation_list():
		if name.ends_with(action):
			if animation.current_animation != name or not animation.is_playing():
				animation.play(name, 0.12)
			return

func _ui() -> void:
	hud = RPGHud.new()
	add_child(hud)
	hud.inventory_panel.set_character_source(character_model)
	notice = hud.notice
	hud.skill_requested.connect(_request_skill)
	hud.skill_automatic_changed.connect(_set_skill_automatic)
	hud.inventory_requested.connect(_toggle_inventory)
	hud.item_requested.connect(_use_item)
	hud.potion_settings_changed.connect(_configure_potions)
	hud.world_requested.connect(_enter_world)
	hud.rift_closed.connect(_close_rift)
	hud.return_requested.connect(_return_to_village)
	hud.next_world_requested.connect(_next_world)
	hud.chest_requested.connect(_collect_victory_chest)
	hud.rewards_closed.connect(_finish_rewards)
	class_backdrop = ColorRect.new()
	class_backdrop.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	class_backdrop.color = Color(0.01, 0.02, 0.03, 0.78)
	class_backdrop.hide()
	hud.root.add_child(class_backdrop)
	class_menu = ClassMenu.new()
	hud.root.add_child(class_menu)
	class_menu.class_requested.connect(_choose_class)
	class_menu.closed.connect(_close_classes)
	class_menu.visibility_changed.connect(func() -> void: class_backdrop.visible = class_menu.visible)
	merchant_backdrop = ColorRect.new()
	merchant_backdrop.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	merchant_backdrop.color = Color(0.01, 0.02, 0.03, 0.78)
	merchant_backdrop.hide()
	hud.root.add_child(merchant_backdrop)
	merchant_menu = MerchantMenu.new()
	hud.root.add_child(merchant_menu)
	merchant_menu.closed.connect(_close_merchant)
	merchant_menu.trade_requested.connect(_trade)
	merchant_menu.sell_selected_requested.connect(_sell_selected)
	merchant_menu.visibility_changed.connect(func() -> void: merchant_backdrop.visible = merchant_menu.visible)
	equipment_shop_backdrop = ColorRect.new()
	equipment_shop_backdrop.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	equipment_shop_backdrop.color = Color(0.01, 0.02, 0.03, 0.78)
	equipment_shop_backdrop.hide()
	hud.root.add_child(equipment_shop_backdrop)
	equipment_shop = EquipmentShop.new()
	hud.root.add_child(equipment_shop)
	equipment_shop.closed.connect(_close_equipment_shop)
	equipment_shop.purchase_requested.connect(_buy_equipment)
	equipment_shop.visibility_changed.connect(func() -> void: equipment_shop_backdrop.visible = equipment_shop.visible)
	storage_backdrop = ColorRect.new()
	storage_backdrop.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	storage_backdrop.color = Color(0.01, 0.02, 0.03, 0.78)
	storage_backdrop.hide()
	hud.root.add_child(storage_backdrop)
	storage_menu = StorageMenu.new()
	hud.root.add_child(storage_menu)
	storage_menu.closed.connect(_close_storage)
	storage_menu.transfer_requested.connect(_storage_transfer)
	storage_menu.visibility_changed.connect(func() -> void: storage_backdrop.visible = storage_menu.visible)
	_sync_class()
	_refresh_hud()

func _movement_speed(sprinting: bool) -> float:
	return (6.5 if sprinting else 4.0) * (1.0 + float(LootItems.set_bonuses(inventory, player_class).speed_percent) / 100.0)

func _maximum_hp() -> float:
	return float(PlayerClasses.get_definition(player_class).max_hp) + Balance.health_growth(level) + float(LootItems.set_bonuses(inventory, player_class).hp) + float(LootItems.jewelry_bonuses(inventory).hp)

func _sync_class() -> void:
	ground_targeting.cancel()
	LootItems.ensure_identity(inventory, player_class)
	LootItems.store_incompatible_equipment(inventory, player_class)
	_set_character_model()
	var definition := PlayerClasses.get_definition(player_class)
	hud.set_player_class(definition)
	hud.inventory_panel.set_player_class(definition)
	_apply_equipment()

func _near_trainer() -> bool:
	return current_world == 0 and player.position.distance_to(Village.CLASS_TRAINER_POSITION) <= 3.2

func _choose_class(id: String) -> bool:
	if current_world != 0 or dead or not class_menu.visible or not _near_trainer() or id not in PlayerClasses.IDS:
		return false
	LootItems.ensure_identity(inventory, player_class)
	player_class = PlayerClasses.normalize(id)
	var worn_clothing_before: int = inventory.get("equipped_loot", {}).size()
	automatic_skills.fill(false)
	skill_cooldown = 0.0
	spin_cooldown = 0.0
	guard_cooldown = 0.0
	dash_cooldown = 0.0
	guard_clock = 0.0
	dash_clock = 0.0
	hp = _maximum_hp()
	_sync_class()
	_close_classes()
	notice.text = "Classe escolhida: %s. As quatro habilidades foram atualizadas." % PlayerClasses.get_definition(player_class).name
	if inventory.get("equipped_loot", {}).size() < worn_clothing_before:
		notice.text += " Equipamentos incompatíveis voltaram à mochila."
	notice.text += " Nenhum item novo foi concedido."
	_save_profile()
	return true

func _close_classes() -> void:
	class_menu.hide()
	animation.speed_scale = 1.0
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	_refresh_hud()

func _refresh_hud() -> void:
	hud.sync(hp, _maximum_hp(), level, xp, [skill_cooldown, spin_cooldown, guard_cooldown, dash_cooldown], dead, inventory, guard_clock, auto_potion, potion_threshold, potion_clock, automatic_skills, current_world > 0 and not _instance_failed() and not _modal_open())
	hud.sync_enemies(enemies, camera)
	if arena_run != null and not _modal_open():
		hud.sync_instance(String(InstanceRun.Phase.keys()[arena_run.phase]).to_lower(), arena_run.preparation_left, arena_run.time_left, arena_run.wave, arena_run.kills, arena_run.alive)
	else:
		hud.sync_instance("", 0, 0, 0, 0, 0)
	var prompt := ""
	if not dead and not _modal_open():
		if _near_chest():
			prompt = "[E] Abrir baú de recompensa"
		elif _near_trainer():
			prompt = "[E] Instrutor · Escolher classe humana"
		elif _near_merchant():
			prompt = "[E] Bento · Comprar e vender"
		elif not _near_equipment_vendor().is_empty():
			prompt = "[E] " + ("Dara · Armaduras e joias" if _near_equipment_vendor() == "armor" else "Orin · Armas e escudos")
		elif _near_storage():
			prompt = "[E] Baú pessoal · Guardar e retirar itens"
		elif _near_portal():
			prompt = "[E] Acessar a fenda dimensional"
	hud.set_interaction_prompt(prompt)

func _instance_failed() -> bool:
	return arena_run != null and arena_run.phase == InstanceRun.Phase.FAILED

func _near_chest() -> bool:
	return is_instance_valid(reward_chest) and not reward_chest.opened and player.position.distance_to(reward_chest.position) <= 3.0

func _open_chest() -> bool:
	if dead or _modal_open() or arena_run == null or arena_run.phase != InstanceRun.Phase.VICTORY or not _near_chest():
		return false
	if not reward_chest.open():
		return false
	var reward := LootItems.create_world_drop(loot_rng, current_world)
	if not inventory.has("loot_items"):
		inventory.loot_items = []
	inventory.loot_items.append(reward)
	hud.show_chest_rewards([reward])
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	notice.text = "Baú: %s (%s) · Item recebido na mochila." % [reward.name, reward.rarity]
	_save_profile()
	_refresh_hud()
	return true

func _modal_open() -> bool:
	return hud.inventory_panel.visible or hud.rift_panel.visible or (is_instance_valid(class_menu) and class_menu.visible) or (is_instance_valid(merchant_menu) and merchant_menu.visible) or (is_instance_valid(storage_menu) and storage_menu.visible) or (is_instance_valid(equipment_shop) and equipment_shop.visible) or hud.run_result_panel.visible or hud.chest_rewards_panel.visible

func _near_equipment_vendor() -> String:
	if current_world != 0: return ""
	if player.position.distance_to(Village.ARMOR_MERCHANT_POSITION) <= 2.8: return "armor"
	if player.position.distance_to(Village.WEAPON_MERCHANT_POSITION) <= 2.8: return "weapons"
	return ""

func _close_equipment_shop() -> void:
	equipment_shop.hide()
	animation.speed_scale = 1.0
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	_refresh_hud()

func _buy_equipment(vendor: String, id: String) -> bool:
	if dead or not equipment_shop.visible or vendor != equipment_shop.vendor or _near_equipment_vendor() != vendor: return false
	var result := GearCatalog.purchase(inventory, vendor, id)
	equipment_shop.sync_inventory(inventory, player_class)
	equipment_shop.status_label.text = result.message
	if result.ok:
		_refresh_hud()
		_save_profile()
	return result.ok

func _near_storage() -> bool:
	return current_world == 0 and player.position.distance_to(Village.STORAGE_POSITION) <= 2.8

func _close_storage() -> void:
	storage_menu.hide()
	animation.speed_scale = 1.0
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	_refresh_hud()

func _storage_transfer(direction: String, id: String, quantity: int) -> bool:
	if dead or not storage_menu.visible or not _near_storage(): return false
	var result := StorageItems.transfer(inventory, direction, id, quantity)
	storage_menu.sync_inventory(inventory, player_class)
	storage_menu.status_label.text = result.message
	if result.ok:
		_refresh_hud()
		_save_profile()
	return result.ok

func _sell_selected(selection: Dictionary) -> bool:
	if dead or not merchant_menu.visible or not _near_merchant(): return false
	var result := MerchantStock.sell_selected(inventory, selection)
	if result.ok: merchant_menu.sale_selection.clear()
	merchant_menu.sync_inventory(inventory, player_class)
	merchant_menu.status_label.text = result.message
	if result.ok:
		_refresh_hud()
		_save_profile()
	return result.ok

func _near_merchant() -> bool:
	return current_world == 0 and player.position.distance_to(Village.MERCHANT_POSITION) <= 3.2

func _close_merchant() -> void:
	merchant_menu.hide()
	animation.speed_scale = 1.0
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	_refresh_hud()

func _trade(mode: String, id: String, quantity: int) -> bool:
	if dead or not merchant_menu.visible or not _near_merchant():
		return false
	var result := MerchantStock.trade(inventory, mode, id, quantity)
	merchant_menu.sync_inventory(inventory, player_class)
	merchant_menu.status_label.text = result.message
	if not result.ok:
		return false
	_refresh_hud()
	_save_profile()
	return true

func _near_portal() -> bool:
	return current_world == 0 and Vector2(player.position.x - portal_position.x, player.position.z - portal_position.z).length() <= 4.0

func _interact() -> bool:
	if dead or attack_clock > 0 or _modal_open():
		return false
	var vendor := _near_equipment_vendor()
	if not vendor.is_empty():
		equipment_shop.open_shop(vendor, inventory, player_class)
		hud.potion_popup.hide()
		animation.speed_scale = 0.0
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
		return true
	if _near_chest():
		return _open_chest()
	if _near_storage():
		storage_menu.sync_inventory(inventory, player_class)
		storage_menu.show()
		hud.potion_popup.hide()
		animation.speed_scale = 0.0
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
		return true
	if _near_merchant():
		merchant_menu.sync_inventory(inventory, player_class)
		merchant_menu.show()
		hud.potion_popup.hide()
		animation.speed_scale = 0.0
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
		return true
	if _near_trainer():
		class_menu.show_classes(player_class)
		hud.potion_popup.hide()
		animation.speed_scale = 0.0
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
		return true
	if not _near_portal():
		return false
	if current_world == 0:
		hud.show_rift(progress.unlocked_world(), progress.completed_worlds)
		animation.speed_scale = 0.0
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	else:
		_return_to_village()
	return true

func _close_rift() -> void:
	hud.rift_panel.hide()
	animation.speed_scale = 1.0
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	_refresh_hud()

func _enter_world(number: int) -> bool:
	if current_world != 0 or dead or not hud.rift_panel.visible or not progress.can_enter(number):
		return false
	_change_zone(number)
	return true

func _return_to_village() -> void:
	_change_zone(0)
	_save_profile()

func _next_world() -> bool:
	if current_world <= 0 or current_world >= WorldCatalog.COUNT or arena_run == null or arena_run.phase != InstanceRun.Phase.VICTORY or not is_instance_valid(reward_chest) or not reward_chest.opened or not progress.can_enter(current_world + 1) or hud.chest_rewards_panel.visible:
		return false
	_change_zone(current_world + 1)
	hp = _maximum_hp()
	_save_profile()
	return true

func _collect_victory_chest() -> void:
	if arena_run == null or arena_run.phase != InstanceRun.Phase.VICTORY or not is_instance_valid(reward_chest) or reward_chest.opened:
		return
	# The victory shortcut collects the real chest; E remains available nearby.
	player.position = reward_chest.position + Vector3(0, 0.05, 2.0)
	_open_chest()

func _finish_rewards() -> void:
	if arena_run != null and arena_run.phase == InstanceRun.Phase.VICTORY:
		hud.show_run_result(true, current_world, "", false)
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	_refresh_hud()

func _change_zone(number: int) -> void:
	ground_targeting.cancel()
	hud.inventory_panel.hide()
	hud.rift_panel.hide()
	hud.potion_popup.hide()
	hud.hide_run_result()
	hud.hide_chest_rewards()
	class_menu.hide()
	merchant_menu.hide()
	equipment_shop.hide()
	storage_menu.hide()
	class_combat.cancel(self)
	enemy_ranged_combat.cancel()
	animation.speed_scale = 1.0
	hud.focus_enemy = null
	enemies.clear()
	if arena_run != null:
		arena_run.stop()
	arena_run = null
	reward_chest = null
	if is_instance_valid(active_zone):
		remove_child(active_zone)
		active_zone.queue_free()
	current_world = number
	instance_kills = 0
	instance_goal = 0
	dead = false
	attack_pending = false
	attack_clock = 0.0
	cooldown = 0.0
	skill_cooldown = 0.0
	spin_cooldown = 0.0
	guard_cooldown = 0.0
	dash_cooldown = 0.0
	guard_clock = 0.0
	dash_clock = 0.0
	potion_clock = 0.0
	player.velocity = Vector3.ZERO
	yaw = 0.0
	pitch = -0.10
	facing.rotation.y = 0.0
	if number == 0:
		active_zone = VILLAGE_SCENE.instantiate()
		active_zone.name = "Village"
		player.position = Village.SPAWN
		portal_position = Village.PORTAL_POSITION
		hp = _maximum_hp()
	else:
		active_zone = COMBAT_SCENE.instantiate()
		active_zone.name = "OpenField"
		active_zone.configure(WorldCatalog.get_world(number))
		player.position = Vector3(0, 0.05, 17)
		portal_position = Vector3.ZERO
	add_child(active_zone)
	if number > 0:
		instance_goal = InstanceRun.TOTAL_MONSTERS
		arena_run = InstanceRun.new()
		arena_run.wave_requested.connect(_spawn_enemies)
		arena_run.boss_requested.connect(_spawn_boss)
		arena_run.completed.connect(_complete_instance)
		arena_run.failed.connect(_fail_instance)
		arena_run.begin()
	_play("idle")
	_update_location()
	notice.text = "Prepare-se: os monstros chegam em 30 segundos." if number > 0 else ""
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED if not smoke else Input.MOUSE_MODE_VISIBLE
	_refresh_hud()

func _update_location() -> void:
	if current_world == 0:
		hud.set_location("VILA DA FENDA", "E · Instrutor, mercador, baú pessoal ou fenda dimensional", true)
	else:
		var definition := WorldCatalog.get_world(current_world)
		var objective := "Vença seis ondas e derrote o chefe para receber o baú."
		if arena_run != null and arena_run.phase == InstanceRun.Phase.PREPARATION:
			objective = "Prepare seus equipamentos antes da primeira onda."
		elif _instance_failed():
			objective = "Instância encerrada · Retorne à vila pelo painel."
		elif arena_run != null and arena_run.phase == InstanceRun.Phase.BOSS:
			objective = "CHEFE · Guardião da Fenda · Desvie do ataque carregado!"
		elif arena_run != null and arena_run.phase == InstanceRun.Phase.VICTORY:
			objective = "Mundo concluído · Abra o baú no centro da arena com E."
		hud.set_location("MUNDO %d · %s" % [current_world, definition.subtitle], objective, false)

func _complete_instance() -> void:
	ground_targeting.cancel()
	enemy_ranged_combat.cancel()
	var unlocked := progress.complete_world(current_world)
	reward_chest = RewardChest.new()
	reward_chest.name = "RewardChest"
	reward_chest.position = Vector3(0, 0, -1)
	active_zone.add_child(reward_chest)
	notice.text = "Chefe derrotado! Você conquistou o baú desta instância."
	if unlocked and current_world < WorldCatalog.COUNT:
		notice.text += " Mundo %d liberado." % (current_world + 1)
	_update_location()
	hud.show_run_result(true, current_world, "", true)
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	_save_profile()

func _fail_instance(reason: String) -> void:
	ground_targeting.cancel()
	enemy_ranged_combat.cancel()
	attack_pending = false
	attack_clock = 0.0
	notice.text = "Tempo esgotado! Retorne à vila para tentar novamente." if reason == "timeout" else "Você caiu. Retorne à vila para tentar novamente."
	hud.potion_popup.hide()
	hud.show_run_result(false, current_world, reason, false)
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	_update_location()

func _load_profile() -> void:
	var state: Dictionary = progress.load_profile()
	player_class = PlayerClasses.normalize(str(state.get("player_class", "tanque")))
	level = maxi(1, int(state.get("level", 1)))
	xp = clampi(int(state.get("xp", 0)), 0, Balance.xp_needed(level) - 1)
	kills = maxi(0, int(state.get("kills", 0)))
	var saved_inventory: Variant = state.get("inventory", {})
	if saved_inventory is Dictionary:
		for key in LootItems.BASE_KEYS.values():
			inventory[key] = bool(saved_inventory.get(key, key not in LootItems.JEWELRY_SLOTS))
		for key in ["potions", "fangs", "gold"]:
			inventory[key] = clampi(int(saved_inventory.get(key, inventory[key])), 0, 999999)
		LootItems.restore_items(inventory, saved_inventory, player_class)
	auto_potion = bool(state.get("auto_potion", false))
	potion_threshold = clampf(float(state.get("potion_threshold", 40)), 10, 90)
	var saved_skills: Variant = state.get("automatic_skills", [])
	if saved_skills is Array:
		for index in mini(saved_skills.size(), 4):
			automatic_skills[index] = bool(saved_skills[index])
	_sync_class()

func _save_profile() -> void:
	if smoke:
		return
	var result := progress.save_profile({"player_class": player_class, "level": level, "xp": xp, "kills": kills, "inventory": inventory.duplicate(true), "auto_potion": auto_potion, "potion_threshold": potion_threshold, "automatic_skills": automatic_skills.duplicate()})
	if result != OK and not save_error_reported:
		save_error_reported = true
		push_warning("Não foi possível salvar o progresso: " + error_string(result))

func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_CLOSE_REQUEST:
		_save_profile()

func _toggle_inventory() -> void:
	ground_targeting.cancel()
	if _modal_open() and not hud.inventory_panel.visible:
		return
	hud.inventory_panel.visible = not hud.inventory_panel.visible
	if hud.inventory_panel.visible:
		hud.reward_panel.hide()
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE if hud.inventory_panel.visible else Input.MOUSE_MODE_CAPTURED
	animation.speed_scale = 0.0 if hud.inventory_panel.visible else 1.0
	_refresh_hud()

func _use_item(item: String) -> bool:
	if dead or hud.rift_panel.visible or class_menu.visible or merchant_menu.visible or storage_menu.visible or equipment_shop.visible or hud.run_result_panel.visible or hud.chest_rewards_panel.visible:
		return false
	if attack_clock > 0 and item != "potion":
		return false
	if item.begins_with("loot_equip:"):
		if not LootItems.equip_item(inventory, item.trim_prefix("loot_equip:"), player_class):
			return false
		_apply_equipment()
	elif item.begins_with("loot_remove:"):
		if not LootItems.unequip_slot(inventory, item.trim_prefix("loot_remove:")):
			return false
		_apply_equipment()
	elif item in LootItems.SLOTS:
		if int(inventory.get("identity_version", 0)) >= 1:
			if LootItems.is_equipped(inventory, item):
				LootItems.unequip_slot(inventory, item)
			else:
				var owned: Array = inventory.loot_items.filter(func(value: Dictionary) -> bool: return value.slot == item and LootItems.Catalog.compatible(value, player_class))
				if owned.is_empty() or not LootItems.equip_item(inventory, owned[0].id, player_class): return false
			_apply_equipment()
			hp = minf(hp, _maximum_hp())
			_refresh_hud()
			_save_profile()
			return true
		var key: String = LootItems.BASE_KEYS[item]
		if not LootItems.equipped_item(inventory, item).is_empty():
			LootItems.unequip_slot(inventory, item)
			inventory[key] = true
		else:
			inventory[key] = not bool(inventory[key])
		_apply_equipment()
	elif item == "potion":
		if inventory.potions <= 0 or hp >= _maximum_hp() or potion_clock > 0:
			return false
		potion_clock = 2.0
		inventory.potions -= 1
		hp = minf(_maximum_hp(), hp + 40.0)
	else:
		return false
	hp = minf(hp, _maximum_hp())
	_refresh_hud()
	_save_profile()
	return true

func _configure_potions(enabled: bool, threshold: float) -> void:
	auto_potion = enabled
	potion_threshold = clampf(threshold, 10, 90)
	_refresh_hud()
	_save_profile()

func _auto_potion_step(delta: float) -> void:
	potion_clock = maxf(0, potion_clock - delta)
	if current_world > 0 and auto_potion and not dead and hp > 0 and hp / _maximum_hp() * 100.0 <= potion_threshold:
		_use_item("potion")

func _request_skill(slot: int) -> bool:
	if ground_targeting.active() and ground_targeting.slot == slot:
		ground_targeting.cancel()
		return true
	ground_targeting.cancel()
	if not class_combat.ground_area(player_class, slot).is_empty():
		if not class_combat.can_activate(self, slot): return false
		ground_targeting.begin(self, slot)
		return true
	return _activate_skill(slot)

func _activate_skill(slot: int, ground_point := Vector3.INF) -> bool:
	if current_world == 0 or _instance_failed() or dead or _modal_open():
		return false
	if player_class != "tanque":
		return class_combat.activate_skill(self, slot, ground_point)
	match slot:
		0:
			return _attack(true)
		1:
			if spin_cooldown > 0 or not _attack():
				return false
			attack_kind = 2
			spin_cooldown = 8.0
			_play("skill")
		2:
			if guard_cooldown > 0:
				return false
			guard_cooldown = 12.0
			guard_clock = 4.0
		3:
			if dash_cooldown > 0:
				return false
			dash_cooldown = 7.0
			dash_clock = 0.32
			dash_direction = Vector3.FORWARD.rotated(Vector3.UP, yaw)
		_:
			return false
	_refresh_hud()
	return true

func _set_skill_automatic(slot: int, enabled: bool) -> void:
	if slot >= 0 and slot < automatic_skills.size():
		automatic_skills[slot] = enabled
		_refresh_hud()
		_save_profile()

func _automatic_skills_step() -> void:
	if current_world == 0 or _instance_failed() or dead or attack_clock > 0 or _modal_open() or ground_targeting.active():
		return
	var ready: Array[bool] = [false, false, false, false]
	if player_class != "tanque":
		ready = class_combat.auto_ready(self)
		for slot in range(automatic_skills.size()):
			if automatic_skills[slot] and ready[slot] and _activate_skill(slot):
				break
		return
	for foe in enemies:
		var offset := foe.global_position - player.global_position
		offset.y = 0
		var distance := offset.length()
		var in_front := offset.normalized().dot(Vector3.FORWARD.rotated(Vector3.UP, yaw)) > 0.35
		ready[0] = ready[0] or (distance <= 3.6 and in_front)
		ready[1] = ready[1] or distance <= 3.2
		ready[2] = ready[2] or distance <= 2.5
		ready[3] = ready[3] or (distance >= 4.5 and distance <= 8.0 and in_front)
	for slot in range(automatic_skills.size()):
		if automatic_skills[slot] and ready[slot] and _activate_skill(slot):
			break

func _spawn_enemies(wave_number: int = 1) -> void:
	if current_world == 0 or not enemies.is_empty():
		return
	var definition := WorldCatalog.get_world(current_world)
	var stats := Balance.enemy(current_world, level, wave_number)
	var combatants := active_zone.get_node_or_null("Combatants")
	if combatants == null:
		combatants = Node3D.new()
		combatants.name = "Combatants"
		active_zone.add_child(combatants)
	for index in definition.enemy_spawns.size():
		var point: Vector3 = definition.enemy_spawns[index]
		var role := EnemyRangedCombat.role_for(current_world, wave_number, index)
		var foe := CharacterBody3D.new()
		foe.position = point
		var health_scale := 0.8 if role == "archer" else 0.9 if role == "caster" else 1.0
		foe.set_meta("role", role)
		foe.set_meta("display_name", "Esqueleto arqueiro" if role == "archer" else "Xamã da Fenda" if role == "caster" else "Grelim")
		foe.set_meta("bar_height", 2.5 if role == "caster" else 2.2 if role == "archer" else 2.05)
		foe.set_meta("hp", float(stats.hp) * health_scale)
		foe.set_meta("maximum_hp", float(stats.hp) * health_scale)
		foe.set_meta("damage", float(stats.damage) * (0.7 if role == "archer" else 0.8 if role == "caster" else 1.0))
		foe.set_meta("speed", float(stats.speed))
		foe.set_meta("attack", 0.0 if role == "melee" else 1.2 + index * 0.35)
		var collision := CollisionShape3D.new()
		var shape := SphereShape3D.new()
		shape.radius = 0.65
		collision.shape = shape
		collision.position.y = 0.7
		foe.add_child(collision)
		var visual = GrelimVisual.new() if role == "melee" else RangedMonsterVisual.new()
		if role != "melee": visual.kind = role
		visual.name = "GrelimVisual"
		foe.add_child(visual)
		combatants.add_child(foe)
		enemies.append(foe)
	notice.text = "Onda %d / 6 · Derrote os cinco monstros." % wave_number
	_update_location()

func _spawn_boss() -> void:
	if current_world == 0 or not enemies.is_empty() or arena_run.phase != InstanceRun.Phase.BOSS:
		return
	var foe := CharacterBody3D.new()
	foe.name = "RiftGuardian"
	foe.position = Vector3(0, 0.05, -7)
	var stats := Balance.enemy(current_world, level)
	var maximum := float(stats.hp) * 8.0 + current_world * 80.0
	foe.set_meta("hp", maximum)
	foe.set_meta("maximum_hp", maximum)
	foe.set_meta("damage", float(stats.damage) * 3.0)
	foe.set_meta("speed", 3.0 + current_world * 0.06)
	foe.set_meta("fight_time", 0.0)
	foe.set_meta("attack", 1.5)
	foe.set_meta("windup", 0.0)
	foe.set_meta("is_boss", true)
	foe.set_meta("display_name", "Guardião da Fenda · CHEFE")
	foe.set_meta("bar_height", 3.8)
	var collision := CollisionShape3D.new()
	var shape := CapsuleShape3D.new()
	shape.radius = 0.9
	shape.height = 2.9
	collision.shape = shape
	collision.position.y = 1.45
	foe.add_child(collision)
	var visual := ArenaBossVisual.new()
	visual.name = "GrelimVisual"
	foe.add_child(visual)
	active_zone.get_node("Combatants").add_child(foe)
	enemies.append(foe)
	hud.focus_enemy = foe
	notice.text = "O Guardião da Fenda despertou! Saia da área vermelha antes do impacto."
	_update_location()

func _boss_step(foe: CharacterBody3D, delta: float) -> void:
	if dead:
		return
	var visual := foe.get_node("GrelimVisual")
	var fight_time := float(foe.get_meta("fight_time", 0.0)) + delta
	foe.set_meta("fight_time", fight_time)
	var rage := minf(1.5, 1.0 + floorf(fight_time / 35.0) * 0.1)
	var windup := float(foe.get_meta("windup", 0.0))
	var direction := player.position - foe.position
	direction.y = 0.0
	if windup > 0.0:
		windup = maxf(0.0, windup - delta)
		foe.set_meta("windup", windup)
		foe.velocity = Vector3(0, -5, 0)
		foe.move_and_slide()
		if windup <= 0.0:
			var marker: Node3D = (foe.get_meta("danger_marker") if foe.has_meta("danger_marker") else null)
			var impact: Vector3 = foe.get_meta("impact_position")
			if is_instance_valid(marker):
				marker.queue_free()
			foe.set_meta("danger_marker", null)
			var offset := player.position - impact
			offset.y = 0
			if offset.length() <= 2.8:
				_receive_damage(float(foe.get_meta("damage")) * rage, true)
			visual.set_motion("attack")
			foe.set_meta("attack", 2.2 / rage)
		return
	var timer := maxf(0.0, float(foe.get_meta("attack")) - delta)
	foe.set_meta("attack", timer)
	if direction.length() <= 24.0 and timer <= 0.0:
		var impact := player.position
		impact.y = 0.04
		foe.set_meta("impact_position", impact)
		foe.set_meta("windup", 0.85)
		foe.set_meta("danger_marker", _danger_marker(impact))
		visual.set_motion("windup")
		return
	var desired := direction.normalized() * float(foe.get_meta("speed", 3.0)) * rage if direction.length() > 2.5 and timer < 1.6 else Vector3.ZERO
	foe.velocity = Vector3(move_toward(foe.velocity.x, desired.x, delta * 6.0), -5, move_toward(foe.velocity.z, desired.z, delta * 6.0))
	foe.move_and_slide()
	if direction.length() > 0.1 and timer < 1.6:
		foe.rotation.y = lerp_angle(foe.rotation.y, atan2(-direction.x, -direction.z), 1.0 - exp(-5 * delta))
	if timer < 1.6:
		visual.set_motion("walk" if desired.length() > 0.2 else "idle")

func _danger_marker(at: Vector3) -> Node3D:
	var marker := Node3D.new()
	marker.name = "BossDangerArea"
	active_zone.add_child(marker)
	marker.position = at
	var material := _material(Color(0.9, 0.12, 0.04, 0.24))
	material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	var disk := MeshInstance3D.new()
	var shape := CylinderMesh.new()
	shape.top_radius = 2.8
	shape.bottom_radius = 2.8
	shape.height = 0.012
	shape.radial_segments = 64
	disk.mesh = shape
	disk.material_override = material
	disk.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	marker.add_child(disk)
	var edge := MeshInstance3D.new()
	var ring := TorusMesh.new()
	ring.inner_radius = 2.73
	ring.outer_radius = 2.8
	ring.rings = 64
	ring.ring_segments = 6
	edge.mesh = ring
	edge.material_override = _material(Color("f75b36"))
	edge.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	marker.add_child(edge)
	return marker

func _receive_damage(amount: float, magical := false) -> void:
	var defense := float(LootItems.bonuses(inventory, player_class).defense) + (float(LootItems.jewelry_bonuses(inventory).magic_defense) if magical else 0.0)
	var damage := Balance.incoming_damage(amount, defense)
	hp = maxf(0.0, hp - damage * (0.35 if guard_clock > 0 else 1.0))
	if hp <= 0 and not dead:
		dead = true
		attack_pending = false
		player.velocity = Vector3.ZERO
		_play("death")
		arena_run.fail("death")

func _input(event: InputEvent) -> void:
	# TAB também funciona quando um controle da interface está com foco.
	if event is InputEventKey and event.keycode == KEY_TAB and event.pressed and not event.echo:
		if equipment_shop.visible:
			_close_equipment_shop()
		elif storage_menu.visible:
			_close_storage()
		elif merchant_menu.visible:
			_close_merchant()
		elif class_menu.visible:
			_close_classes()
		elif hud.rift_panel.visible:
			_close_rift()
		else:
			_toggle_inventory()
		get_viewport().set_input_as_handled()

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_R and (dead or _instance_failed()) and current_world > 0:
			_return_to_village()
			return
		if event.keycode == KEY_I:
			_toggle_inventory()
			return
		if event.keycode == KEY_ESCAPE:
			if ground_targeting.active():
				ground_targeting.cancel()
			elif equipment_shop.visible:
				_close_equipment_shop()
			elif storage_menu.visible:
				_close_storage()
			elif merchant_menu.visible:
				_close_merchant()
			elif class_menu.visible:
				_close_classes()
			elif hud.rift_panel.visible:
				_close_rift()
			elif hud.potion_popup.visible:
				hud.potion_popup.hide()
			elif hud.inventory_panel.visible:
				_toggle_inventory()
			else:
				Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
			return
		if _modal_open():
			return
		if event.keycode == KEY_R:
			if dead or _instance_failed():
				_return_to_village()
		elif event.keycode == KEY_E:
			_interact()
		elif event.keycode == KEY_Q:
			_use_item("potion")
		elif event.keycode >= KEY_1 and event.keycode <= KEY_4:
			_request_skill(event.keycode - KEY_1)
	if _modal_open():
		return
	if event is InputEventMouseButton and event.pressed:
		if ground_targeting.active() and event.button_index in [MOUSE_BUTTON_LEFT, MOUSE_BUTTON_RIGHT]:
			if event.button_index == MOUSE_BUTTON_RIGHT: ground_targeting.cancel()
			else:
				ground_targeting.update(self)
				ground_targeting.confirm(self)
			get_viewport().set_input_as_handled()
			return
		elif event.button_index == MOUSE_BUTTON_WHEEL_UP:
			zoom_distance = clampf(zoom_distance - 0.8, 2.0, 14.0)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			zoom_distance = clampf(zoom_distance + 0.8, 2.0, 14.0)
		elif event.button_index == MOUSE_BUTTON_LEFT:
			if Input.mouse_mode != Input.MOUSE_MODE_CAPTURED:
				Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
			else:
				_attack()
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		yaw -= event.relative.x * 0.003
		pitch = clampf(pitch - event.relative.y * 0.003, -1.0, 0.45)

func _physics_process(delta: float) -> void:
	if _modal_open():
		_refresh_hud()
		return
	if arena_run != null:
		arena_run.tick(delta)
		if _modal_open():
			_refresh_hud()
			return
	class_combat.tick(self, delta)
	if _modal_open():
		_refresh_hud()
		return
	boom.rotation = Vector3(pitch, yaw, 0)
	boom.spring_length = lerpf(boom.spring_length, zoom_distance, 1.0 - exp(-10.0 * delta))
	spin_cooldown = maxf(0, spin_cooldown - delta)
	guard_cooldown = maxf(0, guard_cooldown - delta)
	dash_cooldown = maxf(0, dash_cooldown - delta)
	guard_clock = maxf(0, guard_clock - delta)
	dash_clock = maxf(0, dash_clock - delta)
	cooldown = maxf(0, cooldown - delta)
	skill_cooldown = maxf(0, skill_cooldown - delta)
	if not dead:
		var input := Input.get_vector("left", "right", "forward", "back")
		var direction := Vector3(input.x, 0, input.y).rotated(Vector3.UP, yaw)
		var speed := _movement_speed(Input.is_action_pressed("sprint"))
		if dash_clock > 0:
			direction = dash_direction
			speed = 14.0
		player.velocity.x = direction.x * speed
		player.velocity.z = direction.z * speed
		if not player.is_on_floor():
			player.velocity.y -= 20 * delta
		elif Input.is_action_just_pressed("jump"):
			player.velocity.y = 7
		player.move_and_slide()
		var boundary := Village.BOUNDARY - 1.0 if current_world == 0 else OpenField.ARENA_BOUNDARY - 0.5
		player.position.x = clampf(player.position.x, -boundary, boundary)
		player.position.z = clampf(player.position.z, -boundary, boundary)
		if attack_clock > 0:
			attack_clock = maxf(0, attack_clock - delta)
			if attack_pending and attack_clock <= 0.75:
				attack_pending = false
				_melee_hit()
		else:
			if direction.length() > 0.1:
				facing.rotation.y = lerp_angle(facing.rotation.y, atan2(-direction.x, -direction.z), delta * 12)
				_play("run" if Input.is_action_pressed("sprint") or dash_clock > 0 else "walk")
			else:
				_play("idle")
	else:
		player.velocity.y -= 20 * delta
		player.move_and_slide()
	_enemies_step(delta)
	if ground_targeting.active(): ground_targeting.update(self)
	_auto_potion_step(delta)
	_automatic_skills_step()
	_refresh_hud()

func _attack(powered := false) -> bool:
	if ground_targeting.active(): return false
	if player_class != "tanque":
		return class_combat.basic_attack(self, powered)
	if current_world == 0 or _instance_failed() or dead or _modal_open() or not LootItems.is_equipped(inventory, "sword") or cooldown > 0 or (powered and skill_cooldown > 0):
		return false
	powered_attack = powered
	attack_kind = 1 if powered else 0
	if powered:
		skill_cooldown = 6.0
	cooldown = 1.57 if powered else 1.54
	attack_clock = cooldown
	attack_pending = true
	attack_direction = Vector3.FORWARD.rotated(Vector3.UP, yaw)
	facing.rotation.y = yaw
	_play("skill" if powered else "attack")
	return true

func _melee_hit() -> void:
	if current_world == 0:
		return
	# Um golpe por ação; só acerta inimigos próximos, à frente e sem parede entre eles.
	if attack_kind > 0:
		_skill_arc()
	if attack_kind == 2:
		class_combat._field(self, player.global_position, Color("8ce9ff"), 3.2, 3.0, 0, true, class_combat._damage(self, 40) * 0.2, 0.5)
	var reach := 3.2 if attack_kind == 2 else (3.6 if powered_attack else 2.6)
	for foe in enemies.duplicate():
		var offset: Vector3 = foe.global_position - player.global_position
		offset.y = 0
		if offset.length() > reach or (attack_kind != 2 and offset.normalized().dot(attack_direction) < 0.35):
			continue
		var query := PhysicsRayQueryParameters3D.create(player.global_position + Vector3.UP, foe.global_position + Vector3.UP * 0.7)
		query.exclude = [player.get_rid()]
		var hit := get_world_3d().direct_space_state.intersect_ray(query)
		if not hit.is_empty() and hit.collider == foe:
			_damage_enemy(foe, (40.0 if attack_kind == 2 else (60.0 if powered_attack else 25.0)) + Balance.attack_growth(level) + LootItems.bonuses(inventory, player_class).attack)

func _skill_arc() -> void:
	var visual := MeshInstance3D.new()
	var mesh := ImmediateMesh.new()
	var material := StandardMaterial3D.new()
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	material.albedo_color = Color("8ce9ff")
	material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	material.cull_mode = BaseMaterial3D.CULL_DISABLED
	mesh.surface_begin(Mesh.PRIMITIVE_TRIANGLE_STRIP, material)
	for i in range(33):
		var sweep := PI if attack_kind == 2 else 1.15
		var angle := lerpf(-sweep, sweep, i / 32.0)
		for radius in [2.1, 2.45]:
			mesh.surface_add_vertex(Vector3(sin(angle) * radius, 0.8, -cos(angle) * radius))
	mesh.surface_end()
	visual.mesh = mesh
	add_child(visual)
	visual.position = player.position
	visual.rotation.y = facing.rotation.y
	var tween := create_tween()
	tween.tween_property(visual, "scale", Vector3.ONE * 1.35, 0.3)
	tween.parallel().tween_property(material, "albedo_color:a", 0.0, 0.3)
	tween.tween_callback(visual.queue_free)

func _damage_enemy(foe: CharacterBody3D, amount: float) -> void:
	if current_world == 0 or arena_run == null or arena_run.phase not in [InstanceRun.Phase.COMBAT, InstanceRun.Phase.BOSS] or not is_instance_valid(foe) or foe not in enemies:
		return
	hud.focus_enemy = foe
	var health := float(foe.get_meta("hp")) - amount
	foe.set_meta("hp", health)
	foe.get_node("GrelimVisual").hurt()
	if health <= 0:
		enemies.erase(foe)
		foe.collision_layer = 0
		foe.collision_mask = 0
		foe.get_node("GrelimVisual").fall()
		var marker: Variant = (foe.get_meta("danger_marker") if foe.has_meta("danger_marker") else null)
		if is_instance_valid(marker):
			marker.queue_free()
		get_tree().create_timer(2.0).timeout.connect(foe.queue_free)
		var is_boss := bool(foe.get_meta("is_boss", false))
		inventory.fangs += 3 if is_boss else 1
		inventory.gold += 50 if is_boss else 5
		if not smoke and not is_boss and loot_rng.randf() < 0.18:
			var dropped := LootItems.create_world_drop(loot_rng, current_world)
			inventory.loot_items.append(dropped)
			hud.show_reward(dropped)
		var previous_maximum := _maximum_hp()
		xp += Balance.experience(current_world, is_boss)
		kills += 1
		if not is_boss:
			instance_kills += 1
		while xp >= Balance.xp_needed(level):
			xp -= Balance.xp_needed(level)
			level += 1
		hp = minf(_maximum_hp(), hp + maxf(0, _maximum_hp() - previous_maximum))
		if is_boss:
			arena_run.boss_defeated()
		else:
			arena_run.monster_defeated()
		_update_location()
		_save_profile()

func _enemies_step(delta: float) -> void:
	if current_world == 0 or arena_run == null or arena_run.phase not in [InstanceRun.Phase.COMBAT, InstanceRun.Phase.BOSS]:
		return
	enemy_ranged_combat.tick(self, delta)
	for foe in enemies:
		if bool(foe.get_meta("is_boss", false)):
			_boss_step(foe, delta)
			continue
		if str(foe.get_meta("role", "melee")) != "melee":
			enemy_ranged_combat.step(self, foe, delta)
			continue
		var direction := player.position - foe.position
		direction.y = 0
		var distance := direction.length()
		var desired := direction.normalized() * float(foe.get_meta("speed", 2.5)) if distance > 1.3 and not dead else Vector3.ZERO
		foe.velocity.x = move_toward(foe.velocity.x, desired.x, delta * 5.0)
		foe.velocity.z = move_toward(foe.velocity.z, desired.z, delta * 5.0)
		foe.velocity.y = -5
		foe.move_and_slide()
		var timer := maxf(0, float(foe.get_meta("attack")) - delta)
		if distance < 1.6 and timer <= 0 and not dead:
			_receive_damage(float(foe.get_meta("damage", 12.0)))
			timer = 1.2
		foe.set_meta("attack", timer)
		if direction.length() > 0.1:
			foe.rotation.y = lerp_angle(foe.rotation.y, atan2(-direction.x, -direction.z), 1.0 - exp(-7.0 * delta))
		foe.get_node("GrelimVisual").sync(delta, Vector2(foe.velocity.x, foe.velocity.z).length() > 0.2, timer > 1.0)

func _reset_test_combat() -> void:
	# Isolated fixture for the original combat checks; it never writes a save.
	hp = 100
	potion_clock = 0
	level = 1
	player_class = "tanque"
	_sync_class()
	xp = 0
	kills = 0
	inventory = {"equipped": true, "armor": true, "pants": true, "equipment_version": 2, "gloves": true, "boots": true, "shield": true, "potions": 3, "fangs": 0, "gold": 0}
	sword_attachment.visible = true
	shield_attachment.visible = true
	shield_carry_pose.shield_equipped = true
	_apply_equipment()
	powered_attack = false
	_change_zone(1)
	arena_run.tick(InstanceRun.PREPARATION_TIME)

func _check(ok: bool, description: String) -> void:
	if not ok:
		failures += 1
		push_error(description)
	else:
		print("PASS: " + description)

func _test() -> void:
	_check(current_world == 0 and enemies.is_empty() and active_zone.name == "Village", "jogo inicia na vila segura, sem monstros")
	_check(not _attack() and not _activate_skill(3), "vila segura bloqueia ataques e investida")
	_reset_test_combat()
	_check(animation != null, "Fighter 3D com esqueleto importado")
	for action in ["idle", "walk", "run", "attack", "skill", "death"]:
		_play(action)
		_check(animation.current_animation.ends_with(action), "animação Fighter: " + action)
	_check(enemies[0].get_node("GrelimVisual").limbs.size() == 4, "Grelims têm corpo e membros 3D no lugar das esferas")
	_check(shield_attachment.bone_name == "Shield_L_Bone", "escudo vinculado ao braço esquerdo")
	_check(_use_item("shield") and not shield_attachment.visible, "escudo pode ser guardado no inventário")
	_check(_use_item("shield") and shield_attachment.visible, "escudo pode ser equipado novamente")
	_check(sword_attachment.bone_name == "Weapon_R_Bone", "espada vinculada à mão pelo osso da arma")
	_check(sword_attachment.has_node("Sword/OriginalLongSword"), "espada usa modelo original do cliente")
	var blade: Node3D = sword_attachment.get_node("Sword/OriginalLongSword")
	_check(blade.basis.x.normalized().dot(Vector3.RIGHT) > 0.99, "lâmina preserva eixo nativo do socket")
	var rig: Skeleton3D = character_model.find_children("*", "Skeleton3D", true, false)[0]
	_check(rig.find_bone("neutral_bone") == -1, "equipamentos não contêm influência sem osso que deforma a luva")
	_check(OpenField.SIZE == Village.BOUNDARY * 2.0 and has_node("OpenField/FieldCollision"), "arena tem o mesmo tamanho da vila e chão físico")
	await _test_weapon_alignment()
	await get_tree().physics_frame
	enemies[0].position = player.position + Vector3(0, 0, -2)
	enemies[1].position = player.position + Vector3(0, 0, 2)
	await get_tree().physics_frame
	_check(_attack(), "ataque manual inicia golpe")
	_check(not _attack(), "recarga impede golpe duplicado")
	_check(float(enemies[0].get_meta("hp")) == 60.0, "dano aguarda o momento do golpe")
	_melee_hit()
	_check(float(enemies[0].get_meta("hp")) == 35.0, "golpe atinge inimigo próximo à frente")
	_check(float(enemies[1].get_meta("hp")) == 60.0 and float(enemies[2].get_meta("hp")) == 60.0, "golpe não atinge inimigo atrás ou distante")
	cooldown = 0.0
	_check(_attack(true) and skill_cooldown == 6.0, "habilidade manual inicia ataque forte e recarga")
	_melee_hit()
	_check(enemies.size() == 4, "skill causa dano reforçado no inimigo à frente")
	cooldown = 0.0
	_check(not _attack(true), "recarga da skill bloqueia repetição")
	for foe in enemies.duplicate():
		_damage_enemy(foe, 100)
	_check(enemies.size() == 5 and level == 1 and xp == 30 and kills == 5 and arena_run.wave == 2, "cinco derrotas concedem experiência sem níveis instantâneos e iniciam a próxima onda")
	_reset_test_combat()
	_check(enemies.size() == 5 and hp == 100, "reinício restaura combate")
	await get_tree().physics_frame
	hp = 1
	enemies[0].position = player.position + Vector3(0, 0, -1)
	_enemies_step(0.1)
	_check(dead and animation.current_animation.ends_with("death"), "derrota reproduz morte do Fighter")
	_check(not _attack(), "morte impede ataque")
	_reset_test_combat()
	player.position = Vector3(20, 0.05, 20)
	var before := player.position
	Input.action_press("forward")
	for i in range(30):
		_physics_process(1.0 / 60.0)
		await get_tree().physics_frame
	Input.action_release("forward")
	_check(player.position.z < before.z - 1 and player.position.y > -0.1, "arena permite caminhar perto do limite sem cair")
	await _test_interface()
	_test_potion_settings()
	_test_equipment()
	_test_inventory_transfers()
	_test_slot_gestures()
	await _test_instance_flow()
	print("SMOKE COMPLETE: %d falhas" % failures)
	get_tree().quit(0 if failures == 0 else 1)

func _test_weapon_alignment() -> void:
	var rig: Skeleton3D = character_model.find_children("*", "Skeleton3D", true, false)[0]
	for pose in [["idle", 0.4], ["walk", 0.4], ["run", 0.4], ["attack", 0.4], ["skill", 0.4], ["death", 0.4], ["attack", 0.923], ["run", 0.554], ["death", 0.0]]:
		var action: String = pose[0]
		for animation_name in animation.get_animation_list():
			if animation_name.ends_with(action):
				animation.play(animation_name, 0)
		# SkeletonModifier3D restores its input after rendering. Capture the final
		# animated pose in skeleton_updated, exactly as the attachments do.
		var sample := {"done": false}
		var capture := func() -> void:
			if not sample.done:
				sample.done = true
				_test_current_weapon_pose(rig, action, pose[1])
		rig.skeleton_updated.connect(capture)
		animation.advance(pose[1])
		animation.pause()
		await get_tree().process_frame
		await get_tree().process_frame
		rig.skeleton_updated.disconnect(capture)
		_check(sample.done, "pose final do escudo foi verificada: " + action)
	_play("idle")

func _test_current_weapon_pose(rig: Skeleton3D, action: String, time: float) -> void:
	var blade: Node3D = sword_attachment.get_node("Sword/OriginalLongSword")
	var shield: Node3D = shield_attachment.find_child("OriginalSmallShield", true, false)
	var native_grip := Vector3(-1.85 * 0.038, 0, 0)
	var weapon_socket := rig.global_transform * rig.get_bone_global_pose(rig.find_bone("Weapon_R_Bone"))
	_check(blade.to_global(native_grip).distance_to(sword_attachment.global_position) < 0.001, "cabo centrado no socket: " + action)
	_check(blade.global_basis.x.normalized().dot(weapon_socket.basis.x.normalized()) > 0.999, "espada acompanha o eixo animado do socket: " + action)
	var mount: Node3D = shield_attachment.get_node("ShieldMount")
	var shield_front := (shield.global_basis * Vector3.FORWARD).normalized()
	var forearm := rig.global_transform * rig.get_bone_global_pose(rig.find_bone("Bip01_L_Forearm"))
	var forearm_basis := forearm.basis.orthonormalized()
	var expected_front := (forearm_basis.z * cos(ShieldMount.FOREARM_ROLL) + forearm_basis.y * sin(ShieldMount.FOREARM_ROLL)).normalized()
	var grip: MeshInstance3D = mount.get_node("HandGrip/LeatherGrip")
	var cuff: MeshInstance3D = mount.get_node("ForearmStrap")
	var wrist := rig.global_transform * rig.get_bone_global_pose(rig.find_bone("Bip01_L_Hand")).origin
	_check(shield_front.dot(expected_front) > 0.99, "face do escudo acompanha a orientação do antebraço: " + action)
	_check(grip.global_position.distance_to(mount.to_global(ShieldMount.GRIP_CENTER)) < 0.001, "alça do escudo permanece no punho: " + action)
	_check(absf(cuff.global_position.distance_to(wrist) - 0.07) < 0.003, "tira acompanha o antebraço durante a animação: " + action)
	var shell_mesh: MeshInstance3D = shield.find_children("*", "MeshInstance3D", true, false)[0]
	var down := (wrist - forearm.origin).normalized()
	var long_axis := shield.global_basis.x.normalized()
	var forearm_alignment := long_axis.dot(down)
	_check(forearm_alignment > 0.65 and forearm_alignment < 0.77, "escudo inclinado em diagonal ao antebraço: " + action)
	_check(shield.to_global(Vector3(ShieldMount.PANEL_GEOMETRY_CENTER, 0, 0)).distance_to(wrist) < 0.11, "painel mantém o centro próximo da empunhadura: " + action)
	if action == "idle":
		var vertical_alignment := long_axis.dot(Vector3.UP)
		_check(vertical_alignment > -0.85 and vertical_alignment < -0.45, "escudo fica em diagonal em repouso, com ponta inclinada para baixo")
	_check((grip.mesh as CylinderMesh).height <= 0.07, "empunhadura curta atrás da mão: " + action)
	var fit := ShieldFit.minimum_clearance(_gear_nodes("gloves", true), wrist, shell_mesh)
	_check(fit.y > 0 and fit.x >= 0.002, "luva fica atrás da madeira, com folga: %s %.3fs (%.1f mm)" % [action, time, fit.x * 1000])

func _test_interface() -> void:
	_reset_test_combat()
	await get_tree().physics_frame
	_check(hud.slot_buttons.size() == 4 and hud.item_buttons.size() == 20, "HUD tem quatro habilidades e inventário de 20 slots")
	hp = 50
	_refresh_hud()
	_check(hud.health.value == 50 and hud.health.max_value == 100, "barra de vida acompanha HP do jogador")
	_check(_use_item("potion") and hp == 90 and inventory.potions == 2, "poção recupera vida e consome uma unidade")
	potion_clock = 0
	_check(_use_item("potion") and hp == 100 and not _use_item("potion"), "cura respeita vida máxima e não desperdiça poção")
	_use_item("sword")
	_check(not sword_attachment.visible and not _attack(), "guardar espada remove arma e bloqueia golpes")
	_use_item("sword")
	_check(sword_attachment.visible, "equipar espada restaura arma")
	_toggle_inventory()
	var start := player.position
	_physics_process(0.2)
	_check(player.position == start and not _activate_skill(0), "inventário aberto pausa combate e habilidades")
	_toggle_inventory()
	_check(_activate_skill(2) and guard_clock == 4.0, "Defesa ativa proteção temporária")
	enemies[0].position = player.position + Vector3(0, 0, -1)
	_enemies_step(0.01)
	_check(is_equal_approx(hp, 95.8), "Defesa reduz dano recebido em 65 por cento")
	_check(not _activate_skill(2), "Defesa respeita recarga")
	_reset_test_combat()
	await get_tree().physics_frame
	start = player.position
	_check(_activate_skill(3), "Investida é ativada pelo quarto slot")
	for i in range(10):
		_physics_process(1.0 / 60.0)
		await get_tree().physics_frame
	_check(player.position.distance_to(start) > 1 and dash_cooldown > 0, "Investida move jogador com colisão e recarga")
	_reset_test_combat()
	enemies[0].position = player.position + Vector3(0, 0, -2)
	enemies[1].position = player.position + Vector3(0, 0, 2)
	await get_tree().physics_frame
	_check(_activate_skill(1), "segundo slot inicia Corte giratório")
	_melee_hit()
	_check(float(enemies[0].get_meta("hp")) == 20.0 and float(enemies[1].get_meta("hp")) == 20.0, "Corte giratório atinge inimigos na frente e atrás")
	_refresh_hud()
	_check(hud.enemy_bars[enemies[0]].get_node("Life").value == 20, "barra do monstro acompanha o dano")
	_damage_enemy(enemies[0], 100)
	_check(inventory.fangs == 1 and inventory.gold == 5, "derrotar monstro adiciona saque à mochila")
	_refresh_hud()
	_check(hud.enemy_bars.size() == enemies.size(), "barra de monstro derrotado é removida")
	var wheel := InputEventMouseButton.new()
	wheel.pressed = true
	wheel.button_index = MOUSE_BUTTON_WHEEL_UP
	for i in range(30):
		_unhandled_input(wheel)
	_check(zoom_distance == 2.0, "scroll aproxima até limite de dois metros")
	_physics_process(0.1)
	_check(boom.spring_length > 2.0 and boom.spring_length < 5.0, "zoom aproxima gradualmente")
	wheel.button_index = MOUSE_BUTTON_WHEEL_DOWN
	for i in range(30):
		_unhandled_input(wheel)
	_check(zoom_distance == 14.0, "scroll afasta até limite de 14 metros")
	var visual = enemies[0].get_node("GrelimVisual")
	var angle: float = visual.limbs[0].rotation.x
	visual.sync(1.0 / 60.0, true, true)
	_check(absf(visual.limbs[0].rotation.x - angle) < 0.2, "ataque do Grelim entra por transição suave")

func _test_potion_settings() -> void:
	_reset_test_combat()
	_check(not auto_potion, "poção automática começa desativada")
	_configure_potions(true, 40)
	hp = 41
	_auto_potion_step(0.1)
	_check(hp == 41 and inventory.potions == 3, "poção automática não gasta acima do limite configurado")
	hp = 40
	_auto_potion_step(0.1)
	_check(hp == 80 and inventory.potions == 2, "poção automática cura ao atingir 40 por cento")
	hp = 20
	_auto_potion_step(0.1)
	_check(hp == 20 and inventory.potions == 2, "intervalo impede consumir várias poções seguidas")
	_auto_potion_step(2.0)
	_check(hp == 60 and inventory.potions == 1, "poção volta a funcionar após dois segundos")
	_configure_potions(false, 80)
	hp = 20
	_auto_potion_step(3.0)
	_check(hp == 20 and inventory.potions == 1, "desativar AUTO interrompe uso automático")
	_configure_potions(true, 50)
	hp = 30
	_toggle_inventory()
	_physics_process(3.0)
	_check(hp == 30 and inventory.potions == 1, "mochila pausada não consome poções")
	_toggle_inventory()
	dead = true
	hp = 0
	_auto_potion_step(3.0)
	_check(hp == 0 and inventory.potions == 1, "poção automática não revive personagem morto")
	dead = false
	hp = 10
	inventory.potions = 0
	_auto_potion_step(3.0)
	_check(hp == 10 and inventory.potions == 0, "poção automática respeita estoque vazio")
	_refresh_hud()
	_check(hud.potion_slot.slot == 4 and hud.slot_buttons.size() == 4, "poção fica separada dos quatro slots de habilidade")

func _test_equipment() -> void:
	_reset_test_combat()
	for slot in ["armor", "pants", "gloves", "boots"]:
		var base := _gear_nodes(slot, false)
		var equipped := _gear_nodes(slot, true)
		_check(not base.is_empty() and not equipped.is_empty(), "malhas originais carregadas: " + slot)
		var textured := true
		for mesh in base + equipped:
			var material := mesh.get_active_material(0) as StandardMaterial3D
			textured = textured and material != null and material.albedo_texture != null
		_check(textured, "texturas originais aplicadas às duas versões: " + slot)
		var correct := true
		for mesh in base:
			correct = correct and not mesh.visible
		for mesh in equipped:
			correct = correct and mesh.visible
		_check(correct, "peça equipada substitui malha base sem sobreposição: " + slot)
		_check(_use_item(slot), "inventário permite retirar: " + slot)
		correct = true
		for mesh in base:
			correct = correct and mesh.visible
		for mesh in equipped:
			correct = correct and not mesh.visible
		_check(correct, "retirar equipamento restaura malha base: " + slot)
		_use_item(slot)
	for mesh in character_model.find_children("*", "MeshInstance3D", true, false):
		if "_m000_f" in str(mesh.name).to_lower():
			var face := mesh.get_active_material(0) as StandardMaterial3D
			_check(face != null and face.albedo_texture != null, "rosto usa textura original do LineageFaceTex")
		if "_m00_ah" in str(mesh.name).to_lower() or "_m00_bh" in str(mesh.name).to_lower():
			var hair := mesh.get_active_material(0) as StandardMaterial3D
			_check(hair.albedo_texture != null and hair.transparency == BaseMaterial3D.TRANSPARENCY_ALPHA_SCISSOR, "cabelo usa textura e recorte alpha")
	var hair_parts := 0
	for mesh in character_model.find_children("*", "MeshInstance3D", true, false):
		if "_m00_ah" in str(mesh.name).to_lower() or "_m00_bh" in str(mesh.name).to_lower():
			hair_parts += 1
	_check(hair_parts == 2, "cabeça inclui as duas partes de cabelo")
	hud.inventory_panel.equipped_buttons[3].pressed.emit()
	_check(inventory.armor, "selecionar traje exibe detalhes sem alterar equipamento")
	hud.inventory_panel.action_button.pressed.emit()
	_check(not inventory.armor and inventory.gloves and inventory.boots, "slot do traje altera somente o traje selecionado")
	hud.inventory_panel.action_button.pressed.emit()
	hud.inventory_panel.set_category("Poções")
	_check(hud.item_buttons[1].visible and not hud.item_buttons[0].visible, "filtro de poções oculta armas")
	hud.inventory_panel.set_category("Todos")
	_attack()
	_check(not _use_item("armor"), "troca de roupa é bloqueada durante golpe")

func _test_inventory_transfers() -> void:
	_reset_test_combat()
	if hud.inventory_panel.visible:
		_toggle_inventory()
	hud.inventory_panel.set_category("Todos")
	_toggle_inventory()
	_check(hud.inventory_panel.capacity_label.text == "MOCHILA  1 / 20", "somente poções ocupam a mochila quando todas as peças estão equipadas")
	for index in [0, 3, 4, 5, 6]:
		var key: String = hud.inventory_panel.KEYS[index]
		var item_name: String = hud.inventory_panel.NAMES[index]
		var bag_button: Button = hud.item_buttons[index]
		var equipment_button: Button = hud.inventory_panel.equipped_buttons[index]
		_check(not bag_button.visible and equipment_button.icon != null, "peça equipada aparece somente no slot correto: " + item_name)
		equipment_button.pressed.emit()
		_check(hud.inventory_panel.selected == index and hud.inventory_panel.action_button.text == "Retirar", "clique no slot inspeciona equipamento para retirar: " + item_name)
		hud.inventory_panel.action_button.pressed.emit()
		_check(not inventory[key] and equipment_button.icon == null, "Retirar esvazia o slot do personagem: " + item_name)
		_check(bag_button.visible and not bag_button.disabled and bag_button.icon != null and hud.inventory_panel.capacity_label.text == "MOCHILA  2 / 20", "Retirar devolve a peça e ocupa um espaço da mochila: " + item_name)
		bag_button.pressed.emit()
		_check(hud.inventory_panel.action_button.text == "Equipar", "peça guardada oferece Equipar: " + item_name)
		hud.inventory_panel.action_button.pressed.emit()
		_check(inventory[key] and equipment_button.icon != null and not bag_button.visible, "Equipar move a peça da mochila ao slot correto: " + item_name)
		_check(hud.inventory_panel.capacity_label.text == "MOCHILA  1 / 20", "Equipar libera o espaço da mochila: " + item_name)
	for filter_name in ["Todos", "Armas", "Trajes", "Poções", "Materiais"]:
		hud.inventory_panel.set_category(filter_name)
		var visible_cells := 0
		for child in hud.item_buttons[0].get_parent().get_children():
			if child.visible:
				visible_cells += 1
		_check(visible_cells == 20, "grade compacta mantém vinte espaços no filtro: " + filter_name)
	hud.inventory_panel.set_category("Todos")
	inventory.fangs = 6
	_refresh_hud()
	_check(hud.item_buttons[2].visible and hud.inventory_panel.capacity_label.text == "MOCHILA  2 / 20", "pilha de presas ocupa somente um espaço da mochila")
	inventory.potions = 0
	_refresh_hud()
	_check(not hud.item_buttons[1].visible and hud.inventory_panel.capacity_label.text == "MOCHILA  1 / 20", "consumir a última poção libera seu espaço da mochila")
	_toggle_inventory()
	_reset_test_combat()
	_refresh_hud()

func _slot_gesture(control: Control, travel: Vector2) -> void:
	var origin := control.get_global_rect().get_center()
	var press := InputEventMouseButton.new()
	press.button_index = MOUSE_BUTTON_LEFT
	press.pressed = true
	press.global_position = origin
	control._gui_input(press)
	var motion := InputEventMouseMotion.new()
	motion.global_position = origin + travel
	control._input(motion)
	var release := InputEventMouseButton.new()
	release.button_index = MOUSE_BUTTON_LEFT
	release.global_position = origin + travel
	control._input(release)

func _test_slot_gestures() -> void:
	_configure_potions(false, 40)
	_reset_test_combat()
	automatic_skills.fill(false)
	for i in range(4):
		_slot_gesture(hud.slot_buttons[i], Vector2(0, 28))
		_check(automatic_skills[i] and cooldown == 0, "arrastar para baixo ativa automático sem disparar skill: " + str(i + 1))
		_slot_gesture(hud.slot_buttons[i], Vector2(0, -28))
		_check(not automatic_skills[i], "arrastar para cima desativa automático: " + str(i + 1))
	_slot_gesture(hud.slot_buttons[0], Vector2.ZERO)
	_check(skill_cooldown == 6.0, "clique curto continua ativando habilidade manual")
	_refresh_hud()
	_slot_gesture(hud.slot_buttons[0], Vector2(0, 28))
	_check(automatic_skills[0], "recarga não impede alterar modo automático")
	_slot_gesture(hud.slot_buttons[0], Vector2(0, -28))
	_check(is_equal_approx(hud.potion_slot.global_position.y, hud.slot_buttons[0].global_position.y), "poção alinhada na mesma altura das habilidades")
	_slot_gesture(hud.potion_slot, Vector2(0, 28))
	_check(not auto_potion and not hud.potion_popup.visible, "arrastar poção não ativa automático nem abre janela")
	_slot_gesture(hud.potion_slot, Vector2(0, -28))
	_check(not auto_potion, "arrastar poção para cima não altera automático")
	var count: int = inventory.potions
	_slot_gesture(hud.potion_slot, Vector2.ZERO)
	_check(hud.potion_popup.visible and inventory.potions == count, "clicar na poção abre configuração mesmo com vida cheia")
	hud.auto_check.button_pressed = true
	_check(auto_potion, "botão da configuração ativa poção automática")
	_slot_gesture(hud.potion_slot, Vector2(0, -28))
	_check(auto_potion, "arrastar poção não desliga automático")
	hud.auto_check.button_pressed = false
	_check(not auto_potion, "botão da configuração desativa poção automática")
	hud.potion_popup.hide()
	var tab := InputEventKey.new()
	tab.keycode = KEY_TAB
	tab.pressed = true
	_input(tab)
	_check(hud.inventory_panel.visible, "TAB abre inventário")
	_check(hud.inventory_panel.preview != null and hud.inventory_panel.preview != character_model, "inventário mostra uma prévia 3D independente do personagem")
	_input(tab)
	_check(not hud.inventory_panel.visible, "TAB fecha inventário")
	for i in range(7):
		if i in [0, 3, 4, 5, 6]:
			_check(not hud.item_buttons[i].visible and hud.inventory_panel.equipped_buttons[i].icon != null, "equipamento possui ícone somente no slot do personagem: " + str(i))
		elif i == 2 and inventory.fangs == 0:
			_check(not hud.item_buttons[i].visible and hud.item_buttons[i].icon == null and hud.item_buttons[i].disabled, "material sem estoque não ocupa espaço da mochila")
		else:
			_check(hud.item_buttons[i].icon != null, "item possui ícone: " + str(i))
	_reset_test_combat()
	enemies[0].position = player.position + Vector3(0, 0, -2.5)
	_set_skill_automatic(0, true)
	_toggle_inventory()
	_automatic_skills_step()
	_check(skill_cooldown == 0, "inventário pausado impede habilidades automáticas")
	_toggle_inventory()
	_automatic_skills_step()
	_check(skill_cooldown == 6.0, "skill automática dispara com inimigo próximo à frente")
	_set_skill_automatic(0, false)
	_reset_test_combat()
	_automatic_skills_step()
	_check(skill_cooldown == 0, "desativar automático interrompe novos disparos")

func _finish_test_run() -> void:
	if arena_run.phase == InstanceRun.Phase.PREPARATION:
		arena_run.tick(InstanceRun.PREPARATION_TIME)
	while arena_run.phase in [InstanceRun.Phase.COMBAT, InstanceRun.Phase.BOSS]:
		for foe in enemies.duplicate():
			_damage_enemy(foe, 100000)

func _test_instance_flow() -> void:
	progress = PlayerProgress.new()
	_change_zone(0)
	_check(current_world == 0 and enemies.is_empty(), "retorno à vila descarrega a instância")
	_check(progress.unlocked_world() == 1, "somente Mundo 1 começa liberado")
	_check(not _interact(), "interações exigem proximidade")
	player.position = portal_position + Vector3(0, 0.05, 2.5)
	_check(_interact() and hud.rift_panel.visible and hud.rift_panel.world_buttons.size() == 10, "E abre a fenda com os dez mundos")
	_check(not _enter_world(2) and not _enter_world(0) and not _enter_world(11), "fenda impede saltar mundos ou índices inválidos")
	var start := player.position
	Input.action_press("forward")
	_physics_process(0.2)
	Input.action_release("forward")
	_check(player.position == start and not _activate_skill(3), "fenda aberta pausa movimento e combate")
	_check(_enter_world(1) and enemies.is_empty() and arena_run.preparation_left == 30, "entrada inicia trinta segundos de preparação")
	_check(not active_zone.has_node("ReturnRift") and not _near_portal() and not _interact(), "instância não possui portal de retorno nem interação fantasma")
	_check(hud.instance_panel.visible and hud.instance_timer.text == "00:30", "HUD mostra preparação")
	arena_run.tick(29)
	_check(enemies.is_empty() and arena_run.time_left == 600, "preparação não gera monstros nem consome dez minutos")
	arena_run.tick(1)
	_check(enemies.size() == 5 and arena_run.wave == 1, "primeira onda tem cinco monstros")
	for index in range(4):
		_damage_enemy(enemies[0], 1000)
	_check(enemies.size() == 1 and arena_run.wave == 1 and not is_instance_valid(reward_chest), "próxima onda aguarda o último monstro")
	while arena_run.phase == InstanceRun.Phase.COMBAT:
		for foe in enemies.duplicate():
			_damage_enemy(foe, 100000)
	_check(instance_kills == 30 and arena_run.phase == InstanceRun.Phase.BOSS and enemies.size() == 1, "seis ondas dão lugar a um único chefe")
	_check(not is_instance_valid(reward_chest) and progress.unlocked_world() == 1, "trinta comuns não liberam recompensa ou próximo mundo antes do chefe")
	_refresh_hud()
	_check("CHEFE" in hud.instance_heading.text and hud.target_health.max_value > 60, "chefe tem identificação e barra de vida próprias")
	var boss := enemies[0]
	_check(bool(boss.get_meta("is_boss")) and float(boss.get_meta("damage")) > 12, "chefe tem mais vida e dano que os comuns")
	boss.set_meta("attack", 0.0)
	player.position = boss.position + Vector3(0, 0, 3)
	var before := hp
	_boss_step(boss, 0.01)
	_check(float(boss.get_meta("windup")) > 0 and hp == before and is_instance_valid(boss.get_meta("danger_marker")), "ataque do chefe avisa no chão antes de causar dano")
	_boss_step(boss, 0.4)
	player.position.x += 5
	_boss_step(boss, 0.5)
	_check(hp == before, "sair da área marcada evita o golpe do chefe")
	player.position = boss.position + Vector3(0, 0, 3)
	boss.set_meta("attack", 0.0)
	_boss_step(boss, 0.01)
	_boss_step(boss, 0.9)
	_check(hp < before and not dead, "permanecer na área marcada recebe o golpe do chefe")
	_damage_enemy(boss, 100000)
	_check(arena_run.phase == InstanceRun.Phase.VICTORY and instance_kills == 30 and enemies.is_empty(), "derrotar o chefe conclui a instância mantendo contador de trinta comuns")
	_check(progress.unlocked_world() == 2 and is_instance_valid(reward_chest), "vitória libera somente o próximo mundo e um baú")
	_check(hud.victory_banner.visible and not _next_world(), "vitória mostra coleta e não permite ignorar a recompensa")
	var rewards_before: int = inventory.get("loot_items", []).size()
	hud.collect_button.pressed.emit()
	_check(reward_chest.opened and hud.chest_rewards_panel.visible, "Coletar baú abre o baú real e revela os itens em tela especial")
	_check(inventory.loot_items.size() == rewards_before + 1, "recompensa é guardada na mochila")
	_check(not _open_chest() and not _next_world(), "revelação impede coleta repetida ou transição prematura")
	var reward: Dictionary = inventory.loot_items.back().duplicate(true)
	_check(reward.rarity in LootItems.RARITIES, "recompensa tem raridade válida")
	hud.chest_rewards_panel.continue_button.pressed.emit()
	_check(hud.run_result_panel.visible and hud.next_world_button.visible, "após a revelação aparecem próximo mundo e retorno à vila")
	hud.next_world_button.pressed.emit()
	_check(current_world == 2 and arena_run.phase == InstanceRun.Phase.PREPARATION and enemies.is_empty() and hp == _maximum_hp(), "botão avança direto ao mundo seguinte com preparação nova e vida recuperada")
	_check(not hud.run_result_panel.visible and not hud.chest_rewards_panel.visible and not _next_world(), "transição fecha menus antigos e não pula outra fase")
	if LootItems.Catalog.compatible(reward, player_class):
		_check(_use_item("loot_equip:" + reward.id) and LootItems.is_equipped(inventory, reward.slot), "recompensa compatível revelada funciona como equipamento real")
		_check(_use_item("loot_remove:" + reward.slot) and _use_item(reward.slot), "saque compatível pode voltar à mochila sem perder o equipamento anterior")
	else:
		_check(not _use_item("loot_equip:" + reward.id) and inventory.loot_items.any(func(item: Dictionary) -> bool: return item.id == reward.id and item == reward), "saque de outra classe permanece intacto na mochila e não pode ser convertido ou equipado")
	var earned_items := inventory.duplicate(true)
	_return_to_village()
	_check(inventory == earned_items and hp == _maximum_hp(), "retorno preserva inventário e recupera vida")
	player.position = portal_position + Vector3(0, 0.05, 2.5)
	_interact()
	_enter_world(1)
	_finish_test_run()
	_check(progress.unlocked_world() == 2, "repetir mundo concluído não pula a progressão")
	for number in range(2, WorldCatalog.COUNT + 1):
		_change_zone(number)
		_check(enemies.is_empty() and arena_run.preparation_left == 30, "cada mundo começa com preparação: " + str(number))
		arena_run.tick(30)
		_check(enemies.size() == 5, "cada onda tem cinco monstros: " + str(number))
		if number == 2:
			_damage_enemy(enemies[0], 1)
			_refresh_hud()
			_check(is_equal_approx(hud.target_health.max_value, float(enemies[0].get_meta("maximum_hp"))) and is_equal_approx(hud.target_health.value, hud.target_health.max_value - 1), "barras respeitam a vida do mundo atual")
		_finish_test_run()
		_check(progress.completed_worlds.size() == number and instance_kills == 30, "ondas e chefe concluem cada mundo em ordem: " + str(number))
		await get_tree().process_frame
	_check(progress.unlocked_world() == 10 and not progress.can_enter(11), "Mundo 10 encerra a sequência")
	_collect_victory_chest()
	hud.chest_rewards_panel.continue_button.pressed.emit()
	_check(hud.run_result_panel.visible and not hud.next_world_button.visible, "vitória final oferece vila sem inventar Mundo 11")
	hud.return_button.pressed.emit()
	_check(current_world == 0, "botão de retorno da vitória leva à vila")
	_reset_test_combat()
	var completed_before := progress.completed_worlds.duplicate()
	arena_run.tick(600)
	_check(_instance_failed() and not is_instance_valid(reward_chest) and hud.run_result_panel.visible, "tempo esgotado mostra retorno sem baú")
	_damage_enemy(enemies[0], 1000)
	_check(instance_kills == 0 and progress.completed_worlds == completed_before and not _attack(), "tentativa fracassada não recebe dano ou recompensa tardia")
	hud.return_button.pressed.emit()
	_check(current_world == 0 and hp == _maximum_hp(), "botão após tempo esgotado retorna à vila")
	_reset_test_combat()
	inventory.loot_items = [{"id": "smoke-sword", "slot": "sword", "name": "Espada de teste", "rarity": "Raro", "attack_bonus": 17, "defense_bonus": 0}]
	_check(_use_item("loot_equip:smoke-sword") and sword_attachment.visible, "espada de saque funciona com a básica guardada")
	enemies[0].position = player.position + Vector3(0, 0, -2)
	await get_tree().physics_frame
	await get_tree().physics_frame
	_check(_attack(), "espada de saque permite ataques")
	_melee_hit()
	_check(float(enemies[0].get_meta("hp")) == 18, "bônus equipado aumenta dano real")
	_reset_test_combat()
	inventory.loot_items = [{"id": "smoke-armor", "slot": "armor", "name": "Armadura de teste", "rarity": "Raro", "attack_bonus": 0, "defense_bonus": 7}]
	_use_item("loot_equip:smoke-armor")
	enemies[0].position = player.position + Vector3(0, 0, -1)
	_enemies_step(0.01)
	_check(is_equal_approx(hp, 100.0 - 1200.0 / 107.0), "defesa de saque reduz dano real sem anular ataques")
	hp = 1
	enemies[0].set_meta("attack", 0.0)
	_enemies_step(0.01)
	_check(dead and hud.run_result_panel.visible and animation.current_animation.ends_with("death"), "morte preserva animação e mostra painel de retorno")
	var rescue := InputEventKey.new()
	rescue.keycode = KEY_R
	rescue.pressed = true
	_unhandled_input(rescue)
	_check(current_world == 0 and not dead and hp == _maximum_hp(), "R também retorna à vila após a morte")
	await get_tree().process_frame
	_check(not has_node("OpenField") and has_node("Village"), "somente o cenário atual fica carregado")
