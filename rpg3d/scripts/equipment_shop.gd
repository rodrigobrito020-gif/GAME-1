extends PanelContainer
signal closed
signal purchase_requested(vendor: String, id: String)
const Gear := preload("res://scripts/gear_catalog.gd")
const Loot := preload("res://scripts/loot_items.gd")
const Icons := preload("res://scripts/item_icons.gd")
const SlotGrid := preload("res://scripts/item_slot_grid.gd")
const Preview := preload("res://scripts/equipment_preview.gd")
const Order := preload("res://scripts/inventory_order.gd")
const PAGE_SIZE := 30
var vendor := "armor"
var inventory: Dictionary = {}
var class_id := "tanque"
var selected_id := ""
var page := 0
var filtered: Array[Dictionary] = []
var grade_filter: OptionButton
var type_filter: OptionButton
var profile_filter: OptionButton
var search: LineEdit
var grid: GridContainer
var preview: SubViewportContainer
var preview_title: Label
var title: Label
var gold_label: Label
var count_label: Label
var page_label: Label
var name_label: Label
var description: Label
var selected_icon: TextureRect
var buy_button: Button
var set_button: Button
var previous: Button
var next: Button
var status_label: Label
var sort_button: Button
var sort_direction := 0
var _type_slots: Array[String] = []

func _style() -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = Color("10191f")
	box.border_color = Color("bba16a")
	box.set_border_width_all(1)
	box.set_corner_radius_all(4)
	box.set_content_margin_all(12)
	return box
func _label(text: String, pixels := 16) -> Label:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", pixels)
	return label
func _button(text: String) -> Button:
	var button := Button.new()
	button.text = text
	button.focus_mode = Control.FOCUS_NONE
	button.custom_minimum_size.y = 36
	return button
func _option(row: HBoxContainer, entries: Array) -> OptionButton:
	var option := OptionButton.new()
	for entry: String in entries: option.add_item(entry)
	option.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	option.item_selected.connect(func(_index: int) -> void: page = 0; _refresh_list())
	row.add_child(option)
	return option
func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	offset_left = -610
	offset_right = 610
	offset_top = -330
	offset_bottom = 330
	add_theme_stylebox_override("panel", _style())
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 10)
	add_child(column)
	var header := HBoxContainer.new()
	column.add_child(header)
	title = _label("EQUIPAMENTOS", 25)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(title)
	gold_label = _label("0 ouro", 20)
	header.add_child(gold_label)
	sort_button = _button("Organizar")
	Order.update_button(sort_button, 0)
	sort_button.pressed.connect(func() -> void:
		sort_direction = -1 if sort_direction >= 0 else 1
		Order.update_button(sort_button, sort_direction)
		page = 0
		_refresh_list()
	)
	header.add_child(sort_button)
	var back := _button("Voltar [Esc / TAB]")
	back.pressed.connect(func() -> void: closed.emit())
	header.add_child(back)
	column.add_child(_label("Todos os graus integrados · Selecione para experimentar. A prévia não altera seus itens.", 14))
	var body := HBoxContainer.new()
	body.add_theme_constant_override("separation", 14)
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	column.add_child(body)
	var mannequin := VBoxContainer.new()
	mannequin.custom_minimum_size.x = 240
	body.add_child(mannequin)
	preview_title = _label("PRÉVIA", 18)
	mannequin.add_child(preview_title)
	preview = Preview.new()
	mannequin.add_child(preview)
	set_button = _button("Experimentar conjunto")
	set_button.pressed.connect(func() -> void: _preview_selected(true))
	mannequin.add_child(set_button)
	var hint := _label("Apenas visualização.\nComprar entrega o item na mochila.\nHelmos comuns não têm malha no cliente.", 13)
	mannequin.add_child(hint)
	var browse := VBoxContainer.new()
	browse.custom_minimum_size.x = 476
	browse.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body.add_child(browse)
	var filters := HBoxContainer.new()
	browse.add_child(filters)
	grade_filter = _option(filters, ["Todos os graus"] + Gear.Catalog.GRADES)
	type_filter = _option(filters, ["Todos os tipos"])
	profile_filter = _option(filters, ["Todas as classes", "Tanque", "Arqueiro", "Mago / Curandeiro"])
	search = LineEdit.new()
	search.placeholder_text = "Buscar pelo nome do equipamento"
	search.clear_button_enabled = true
	search.text_changed.connect(func(_text: String) -> void: page = 0; _refresh_list())
	browse.add_child(search)
	count_label = _label("Catálogo", 14)
	browse.add_child(count_label)
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	browse.add_child(scroll)
	grid = SlotGrid.new()
	grid.item_pressed.connect(select_offer)
	scroll.add_child(grid)
	var pages := HBoxContainer.new()
	browse.add_child(pages)
	previous = _button("‹ Anterior")
	previous.pressed.connect(func() -> void: page -= 1; _refresh_list())
	pages.add_child(previous)
	page_label = _label("1 / 1")
	page_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	page_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	pages.add_child(page_label)
	next = _button("Próxima ›")
	next.pressed.connect(func() -> void: page += 1; _refresh_list())
	pages.add_child(next)
	var details := VBoxContainer.new()
	details.custom_minimum_size.x = 280
	details.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body.add_child(details)
	selected_icon = TextureRect.new()
	selected_icon.custom_minimum_size = Vector2(96, 96)
	selected_icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	selected_icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	details.add_child(selected_icon)
	name_label = _label("Selecione um item", 20)
	name_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	details.add_child(name_label)
	var details_scroll := ScrollContainer.new()
	details_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	details_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	details.add_child(details_scroll)
	description = _label("", 16)
	description.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	description.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	details_scroll.add_child(description)
	buy_button = _button("Comprar")
	buy_button.custom_minimum_size.y = 44
	buy_button.pressed.connect(func() -> void: purchase_requested.emit(vendor, selected_id))
	details.add_child(buy_button)
	status_label = _label("", 14)
	status_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	status_label.custom_minimum_size.y = 22
	column.add_child(status_label)
	hide()
func open_shop(kind: String, inv: Dictionary, player_class: String) -> void:
	vendor = kind
	inventory = inv
	class_id = player_class
	page = 0
	selected_id = ""
	title.text = "DARA · ARMADURAS E JOIAS" if vendor == "armor" else "ORIN · ARMAS E ESCUDOS"
	type_filter.clear()
	_type_slots.assign(["", "armor", "pants", "gloves", "boots", "helmet", "ring1", "earring1", "necklace"] if vendor == "armor" else ["", "sword", "bow", "rod", "shield"])
	for name: String in (["Todos os tipos", "Peitorais", "Calças", "Luvas", "Botas", "Helmos", "Anéis", "Brincos", "Colares"] if vendor == "armor" else ["Todos os tipos", "Espadas", "Arcos", "Armas mágicas", "Escudos"]): type_filter.add_item(name)
	type_filter.select(0)
	grade_filter.select(0)
	profile_filter.select(0)
	search.text = ""
	status_label.text = "Todos os itens desta loja também podem ser sorteados nos drops."
	show()
	sync_inventory(inv, player_class)
func sync_inventory(inv: Dictionary, player_class: String) -> void:
	inventory = inv
	class_id = player_class
	gold_label.text = "%d ouro" % int(inv.get("gold", 0))
	preview.set_source(inv, player_class)
	_refresh_list()
func _refresh_list() -> void:
	if grade_filter == null or _type_slots.is_empty(): return
	filtered.clear()
	var kind: String = _type_slots[maxi(0, type_filter.selected)]
	for offer: Dictionary in Gear.offers(vendor):
		if grade_filter.selected > 0 and offer.grade != Gear.Catalog.GRADES[grade_filter.selected - 1]: continue
		if not kind.is_empty() and str(offer.get("weapon_type", offer.slot) if vendor == "weapons" else offer.slot) != kind: continue
		if profile_filter.selected > 0:
			var role: String = ["tanque", "arqueiro", "mago"][profile_filter.selected - 1]
			if not Gear.Catalog.compatible(offer, role): continue
		if not search.text.strip_edges().is_empty() and not str(offer.name).to_lower().contains(search.text.strip_edges().to_lower()): continue
		filtered.append(offer)
	filtered = Order.ordered(filtered, sort_direction)
	if not filtered.any(func(offer: Dictionary) -> bool: return offer.id == selected_id): selected_id = ""
	var total_pages := maxi(1, ceili(filtered.size() / float(PAGE_SIZE)))
	page = clampi(page, 0, total_pages - 1)
	var page_items: Array[Dictionary] = []
	for index in range(page * PAGE_SIZE, mini((page + 1) * PAGE_SIZE, filtered.size())): page_items.append(filtered[index])
	grid.sync_items(page_items, class_id, {selected_id:true})
	count_label.text = "%d itens · %d neste catálogo" % [filtered.size(), Gear.offers(vendor).size()]
	page_label.text = "%d / %d" % [page + 1, total_pages]
	previous.disabled = page == 0
	next.disabled = page >= total_pages - 1
	if selected_id.is_empty() and not page_items.is_empty(): select_offer(page_items[0].id)
	else: _refresh_details()
func select_offer(id: String) -> void:
	selected_id = id
	grid.highlight({id:true})
	_refresh_details()
	_preview_selected(false)
func _preview_selected(complete_set: bool) -> void:
	var offer := Gear.find_offer(vendor, selected_id)
	if offer.is_empty(): return
	preview.show_offer(offer, complete_set)
	preview_title.text = "PRÉVIA · " + {"tanque":"TANQUE", "arqueiro":"ARQUEIRO", "mago":"MAGO", "healer":"CURANDEIRO"}[preview.preview_class]
func _refresh_details() -> void:
	var offer := Gear.find_offer(vendor, selected_id)
	buy_button.disabled = offer.is_empty()
	set_button.disabled = true
	if offer.is_empty():
		name_label.text = "Nenhum item neste filtro."
		description.text = ""
		selected_icon.texture = null
		buy_button.text = "Selecione um item"
		return
	var item := Gear.create_item(offer)
	selected_icon.texture = Icons.for_display(item, class_id)
	name_label.text = offer.name
	name_label.add_theme_color_override("font_color", Icons.RARITY_COLORS[offer.rarity])
	var slot := Loot.destination_slot(inventory, item)
	var equipped := Loot.equipped_item(inventory, slot)
	description.text = "%s · %s\n%s\n\nAtaque +%d\nDefesa +%d" % [offer.rarity, "No Grade" if offer.grade == "No Grade" else "Grau " + offer.grade, Gear.Catalog.class_text(item), item.attack_bonus, item.defense_bonus]
	if item.has("magic_defense_bonus"): description.text += "\nDefesa mágica +%d\nVida +%d" % [item.magic_defense_bonus, item.hp_bonus]
	description.text += "\n\nEquipado: %s\nDiferença: Ataque %+d · Defesa %+d" % [equipped.get("name", "slot vazio"), item.attack_bonus - int(equipped.get("attack_bonus", 0)), item.defense_bonus - int(equipped.get("defense_bonus", 0))]
	if not Gear.Catalog.compatible(item, class_id): description.text += "\n\nEste item é para outra classe."
	if item.slot == "helmet": description.text += "\n\nHelmo original: o cliente não fornece malha visível para a cabeça. Os atributos funcionam ao equipar."
	var set_id := str(Gear.Catalog.get_entry(str(item.get("lineage_key", ""))).get("set_id", ""))
	if Gear.Catalog.collections.has(set_id):
		set_button.disabled = false
		description.text += "\n\nConjunto: " + str(Gear.Catalog.collections[set_id].name) + "\nBônus completo: " + Loot.bonus_text(Gear.Catalog.collections[set_id].bonus)
	buy_button.text = "Comprar · %d ouro" % int(offer.price)
	buy_button.disabled = int(inventory.get("gold", 0)) < int(offer.price)
