extends GridContainer
## The same 72px cells, 64px icons and rarity backgrounds as the backpack.
signal item_pressed(id: String)
signal item_toggled(enabled: bool, id: String)
signal item_quick_transfer(id: String)
signal item_dropped(id: String)
const Icons := preload("res://scripts/item_icons.gd")
const MINIMUM_SLOTS := 30
var buttons: Dictionary = {}
var empty_buttons: Array[Button] = []
var transfer_peer: Control
var _drag_token: RefCounted

func _ready() -> void:
	columns = 6
	size_flags_horizontal = Control.SIZE_EXPAND_FILL
	add_theme_constant_override("h_separation", 6)
	add_theme_constant_override("v_separation", 6)
	set_drag_forwarding(Callable(), _can_receive_drag, _receive_drag)

func _drag_item(_position: Vector2, id: String) -> Variant:
	if not is_visible_in_tree() or not is_instance_valid(transfer_peer) or not buttons.has(id): return null
	var preview := TextureRect.new()
	preview.texture = buttons[id].icon
	preview.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	preview.size = Vector2(64, 64)
	preview.mouse_filter = Control.MOUSE_FILTER_IGNORE
	set_drag_preview(preview)
	return {"storage_source":self, "item_id":id, "token":_drag_token}

func _can_receive_drag(_position: Vector2, payload: Variant) -> bool:
	if not is_visible_in_tree() or not is_instance_valid(transfer_peer) or not transfer_peer.is_visible_in_tree(): return false
	if not payload is Dictionary or payload.get("storage_source") != transfer_peer: return false
	return payload.get("token") == transfer_peer._drag_token and transfer_peer.buttons.has(payload.get("item_id", ""))

func _receive_drag(position: Vector2, payload: Variant) -> void:
	if _can_receive_drag(position, payload): item_dropped.emit(str(payload.item_id))

func _slot_input(event: InputEvent, id: String, button: Button) -> void:
	if not is_instance_valid(transfer_peer) or not event is InputEventMouseButton or not event.pressed: return
	if event.button_index == MOUSE_BUTTON_RIGHT or (event.button_index == MOUSE_BUTTON_LEFT and event.double_click):
		button.accept_event()
		item_quick_transfer.emit(id)

func _appearance(button: Button, rarity: String, selected: bool) -> void:
	for state: String in ["normal", "hover", "pressed"]:
		var box := StyleBoxFlat.new()
		box.bg_color = Icons.background_color(rarity)
		box.border_color = Color("dfc48b") if selected or state != "normal" else Icons.RARITY_COLORS.get(rarity, Icons.RARITY_COLORS.Comum)
		box.set_border_width_all(2)
		box.set_corner_radius_all(3)
		box.set_content_margin_all(4)
		button.add_theme_stylebox_override(state, box)
	var empty := StyleBoxFlat.new()
	empty.bg_color = Color("141a20")
	empty.border_color = Color("373f43")
	empty.set_border_width_all(1)
	empty.set_corner_radius_all(3)
	button.add_theme_stylebox_override("disabled", empty)

func _badge(button: Button, text: String, right: bool) -> void:
	var label := Label.new()
	label.text = text
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	label.add_theme_font_size_override("font_size", 12)
	label.add_theme_color_override("font_color", Color("fff1cf"))
	label.add_theme_color_override("font_shadow_color", Color.BLACK)
	label.add_theme_constant_override("shadow_offset_x", 1)
	label.add_theme_constant_override("shadow_offset_y", 1)
	label.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_RIGHT if right else Control.PRESET_BOTTOM_LEFT)
	label.grow_horizontal = Control.GROW_DIRECTION_BEGIN if right else Control.GROW_DIRECTION_END
	label.grow_vertical = Control.GROW_DIRECTION_BEGIN
	label.offset_right = -4 if right else 4
	label.offset_left = -4 if right else 4
	label.offset_bottom = -3
	button.add_child(label)

func sync_items(items: Array[Dictionary], class_id: String, selected: Dictionary = {}, multi_select := false) -> void:
	_drag_token = RefCounted.new()
	for child in get_children():
		remove_child(child)
		child.queue_free()
	buttons.clear()
	empty_buttons.clear()
	var count := maxi(MINIMUM_SLOTS, ceili(items.size() / float(columns)) * columns)
	for index in count:
		var button := Button.new()
		button.custom_minimum_size = Vector2(72, 72)
		button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		button.focus_mode = Control.FOCUS_NONE
		button.expand_icon = true
		button.icon_alignment = HORIZONTAL_ALIGNMENT_CENTER
		button.add_theme_constant_override("icon_max_width", 64)
		add_child(button)
		button.set_drag_forwarding(Callable(), _can_receive_drag, _receive_drag)
		if index >= items.size():
			_appearance(button, "Comum", false)
			button.disabled = true
			button.tooltip_text = "Slot vazio"
			empty_buttons.append(button)
			continue
		var item: Dictionary = items[index]
		var id := str(item.id)
		var rarity := str(item.get("rarity", "Comum"))
		button.icon = Icons.for_display(item, class_id)
		button.tooltip_text = "%s\n%s%s" % [item.name, rarity, " · ×%d" % int(item.count) if item.get("count", 1) > 1 else ""]
		if item.has("price_text"): button.tooltip_text += "\n" + str(item.price_text)
		button.set_meta("rarity", rarity)
		button.toggle_mode = multi_select
		button.set_pressed_no_signal(multi_select and selected.has(id))
		_appearance(button, rarity, selected.has(id))
		buttons[id] = button
		if is_instance_valid(transfer_peer):
			button.tooltip_text += "\nDuplo clique esquerdo / clique direito: transferir tudo\nArraste para o outro inventário para transferir."
			button.gui_input.connect(_slot_input.bind(id, button))
			button.set_drag_forwarding(_drag_item.bind(id), _can_receive_drag, _receive_drag)
		if item.get("count", 1) > 1: _badge(button, "×%d" % int(item.count), true)
		if item.has("price"): _badge(button, "%d" % int(item.price), false)
		if multi_select:
			var marker := TextureRect.new()
			marker.texture = preload("res://assets/icons/sale_checked.svg")
			marker.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
			marker.mouse_filter = Control.MOUSE_FILTER_IGNORE
			marker.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
			marker.offset_left = -25
			marker.offset_right = -3
			marker.offset_top = 3
			marker.offset_bottom = 25
			marker.visible = button.button_pressed
			button.add_child(marker)
			button.toggled.connect(func(enabled: bool) -> void:
				marker.visible = enabled
				_appearance(button, rarity, enabled)
				item_toggled.emit(enabled, id)
			)
		button.pressed.connect(func() -> void: item_pressed.emit(id))

func highlight(selected: Dictionary) -> void:
	for id: String in buttons:
		var button: Button = buttons[id]
		_appearance(button, str(button.get_meta("rarity")), selected.has(id))
