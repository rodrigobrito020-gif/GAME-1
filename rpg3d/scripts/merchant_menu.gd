extends PanelContainer
signal closed
signal trade_requested(mode: String, id: String, quantity: int)
signal sell_selected_requested(selection: Dictionary)
const Stock := preload("res://scripts/merchant_stock.gd")
const Icons := preload("res://scripts/item_icons.gd")
var status_label: Label
var gold_label: Label
var choice_label: Label
var quantity: SpinBox
var action_button: Button
var sell_list: VBoxContainer
var buy_list: VBoxContainer
var selected_mode := "buy"
var selected_id := "potion"
var _inventory: Dictionary = {}
var _class_id := "tanque"
var sale_selection: Dictionary = {}
var sale_checks: Dictionary = {}
var sell_selected_button: Button

func _style(background: Color, border := Color("9f885e")) -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = background
	box.border_color = border
	box.set_border_width_all(1)
	box.set_corner_radius_all(4)
	box.set_content_margin_all(12)
	return box

func _label(text: String, size := 17) -> Label:
	var node := Label.new()
	node.text = text
	node.add_theme_font_size_override("font_size", size)
	node.add_theme_color_override("font_color", Color("eee4ce"))
	return node

func _button(text: String) -> Button:
	var button := Button.new()
	button.text = text
	button.focus_mode = Control.FOCUS_NONE
	button.add_theme_stylebox_override("normal", _style(Color("1c292e")))
	button.add_theme_stylebox_override("hover", _style(Color("384237"), Color("e5c57d")))
	button.add_theme_stylebox_override("pressed", _style(Color("4a422b")))
	return button

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	offset_left = -535
	offset_right = 535
	offset_top = -300
	offset_bottom = 300
	add_theme_stylebox_override("panel", _style(Color("10191f")))
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 12)
	add_child(column)
	var header := HBoxContainer.new()
	column.add_child(header)
	var title := _label("BENTO · MERCADOR DA VILA", 25)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(title)
	gold_label = _label("0 ouro", 21)
	header.add_child(gold_label)
	var close_button := _button("Voltar [Esc / TAB]")
	close_button.pressed.connect(func() -> void: closed.emit())
	header.add_child(close_button)
	column.add_child(_label("Suprimentos para a próxima fenda. Venda os itens guardados na sua mochila.", 15))
	var lists := HBoxContainer.new()
	lists.add_theme_constant_override("separation", 18)
	lists.size_flags_vertical = Control.SIZE_EXPAND_FILL
	column.add_child(lists)
	for heading: String in ["COMPRAR", "VENDER · SUA MOCHILA"]:
		var section := VBoxContainer.new()
		section.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		lists.add_child(section)
		section.add_child(_label(heading, 20))
		var scroll := ScrollContainer.new()
		scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
		scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
		section.add_child(scroll)
		var list := VBoxContainer.new()
		list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		list.add_theme_constant_override("separation", 6)
		scroll.add_child(list)
		if heading == "COMPRAR": buy_list = list
		else: sell_list = list
	column.add_child(HSeparator.new())
	choice_label = _label("Selecione um item.", 17)
	choice_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	choice_label.custom_minimum_size.y = 44
	column.add_child(choice_label)
	var footer := HBoxContainer.new()
	column.add_child(footer)
	footer.add_child(_label("Quantidade:"))
	quantity = SpinBox.new()
	quantity.min_value = 1
	quantity.max_value = 99
	quantity.step = 1
	quantity.value_changed.connect(func(_value: float) -> void: _update_choice())
	footer.add_child(quantity)
	action_button = _button("Comprar")
	action_button.custom_minimum_size = Vector2(320, 44)
	action_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	action_button.pressed.connect(func() -> void: trade_requested.emit(selected_mode, selected_id, int(quantity.value)))
	footer.add_child(action_button)
	var bulk := HBoxContainer.new()
	column.add_child(bulk)
	sell_selected_button = _button("Vender selecionados")
	sell_selected_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	sell_selected_button.pressed.connect(func() -> void: sell_selected_requested.emit(sale_selection.duplicate()))
	bulk.add_child(sell_selected_button)
	var clear_button := _button("Limpar seleção")
	clear_button.pressed.connect(func() -> void:
		sale_selection.clear()
		sync_inventory(_inventory, _class_id)
	)
	bulk.add_child(clear_button)
	status_label = _label("Marque as caixas para vender vários itens. Marcar consumíveis seleciona a pilha inteira.", 14)
	status_label.custom_minimum_size.y = 22
	column.add_child(status_label)
	hide()

func _row(list: VBoxContainer, mode: String, item: Dictionary, price: int) -> void:
	var suffix := " ×%d" % item.get("count", 1) if mode == "sell" and int(item.get("count", 1)) > 1 else ""
	var button := _button("%s%s\n%d ouro %s" % [item.name, suffix, price, "cada" if mode == "sell" else "por compra"])
	button.custom_minimum_size.y = 72
	button.alignment = HORIZONTAL_ALIGNMENT_LEFT
	button.icon = Icons.for_display(item, _class_id)
	button.expand_icon = true
	button.add_theme_constant_override("icon_max_width", 48)
	button.add_theme_constant_override("h_separation", 12)
	button.tooltip_text = str(item.get("description", item.name))
	button.pressed.connect(select_entry.bind(mode, str(item.id)))
	if mode == "sell":
		var row := HBoxContainer.new()
		list.add_child(row)
		var check := CheckBox.new()
		check.custom_minimum_size.x = 36
		check.focus_mode = Control.FOCUS_NONE
		for state: String in ["checked", "checked_disabled"]:
			check.add_theme_icon_override(state, preload("res://assets/icons/sale_checked.svg"))
		for state: String in ["unchecked", "unchecked_disabled"]:
			check.add_theme_icon_override(state, preload("res://assets/icons/sale_unchecked.svg"))
		check.button_pressed = sale_selection.has(item.id)
		check.tooltip_text = "Selecionar para vender a pilha inteira (×%d)." % int(item.get("count", 1))
		check.toggled.connect(toggle_sale.bind(str(item.id)))
		row.add_child(check)
		sale_checks[item.id] = check
		button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(button)
	else:
		list.add_child(button)

func toggle_sale(enabled: bool, id: String) -> void:
	if not enabled:
		sale_selection.erase(id)
	else:
		for item: Dictionary in Stock.selling_entries(_inventory):
			if item.id == id: sale_selection[id] = int(item.count)
	_update_bulk()

func _update_bulk() -> void:
	var total := 0
	for item: Dictionary in Stock.selling_entries(_inventory):
		if sale_selection.has(item.id): total += Stock.sale_price(item) * int(sale_selection[item.id])
	sell_selected_button.text = "Vender %d selecionados · +%d ouro" % [sale_selection.size(), total]
	sell_selected_button.disabled = sale_selection.is_empty()

func sync_inventory(inv: Dictionary, class_id: String) -> void:
	_inventory = inv
	_class_id = class_id
	var valid_ids := {}
	for item: Dictionary in Stock.selling_entries(inv): valid_ids[item.id] = int(item.count)
	for id: String in sale_selection.keys():
		if not valid_ids.has(id): sale_selection.erase(id)
		else: sale_selection[id] = mini(sale_selection[id], valid_ids[id])
	sale_checks.clear()
	gold_label.text = "%d ouro" % int(inv.get("gold", 0))
	for list: VBoxContainer in [buy_list, sell_list]:
		for child in list.get_children():
			list.remove_child(child)
			child.queue_free()
	for id: String in Stock.OFFERS:
		var item: Dictionary = Stock.OFFERS[id].duplicate(true)
		item["id"] = id
		item["rarity"] = "Comum"
		_row(buy_list, "buy", item, int(item.price))
	var entries := Stock.selling_entries(inv)
	for item: Dictionary in entries:
		_row(sell_list, "sell", item, Stock.sale_price(item))
	if entries.is_empty(): sell_list.add_child(_label("Nenhum item guardado para vender.", 15))
	_update_choice()
	_update_bulk()

func select_entry(mode: String, id: String) -> void:
	selected_mode = mode
	selected_id = id
	quantity.set_value_no_signal(1)
	_update_choice()

func _update_choice() -> void:
	var item: Dictionary = Stock.OFFERS.get(selected_id, {}) if selected_mode == "buy" else {}
	if selected_mode == "sell":
		for value: Dictionary in Stock.selling_entries(_inventory):
			if value.id == selected_id: item = value
	if item.is_empty():
		choice_label.text = "Selecione outro item."
		action_button.disabled = true
		return
	quantity.max_value = 99 if selected_mode == "buy" else mini(99, int(item.count))
	quantity.editable = quantity.max_value > 1
	var price: int = int(item.price) if selected_mode == "buy" else Stock.sale_price(item)
	var total := price * int(quantity.value)
	choice_label.text = "%s · %s\n%s" % [item.name, "Comprar" if selected_mode == "buy" else "Vender", str(item.get("description", "O item será retirado da mochila."))]
	action_button.text = "%s · %d ouro" % ["Comprar" if selected_mode == "buy" else "Vender", total]
	action_button.disabled = selected_mode == "buy" and int(_inventory.get("gold", 0)) < total
