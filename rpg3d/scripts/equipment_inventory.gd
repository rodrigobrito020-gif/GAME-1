extends PanelContainer
## Equipment screen: live model, paper doll, filterable bag and item inspection.
signal item_requested(item: String)
signal closed
const IDS := ["sword", "potion", "fang", "armor", "gloves", "boots", "shield", "pants"]
const NAMES := ["Long Sword", "Poção de vida", "Presa Grelim", "Peitoral inicial", "Luvas", "Botas", "Small Shield", "Calça inicial"]
const TYPES := ["Arma · Uma mão", "Consumível · Vida", "Material · Saque", "Armadura · Peito", "Armadura · Mãos", "Armadura · Pés", "Escudo · Mão esquerda", "Armadura · Pernas"]
const KEYS := ["equipped", "potions", "fangs", "armor", "gloves", "boots", "shield", "pants"]
const OrnateFrame := preload("res://scripts/ornate_frame.gd")
const LootItems := preload("res://scripts/loot_items.gd")
const ItemIcons := preload("res://scripts/item_icons.gd")
const GOLD := Color("d1b680")
const PAPER := Color("eee4ce")
var item_buttons: Array[Button] = []
var empty_buttons: Array[Button] = []
var equipped_buttons: Dictionary = {}
var loot_buttons: Dictionary = {}
var bag_grid: GridContainer
var filters: Dictionary = {}
var selected := 0
var selected_loot_id := ""
var category := "Todos"
var data: Dictionary = {}
var is_dead := false
var current_hp := 100.0
var max_hp := 100.0
var last_level := 0
var gold_label: Label
var capacity_label: Label
var level_label: Label
var class_title: Label
var player_class_name := "Guerreiro humano"
var player_class_id := "tanque"
var life_label: Label
var set_label: Label
var current_name: Label
var current_description: Label
var current_icon: TextureRect
var selected_name: Label
var selected_type: Label
var selected_description: Label
var selected_icon: TextureRect
var action_button: Button
var viewport: SubViewport
var preview: Node3D
var source: Node3D
var count_labels: Dictionary = {}

func style_item_button(button: Button, rarity: String, selected_item := false) -> void:
	var background := ItemIcons.background_color(rarity)
	var border := rarity_color(rarity)
	for state: String in ["normal", "hover", "pressed"]:
		var box := style(background, GOLD if selected_item or state != "normal" else border, 2)
		box.set_content_margin_all(4)
		button.add_theme_stylebox_override(state, box)
	button.expand_icon = true
	button.icon_alignment = HORIZONTAL_ALIGNMENT_CENTER
	button.vertical_icon_alignment = VERTICAL_ALIGNMENT_CENTER

func style(background: Color, border := Color("6a5d47"), width := 1) -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = background
	box.border_color = border
	box.set_border_width_all(width)
	box.set_corner_radius_all(3)
	box.content_margin_left = 12
	box.content_margin_right = 12
	box.content_margin_top = 12
	box.content_margin_bottom = 12
	return box

func label_for(text: String, font_size := 16, title := false) -> Label:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", PAPER if not title else GOLD)
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	if title:
		var font := SystemFont.new()
		font.font_names = PackedStringArray(["Georgia", "DejaVu Serif"])
		label.add_theme_font_override("font", font)
	return label

func button_for(text: String) -> Button:
	var button := Button.new()
	button.text = text
	button.focus_mode = Control.FOCUS_NONE
	button.add_theme_font_size_override("font_size", 14)
	button.add_theme_color_override("font_color", PAPER)
	button.add_theme_stylebox_override("normal", style(Color("172027")))
	button.add_theme_stylebox_override("hover", style(Color("34332a"), GOLD))
	button.add_theme_stylebox_override("pressed", style(Color("4c3d23"), GOLD, 2))
	button.add_theme_stylebox_override("disabled", style(Color("141a20"), Color("373f43")))
	return button

func panel_column(parent: Node, ratio: float) -> VBoxContainer:
	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", style(Color(0.067, 0.106, 0.133, 0.80), Color("9f885e")))
	panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	panel.size_flags_stretch_ratio = ratio
	parent.add_child(panel)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 10)
	panel.add_child(column)
	panel.add_child(OrnateFrame.new())
	return column

func icon_for(index: int, item: Dictionary = {}) -> Texture2D:
	return ItemIcons.for_display({"slot": IDS[index], "rarity": "Comum"} if item.is_empty() else item, player_class_id)

func base_name(index: int) -> String:
	if index == 0 and player_class_id != "tanque":
		return "Short Bow" if player_class_id == "arqueiro" else "Apprentice's Rod"
	if IDS[index] in LootItems.Catalog.CLOTHING_SLOTS:
		return LootItems.Catalog.get_entry(LootItems.Catalog.key_for(player_class_id, "No Grade", IDS[index])).name
	return NAMES[index]

func picture(parent: Node, pixels: int) -> TextureRect:
	var icon := TextureRect.new()
	icon.custom_minimum_size = Vector2(pixels, pixels)
	icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	parent.add_child(icon)
	return icon

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	offset_left = 12
	offset_top = 12
	offset_right = -12
	offset_bottom = -12
	add_theme_stylebox_override("panel", style(Color("0c1219"), GOLD))
	z_index = 10
	var background := TextureRect.new()
	background.texture = preload("res://assets/inventory_stone.svg")
	background.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	background.stretch_mode = TextureRect.STRETCH_TILE
	background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(background)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 14)
	add_child(column)
	var header := HBoxContainer.new()
	header.add_theme_constant_override("separation", 18)
	column.add_child(header)
	var back := button_for("‹  Voltar [TAB]")
	back.pressed.connect(func() -> void: closed.emit())
	header.add_child(back)
	var heading := label_for("EQUIPAMENTOS", 27, true)
	heading.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(heading)
	header.add_child(label_for("PERSONAGEM  /  MOCHILA", 14))
	gold_label = label_for("●  0 ouro", 21, true)
	header.add_child(gold_label)
	var body := HBoxContainer.new()
	body.add_theme_constant_override("separation", 12)
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	column.add_child(body)
	_character_panel(panel_column(body, 1.05))
	_bag_panel(panel_column(body, 1.1))
	_details_panel(panel_column(body, 0.82))
	add_child(OrnateFrame.new())
	visibility_changed.connect(_visibility_changed)
	hide()

func _character_panel(column: VBoxContainer) -> void:
	var title := label_for("GUERREIRO HUMANO", 21, true)
	class_title = title
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(title)
	level_label = label_for("Guerreiro · Nv. 1", 16)
	level_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	level_label.add_theme_color_override("font_color", Color("9cc6d3"))
	column.add_child(level_label)
	var doll := HBoxContainer.new()
	doll.add_theme_constant_override("separation", 4)
	doll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	column.add_child(doll)
	var left := VBoxContainer.new()
	left.add_theme_constant_override("separation", 3)
	doll.add_child(left)
	_equipment_slot(left, "Arma", 0)
	_equipment_slot(left, "Cabeça", -1)
	_equipment_slot(left, "Luvas", 4)
	_equipment_slot(left, "Anel", -1)
	_equipment_slot(left, "Colar", -1)
	var container := SubViewportContainer.new()
	container.stretch = true
	container.custom_minimum_size = Vector2(150, 300)
	container.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	container.size_flags_vertical = Control.SIZE_EXPAND_FILL
	container.mouse_filter = Control.MOUSE_FILTER_IGNORE
	doll.add_child(container)
	viewport = SubViewport.new()
	viewport.size = Vector2i(220, 440)
	viewport.own_world_3d = true
	viewport.transparent_bg = true
	viewport.render_target_update_mode = SubViewport.UPDATE_DISABLED
	container.add_child(viewport)
	var environment := WorldEnvironment.new()
	environment.environment = Environment.new()
	environment.environment.background_mode = Environment.BG_CLEAR_COLOR
	environment.environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.environment.ambient_light_color = Color("a4b3c6")
	environment.environment.ambient_light_energy = 0.7
	viewport.add_child(environment)
	var light := DirectionalLight3D.new()
	light.rotation_degrees = Vector3(-35, -35, 0)
	light.light_energy = 1.8
	viewport.add_child(light)
	var camera := Camera3D.new()
	camera.position = Vector3(0, 1.05, -3)
	viewport.add_child(camera)
	camera.look_at(Vector3(0, 0.95, 0))
	camera.projection = Camera3D.PROJECTION_ORTHOGONAL
	camera.size = 2.25
	var right := VBoxContainer.new()
	right.add_theme_constant_override("separation", 3)
	doll.add_child(right)
	_equipment_slot(right, "Escudo", 6)
	_equipment_slot(right, "Peito", 3)
	_equipment_slot(right, "Calça", 7)
	_equipment_slot(right, "Botas", 5)
	_equipment_slot(right, "Anel", -1)
	life_label = label_for("Vida  100 / 100", 18, true)
	life_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(life_label)
	set_label = label_for("", 12)
	set_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	set_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(set_label)
	var hint := label_for("Selecione um slot para ver o equipamento.", 12)
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(hint)

func _equipment_slot(parent: Node, title: String, index: int) -> void:
	var label := label_for(title, 13)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	parent.add_child(label)
	var button := button_for("◇" if index < 0 else "")
	button.custom_minimum_size = Vector2(58, 52)
	button.disabled = index < 0
	if index >= 0:
		button.icon = icon_for(index)
		button.add_theme_constant_override("icon_max_width", 48)
		style_item_button(button, "Comum")
		button.icon_alignment = HORIZONTAL_ALIGNMENT_CENTER
		button.pressed.connect(_select_equipment.bind(index))
		equipped_buttons[index] = button
	button.tooltip_text = "Slot vazio" if index < 0 else base_name(index)
	parent.add_child(button)

func _bag_panel(column: VBoxContainer) -> void:
	capacity_label = label_for("MOCHILA  0 / 20", 21, true)
	column.add_child(capacity_label)
	var filter_row := HBoxContainer.new()
	filter_row.add_theme_constant_override("separation", 4)
	column.add_child(filter_row)
	for category_name in ["Todos", "Armas", "Trajes", "Poções", "Materiais"]:
		var button := button_for(category_name)
		button.add_theme_font_size_override("font_size", 12)
		button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		button.pressed.connect(func() -> void: set_category(category_name))
		filter_row.add_child(button)
		filters[category_name] = button
	column.add_child(label_for("Selecione um item para ver os detalhes", 13))
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	column.add_child(scroll)
	var grid := GridContainer.new()
	bag_grid = grid
	grid.columns = 5
	grid.add_theme_constant_override("h_separation", 6)
	grid.add_theme_constant_override("v_separation", 6)
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(grid)
	# Keep the first eight item buttons tied to the item IDs. Hidden equipped items
	# must not leave holes, so a separate pool fills the 20 visible bag cells.
	for index in range(IDS.size() + 20):
		var button := button_for("")
		button.custom_minimum_size = Vector2(72, 72)
		button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		if index < IDS.size():
			button.icon = icon_for(index)
			button.expand_icon = true
			button.add_theme_constant_override("icon_max_width", 64)
			button.icon_alignment = HORIZONTAL_ALIGNMENT_CENTER
			button.vertical_icon_alignment = VERTICAL_ALIGNMENT_TOP
			button.pressed.connect(func() -> void: select_item(index))
			button.tooltip_text = base_name(index)
			if index in [1, 2]:
				var counter := label_for("", 13)
				counter.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_RIGHT)
				counter.grow_horizontal = Control.GROW_DIRECTION_BEGIN
				counter.grow_vertical = Control.GROW_DIRECTION_BEGIN
				counter.offset_right = -4
				counter.offset_bottom = -3
				counter.add_theme_color_override("font_shadow_color", Color.BLACK)
				counter.add_theme_constant_override("shadow_offset_x", 1)
				counter.add_theme_constant_override("shadow_offset_y", 1)
				button.add_child(counter)
				count_labels[index] = counter
		else:
			button.disabled = true
			empty_buttons.append(button)
		grid.add_child(button)
		if index < 20:
			item_buttons.append(button)
	var hint := label_for("Equipar move o item para o slot do personagem.\nRetirar devolve à mochila. TAB / I / Esc volta.", 12)
	hint.add_theme_color_override("font_color", Color("9ca8ac"))
	column.add_child(hint)

func _details_panel(column: VBoxContainer) -> void:
	column.add_child(label_for("EQUIPADO", 18, true))
	var current_row := HBoxContainer.new()
	column.add_child(current_row)
	current_icon = picture(current_row, 52)
	current_name = label_for("Long Sword", 17, true)
	current_name.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	current_name.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	current_row.add_child(current_name)
	current_description = label_for("Arma · Mão direita", 14)
	current_description.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	column.add_child(current_description)
	column.add_child(HSeparator.new())
	column.add_child(label_for("SELECIONADO", 18, true))
	selected_icon = picture(column, 88)
	selected_name = label_for("Long Sword", 22, true)
	selected_name.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	column.add_child(selected_name)
	selected_type = label_for("Arma · Uma mão", 14)
	selected_type.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	selected_type.add_theme_color_override("font_color", Color("9cc6d3"))
	column.add_child(selected_type)
	selected_description = label_for("", 15)
	selected_description.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	selected_description.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var details_scroll := ScrollContainer.new()
	details_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	details_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	details_scroll.add_child(selected_description)
	column.add_child(details_scroll)
	action_button = button_for("Retirar")
	action_button.custom_minimum_size.y = 46
	action_button.add_theme_font_size_override("font_size", 20)
	action_button.add_theme_stylebox_override("normal", style(Color("765528"), GOLD, 2))
	action_button.pressed.connect(_request_selected_item)
	column.add_child(action_button)

func set_character_source(model: Node3D) -> void:
	source = model

func set_player_class(definition: Dictionary) -> void:
	player_class_name = str(definition.get("name", "Guerreiro humano"))
	player_class_id = str(definition.get("id", "tanque"))
	if class_title != null:
		class_title.text = player_class_name.to_upper()
	if level_label != null:
		level_label.text = "%s · Nv. %d" % [player_class_name.trim_suffix(" humano"), maxi(last_level, 1)]
	_refresh_items()

func _visibility_changed() -> void:
	if viewport == null:
		return
	viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS if visible else SubViewport.UPDATE_DISABLED
	if visible:
		refresh_preview()
	elif preview != null:
		var animation := preview.find_child("AnimationPlayer", true, false) as AnimationPlayer
		if animation:
			animation.pause()

func refresh_preview() -> void:
	if not is_instance_valid(source) or not visible:
		return
	if preview != null:
		viewport.remove_child(preview)
		preview.queue_free()
	# Each preview reconnects its own skeleton attachments in _ready().
	preview = source.duplicate(Node.DUPLICATE_SCRIPTS | Node.DUPLICATE_GROUPS | Node.DUPLICATE_USE_INSTANTIATION) as Node3D
	viewport.add_child(preview)
	preview.position = Vector3.ZERO
	var animation := preview.find_child("AnimationPlayer", true, false) as AnimationPlayer
	if animation:
		animation.speed_scale = 1
		for animation_name in animation.get_animation_list():
			if animation_name.ends_with("idle"):
				animation.play(animation_name, 0)
				animation.advance(0)

func select_item(index: int) -> void:
	selected = index
	selected_loot_id = ""
	if int(data.get("identity_version", 0)) >= 1 and index not in [1, 2]:
		selected_loot_id = str(LootItems.equipped_item(data, IDS[index]).get("id", ""))
	_refresh_items()

func select_loot(item_id: String) -> void:
	selected_loot_id = item_id
	var item := _find_loot(item_id)
	if not item.is_empty():
		selected = IDS.find(item.slot)
	_refresh_items()

func _select_equipment(index: int) -> void:
	var item := LootItems.equipped_item(data, IDS[index])
	if not item.is_empty():
		select_loot(str(item.id))
	else:
		select_item(index)

func _request_selected_item() -> void:
	var item := _find_loot(selected_loot_id)
	if not item.is_empty():
		item_requested.emit("loot_remove:" + str(item.slot) if _loot_is_equipped(selected_loot_id) else "loot_equip:" + selected_loot_id)
	else:
		item_requested.emit(IDS[selected])

func set_category(value: String) -> void:
	category = value
	_refresh_items()

func sync_items(inventory: Dictionary, dead: bool, level: int, hp: float, maximum: float) -> void:
	var changed := data != inventory
	var refresh := changed or is_dead != dead or current_hp != hp or max_hp != maximum or last_level != level
	last_level = level
	data = inventory.duplicate(true)
	if not data.has("pants"):
		data["pants"] = bool(data.get("armor", true))
	is_dead = dead
	current_hp = hp
	max_hp = maximum
	gold_label.text = "●  %d ouro" % inventory.gold
	level_label.text = "%s · Nv. %d" % [player_class_name.trim_suffix(" humano"), level]
	life_label.text = "Vida  %d / %d" % [ceili(hp), int(maximum)]
	if refresh:
		_refresh_items()
	if changed:
		refresh_preview()

func _matches(index: int) -> bool:
	match category:
		"Armas": return index in [0, 6]
		"Trajes": return index in [3, 4, 5, 7]
		"Poções": return index == 1
		"Materiais": return index == 2
	return true

func _bag_count(index: int) -> int:
	if index in [1, 2]:
		return int(data[KEYS[index]])
	if int(data.get("identity_version", 0)) >= 1:
		return 0
	# Each gear entry represents one owned piece: worn or stored in the bag.
	return 0 if bool(data[KEYS[index]]) else 1

func _find_loot(item_id: String) -> Dictionary:
	if item_id.is_empty():
		return {}
	for item in data.get("loot_items", []):
		if item.id == item_id:
			return item
	for item in data.get("equipped_loot", {}).values():
		if item.id == item_id:
			return item
	return {}

func _loot_is_equipped(item_id: String) -> bool:
	for item in data.get("equipped_loot", {}).values():
		if item.id == item_id:
			return true
	return false

func rarity_color(rarity: String) -> Color:
	match rarity:
		"Incomum": return Color("71bb72")
		"Raro": return Color("60a7df")
		"Épico": return Color("ba84df")
		"Lendário": return Color("f0b84f")
	return Color("b1b4b9")

func _sync_loot_buttons() -> int:
	var present: Array[String] = []
	var shown := 0
	for item in data.get("loot_items", []):
		var item_id: String = item.id
		present.append(item_id)
		if not loot_buttons.has(item_id):
			var added_button := button_for("")
			added_button.custom_minimum_size = Vector2(72, 72)
			added_button.expand_icon = true
			added_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			added_button.add_theme_constant_override("icon_max_width", 64)
			added_button.icon_alignment = HORIZONTAL_ALIGNMENT_CENTER
			added_button.vertical_icon_alignment = VERTICAL_ALIGNMENT_TOP
			added_button.pressed.connect(select_loot.bind(item_id))
			bag_grid.add_child(added_button)
			loot_buttons[item_id] = added_button
		var button: Button = loot_buttons[item_id]
		bag_grid.move_child(button, IDS.size() + present.size() - 1)
		button.icon = icon_for(IDS.find(item.slot), item)
		button.tooltip_text = "%s · %s · %s\nAtaque +%d · Defesa +%d" % [item.name, item.rarity, LootItems.grade_text(item), item.attack_bonus, item.defense_bonus]
		button.visible = _matches(IDS.find(item.slot))
		if button.visible:
			shown += 1
		style_item_button(button, item.rarity, selected_loot_id == item_id)
	for item_id in loot_buttons.keys():
		if item_id not in present:
			var button: Button = loot_buttons[item_id]
			bag_grid.remove_child(button)
			button.queue_free()
			loot_buttons.erase(item_id)
	return shown

func _bonus_text(item: Dictionary) -> String:
	return "Ataque +%d · Defesa +%d" % [int(item.get("attack_bonus", 0)), int(item.get("defense_bonus", 0))]

func _current_slot_item(index: int) -> Dictionary:
	var loot := LootItems.equipped_item(data, IDS[index])
	if not loot.is_empty():
		return loot
	if bool(data[KEYS[index]]):
		return {"name": base_name(index), "slot": IDS[index], "rarity": "Inicial", "attack_bonus": 0, "defense_bonus": 0}
	return {}

func _show_current_equipment(index: int) -> Dictionary:
	var current := _current_slot_item(index)
	current_icon.texture = icon_for(index, current) if not current.is_empty() else null
	current_name.text = str(current.name) if not current.is_empty() else "Nenhum equipamento"
	current_name.add_theme_color_override("font_color", rarity_color(str(current.get("rarity", "Comum"))) if not current.is_empty() and current.rarity != "Inicial" else GOLD)
	current_description.text = "%s · %s\n%s" % [current.rarity, LootItems.grade_text(current), _bonus_text(current)] if not current.is_empty() else "Slot disponível"
	return current

func _refresh_loot_details(item: Dictionary) -> void:
	var index := IDS.find(item.slot)
	var equipped := _loot_is_equipped(str(item.id))
	var current := _show_current_equipment(index)
	selected_name.text = item.name
	selected_name.add_theme_color_override("font_color", rarity_color(item.rarity))
	selected_type.text = "%s · %s · %s" % [TYPES[index], item.rarity, LootItems.grade_text(item)]
	if item.has("weapon_type"):
		selected_type.text = "%s · %s · %s" % [LootItems.Catalog.class_text(item), item.rarity, LootItems.grade_text(item)]
	selected_icon.texture = icon_for(index, item)
	selected_description.text = _bonus_text(item)
	if LootItems.covers_pants(item):
		selected_type.text = "Traje completo · Peito e calça · " + LootItems.grade_text(item)
	var class_description := LootItems.Catalog.class_text(item)
	if not class_description.is_empty():
		selected_description.text += "\n" + class_description
	if not equipped:
		var attack_change := int(item.attack_bonus) - int(current.get("attack_bonus", 0))
		var defense_change := int(item.defense_bonus) - int(current.get("defense_bonus", 0))
		selected_description.text += "\n\nAo equipar:\nAtaque %s\nDefesa %s" % [_signed(attack_change), _signed(defense_change)]
	else:
		selected_description.text += "\n\nEquipado no personagem."
	selected_description.text += _set_details(item)
	action_button.text = "Retirar" if equipped else "Equipar"
	action_button.disabled = is_dead or (not equipped and not LootItems.Catalog.compatible(item, player_class_id))
	if not equipped and not LootItems.Catalog.compatible(item, player_class_id):
		action_button.text = "Outra classe"

func _signed(number: int) -> String:
	return ("+" if number >= 0 else "") + str(number)

func _refresh_items() -> void:
	if data.is_empty():
		return
	_refresh_set_summary()
	var occupied := 0
	var shown := 0
	for index in range(IDS.size()):
		var count := _bag_count(index)
		if count > 0:
			occupied += 1
		var button := item_buttons[index]
		button.tooltip_text = base_name(index)
		button.visible = count > 0 and _matches(index)
		if button.visible:
			shown += 1
		button.icon = icon_for(index) if count > 0 else null
		button.disabled = count == 0
		button.text = ""
		if count_labels.has(index): count_labels[index].text = "×%d" % count
		var active := selected_loot_id.is_empty() and selected == index
		style_item_button(button, "Comum", active)
	shown += _sync_loot_buttons()
	occupied += loot_buttons.size()
	var empty_count := maxi(20, ceili(shown / 5.0) * 5) - shown
	for index in range(empty_buttons.size()):
		empty_buttons[index].visible = index < empty_count
	for filter_name in filters:
		filters[filter_name].add_theme_stylebox_override("normal", style(Color("4a3a23") if filter_name == category else Color("172027"), GOLD if filter_name == category else Color("576168")))
	capacity_label.text = "MOCHILA  %d / %d" % [occupied, maxi(20, ceili(occupied / 5.0) * 5)]
	for index in equipped_buttons:
		var equipped: bool = LootItems.is_equipped(data, IDS[index])
		var loot := LootItems.equipped_item(data, IDS[index])
		equipped_buttons[index].icon = icon_for(index, loot) if equipped else null
		equipped_buttons[index].text = "" if equipped else "◇"
		equipped_buttons[index].tooltip_text = "%s · %s" % [loot.name, loot.rarity] if not loot.is_empty() else base_name(index) if equipped else "Slot vazio"
		if equipped:
			style_item_button(equipped_buttons[index], str(loot.get("rarity", "Comum")))
		else:
			equipped_buttons[index].add_theme_stylebox_override("normal", style(Color("172027")))
	var selected_loot := _find_loot(selected_loot_id)
	if not selected_loot.is_empty():
		_refresh_loot_details(selected_loot)
		return
	selected_loot_id = ""
	selected_name.text = base_name(selected)
	selected_name.add_theme_color_override("font_color", GOLD)
	selected_type.text = ("Arma · Arco" if player_class_id == "arqueiro" else "Arma · Varinha") if selected == 0 and player_class_id != "tanque" else TYPES[selected]
	selected_icon.texture = icon_for(selected)
	var equipped: bool = selected not in [1, 2] and bool(data[KEYS[selected]])
	current_icon.texture = icon_for(selected) if equipped else null
	current_name.text = base_name(selected) if equipped else "Nenhum equipamento" if selected not in [1, 2] else "Consumível" if selected == 1 else "Material"
	current_name.add_theme_color_override("font_color", GOLD)
	current_description.text = "Neste slot · Equipado" if equipped else "Slot disponível" if selected not in [1, 2] else "Uso pela mochila ou tecla Q" if selected == 1 else "Obtido ao derrotar Grelims"
	if selected not in [1, 2] and data.get("equipped_loot", {}).has(IDS[selected]):
		_show_current_equipment(selected)
	var descriptions := ["Espada de uma mão.\n\nEmpunhadura: mão direita\nEstado: %s" % ("equipada" if equipped else "guardada"), "Recupera 40 de vida.\n\nEstoque: %d\nIntervalo entre usos: 2 segundos" % data.potions, "Presa coletada de um Grelim.\n\nQuantidade: %d" % data.fangs, "Peitoral inicial.\n\nAltera somente o peito.", "Luvas do conjunto inicial.\n\nSem bônus de atributos nesta etapa.", "Botas do conjunto inicial.\n\nSem bônus de atributos nesta etapa.", "Escudo de uma mão.\n\nEmpunhadura: mão esquerda\nSem bônus passivo nesta etapa.", "Calça inicial.\n\nAltera somente as pernas."]
	selected_description.text = descriptions[selected]
	if selected == 0 and player_class_id != "tanque":
		selected_description.text = ("Arco original · Mão esquerda.\n\nAnimações nativas de arco do Fighter." if player_class_id == "arqueiro" else "Varinha original · Mão direita.\n\nModelo e conjuração nativos do humano Mage.") + "\nEstado: " + ("equipada" if equipped else "guardada")
	if IDS[selected] in LootItems.Catalog.CLOTHING_SLOTS:
		selected_type.text += " · No Grade"
		selected_description.text = "Roupa original do conjunto inicial.\n\n" + ("Altera somente o peito.\n\n" if selected == 3 else "Altera somente as pernas.\n\n" if selected == 7 else "") + "Sem bônus de atributos."
	if IDS[selected] in LootItems.Catalog.CLOTHING_SLOTS:
		selected_description.text += _set_details({"slot": IDS[selected], "rarity": "Comum"})
	action_button.text = "Usar poção" if selected == 1 else "Material de saque" if selected == 2 else "Retirar" if equipped else "Equipar"
	action_button.disabled = is_dead or selected == 2 or (selected == 1 and (data.potions <= 0 or current_hp >= max_hp))
	if int(data.get("identity_version", 0)) >= 1 and selected not in [1, 2] and not equipped:
		selected_name.text = "Slot vazio"
		selected_icon.texture = null
		selected_description.text = "Equipe um item compatível da sua mochila.\n\nEquipamentos são obtidos de monstros e baús."
		action_button.disabled = true

func _set_details(item: Dictionary) -> String:
	if str(item.get("slot", "")) not in LootItems.Catalog.CLOTHING_SLOTS:
		return ""
	var key := LootItems.collection_key(item, player_class_id)
	var collection: Dictionary = LootItems.Catalog.collections.get(key, {})
	if collection.is_empty():
		return ""
	var progress := LootItems.set_progress(data, player_class_id)
	var pieces: Array = progress.get(key, [])
	var missing: Array[String] = []
	for slot: String in LootItems.Catalog.CLOTHING_SLOTS:
		if slot not in pieces:
			missing.append({"armor": "peito", "pants": "calça", "gloves": "luvas", "boots": "botas"}[slot])
	return "\n\n%s · %d/4\n%s\n%s" % [collection.name, pieces.size(), LootItems.bonus_text(collection.bonus), "Bônus ativo" if missing.is_empty() else "Faltam: " + ", ".join(missing)]

func _refresh_set_summary() -> void:
	var progress := LootItems.set_progress(data, player_class_id)
	set_label.text = "Conjunto incompleto · Bônus inativo"
	set_label.add_theme_color_override("font_color", Color("9ca8ac"))
	for key: String in progress:
		if progress[key].size() == 4:
			set_label.text = LootItems.Catalog.collections[key].name + " · 4/4\n" + LootItems.bonus_text(LootItems.Catalog.collections[key].bonus)
			set_label.add_theme_color_override("font_color", Color("88ce91"))
