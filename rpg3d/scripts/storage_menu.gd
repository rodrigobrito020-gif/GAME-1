extends PanelContainer
signal closed
signal transfer_requested(direction: String, id: String, quantity: int)
const Storage := preload("res://scripts/storage_items.gd")
const SlotGrid := preload("res://scripts/item_slot_grid.gd")
const Order := preload("res://scripts/inventory_order.gd")
var sort_buttons: Dictionary = {}
var sort_directions := {"deposit":0, "withdraw":0}
var bag_grid: GridContainer
var chest_grid: GridContainer
var status_label: Label
var selected_label: Label
var transfer_button: Button
var quantity: SpinBox
var selected_id := ""
var direction := "deposit"
var _inventory: Dictionary = {}
var _class_id := "tanque"

func _style() -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = Color("152127")
	box.border_color = Color("bba16a")
	box.set_border_width_all(1)
	box.set_corner_radius_all(4)
	box.set_content_margin_all(12)
	return box

func _label(text: String, size := 17) -> Label:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", size)
	return label

func _button(text: String) -> Button:
	var button := Button.new()
	button.text = text
	button.focus_mode = Control.FOCUS_NONE
	button.add_theme_stylebox_override("normal", _style())
	return button

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	offset_left = -535
	offset_right = 535
	offset_top = -300
	offset_bottom = 300
	add_theme_stylebox_override("panel", _style())
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 12)
	add_child(column)
	var header := HBoxContainer.new()
	column.add_child(header)
	var title := _label("BAÚ PESSOAL", 27)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(title)
	var close_button := _button("Voltar [Esc / TAB]")
	close_button.pressed.connect(func() -> void: closed.emit())
	header.add_child(close_button)
	column.add_child(_label("Seus itens guardados ficam fora da lista de venda e são compartilhados entre suas classes.", 15))
	var lists := HBoxContainer.new()
	lists.add_theme_constant_override("separation", 18)
	lists.size_flags_vertical = Control.SIZE_EXPAND_FILL
	column.add_child(lists)
	for heading: String in ["MOCHILA · GUARDAR", "BAÚ · RETIRAR"]:
		var side := VBoxContainer.new()
		side.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		lists.add_child(side)
		var mode := "deposit" if heading.begins_with("MOCHILA") else "withdraw"
		var row := HBoxContainer.new()
		side.add_child(row)
		var label := _label(heading, 20)
		label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(label)
		var sort_button := _button("Organizar")
		sort_button.add_theme_font_size_override("font_size", 13)
		Order.update_button(sort_button, 0)
		sort_button.pressed.connect(_sort_items.bind(mode))
		row.add_child(sort_button)
		sort_buttons[mode] = sort_button
		var scroll := ScrollContainer.new()
		scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
		scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
		side.add_child(scroll)
		var grid := SlotGrid.new()
		scroll.add_child(grid)
		grid.item_pressed.connect(func(id: String) -> void:
			select_entry(mode, id)
		)
		grid.item_quick_transfer.connect(_quick_transfer.bind(mode))
		grid.item_dropped.connect(_quick_transfer.bind("withdraw" if mode == "deposit" else "deposit"))
		if heading.begins_with("MOCHILA"): bag_grid = grid
		else: chest_grid = grid
	bag_grid.transfer_peer = chest_grid
	chest_grid.transfer_peer = bag_grid
	selected_label = _label("Selecione um item de um dos lados.", 18)
	column.add_child(selected_label)
	var footer := HBoxContainer.new()
	column.add_child(footer)
	footer.add_child(_label("Quantidade:"))
	quantity = SpinBox.new()
	quantity.min_value = 1
	quantity.max_value = 999999
	quantity.step = 1
	footer.add_child(quantity)
	transfer_button = _button("Guardar no baú")
	transfer_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	transfer_button.custom_minimum_size.y = 44
	transfer_button.pressed.connect(func() -> void: transfer_requested.emit(direction, selected_id, int(quantity.value)))
	footer.add_child(transfer_button)
	status_label = _label("Duplo clique, botão direito ou arrastar: transfere tudo. Para parte da pilha, use Quantidade.", 14)
	column.add_child(status_label)
	hide()

func sync_inventory(inv: Dictionary, class_id: String) -> void:
	_inventory = inv
	_class_id = class_id
	bag_grid.sync_items(Order.ordered(Storage.entries(inv, false), sort_directions.deposit), _class_id)
	chest_grid.sync_items(Order.ordered(Storage.entries(inv, true), sort_directions.withdraw), _class_id)
	_refresh_selected()

func _sort_items(mode: String) -> void:
	sort_directions[mode] = -1 if int(sort_directions[mode]) >= 0 else 1
	Order.update_button(sort_buttons[mode], sort_directions[mode])
	sync_inventory(_inventory, _class_id)

func _quick_transfer(id: String, mode: String) -> void:
	if not is_visible_in_tree(): return
	for item: Dictionary in Storage.entries(_inventory, mode == "withdraw"):
		if item.id == id:
			transfer_requested.emit(mode, id, int(item.get("count", 1)))
			return

func select_entry(mode: String, id: String) -> void:
	direction = mode
	selected_id = id
	quantity.value = 1
	_refresh_selected()

func _refresh_selected() -> void:
	var selected := {}
	for item: Dictionary in Storage.entries(_inventory, direction == "withdraw"):
		if item.id == selected_id: selected = item
	transfer_button.disabled = selected.is_empty()
	transfer_button.text = "Retirar para a mochila" if direction == "withdraw" else "Guardar no baú"
	selected_label.text = "Selecione um item de um dos lados." if selected.is_empty() else str(selected.name)
	quantity.max_value = int(selected.get("count", 1))
	quantity.editable = quantity.max_value > 1
	bag_grid.highlight({selected_id:true} if direction == "deposit" else {})
	chest_grid.highlight({selected_id:true} if direction == "withdraw" else {})
