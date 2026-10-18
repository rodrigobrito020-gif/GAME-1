extends PanelContainer
## Apresentação das recompensas já concedidas. O HUD controla o modal e a pausa.
signal closed

const ICONS := {
	"sword": preload("res://assets/icons/sword.svg"),
	"shield": preload("res://assets/icons/shield.svg"),
	"armor": preload("res://assets/icons/armor.svg"),
	"gloves": preload("res://assets/icons/gloves.svg"),
	"boots": preload("res://assets/icons/boots.svg"),
	"potion": preload("res://assets/icons/potion.svg"),
}
const SLOT_NAMES := {
	"sword": "ARMA", "shield": "ESCUDO", "armor": "ARMADURA",
	"gloves": "LUVAS", "boots": "BOTAS", "potion": "POÇÃO",
}
const RARITY_COLORS := {
	"Comum": Color("b7bdc3"), "Incomum": Color("7bce87"),
	"Raro": Color("73b6f2"), "Épico": Color("bf8de8"),
	"Lendário": Color("f4ca64"),
}

class RewardGlow extends Control:
	var glow_color := Color("e5c17c")
	var strength := 0.0:
		set(value):
			strength = value
			queue_redraw()

	func _draw() -> void:
		var center := size * 0.5
		var radius := minf(size.x, size.y) * 0.49
		for ring in range(18, 0, -1):
			var fraction := float(ring) / 18.0
			var tint := Color(glow_color, (0.025 - fraction * 0.014) * strength)
			draw_circle(center, radius * fraction, tint)
		draw_arc(center, radius * 0.85, 0.0, TAU, 64, Color(glow_color, 0.25 * strength), 1.0, true)

var continue_button: Button
var item_cards: Array[Control] = []
var title_label: Label
var _card_row: HBoxContainer
var _scroll: ScrollContainer
var _reveal_tween: Tween
var _glow_tween: Tween
var _glows: Array[RewardGlow] = []
var _built := false

func _ready() -> void:
	_build_ui()
	hide()

func _style(background: Color, border: Color, padding: int = 0) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = background
	style.border_color = border
	style.set_border_width_all(1)
	style.set_corner_radius_all(5)
	style.content_margin_left = padding
	style.content_margin_right = padding
	style.content_margin_top = padding
	style.content_margin_bottom = padding
	return style

func _label(text: String, font_size: int, color: Color) -> Label:
	var label := Label.new()
	label.text = text
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", color)
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return label

func _build_ui() -> void:
	if _built:
		return
	_built = true
	set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	offset_left = -450
	offset_right = 450
	offset_top = -250
	offset_bottom = 250
	z_index = 24
	mouse_filter = Control.MOUSE_FILTER_STOP
	var panel_style := _style(Color("111b22"), Color("c3a05b"), 24)
	panel_style.shadow_color = Color(0.0, 0.0, 0.0, 0.55)
	panel_style.shadow_size = 14
	add_theme_stylebox_override("panel", panel_style)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 10)
	add_child(column)
	title_label = _label("BAÚ CONQUISTADO", 29, Color("f0d29a"))
	column.add_child(title_label)
	column.add_child(_label("Recompensas adicionadas à mochila", 16, Color("c5d1d7")))
	var divider := HSeparator.new()
	divider.add_theme_stylebox_override("separator", _style(Color("594d36"), Color("594d36")))
	divider.custom_minimum_size.y = 1
	column.add_child(divider)
	_scroll = ScrollContainer.new()
	_scroll.custom_minimum_size.y = 290
	_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	column.add_child(_scroll)
	_card_row = HBoxContainer.new()
	_card_row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_card_row.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_card_row.alignment = BoxContainer.ALIGNMENT_CENTER
	_card_row.add_theme_constant_override("separation", 18)
	_scroll.add_child(_card_row)
	var footer := CenterContainer.new()
	column.add_child(footer)
	continue_button = Button.new()
	continue_button.text = "Continuar"
	continue_button.custom_minimum_size = Vector2(264, 46)
	continue_button.focus_mode = Control.FOCUS_NONE
	continue_button.add_theme_font_size_override("font_size", 20)
	continue_button.add_theme_color_override("font_color", Color("f9e8bf"))
	continue_button.add_theme_stylebox_override("normal", _style(Color("65502c"), Color("cfad68"), 9))
	continue_button.add_theme_stylebox_override("hover", _style(Color("836838"), Color("f4d795"), 9))
	continue_button.add_theme_stylebox_override("pressed", _style(Color("493a23"), Color("e3bf73"), 9))
	continue_button.pressed.connect(func() -> void: closed.emit())
	footer.add_child(continue_button)

func _make_card(item: Dictionary) -> PanelContainer:
	var rarity := str(item.get("rarity", "Comum"))
	var tint: Color = RARITY_COLORS.get(rarity, RARITY_COLORS["Comum"])
	var card := PanelContainer.new()
	card.custom_minimum_size = Vector2(234, 272)
	card.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	card.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var card_style := _style(Color("18232b"), tint.darkened(0.12), 14)
	card_style.set_border_width_all(2)
	card.add_theme_stylebox_override("panel", card_style)
	var content := VBoxContainer.new()
	content.add_theme_constant_override("separation", 6)
	card.add_child(content)
	var slot := str(item.get("slot", ""))
	content.add_child(_label(str(SLOT_NAMES.get(slot, "EQUIPAMENTO")), 12, Color("b5bfc3")))
	var icon_center := CenterContainer.new()
	content.add_child(icon_center)
	var icon_area := Control.new()
	icon_area.custom_minimum_size = Vector2(96, 96)
	icon_area.mouse_filter = Control.MOUSE_FILTER_IGNORE
	icon_center.add_child(icon_area)
	var glow := RewardGlow.new()
	glow.glow_color = tint
	glow.mouse_filter = Control.MOUSE_FILTER_IGNORE
	icon_area.add_child(glow)
	glow.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_glows.append(glow)
	var icon := TextureRect.new()
	icon.texture = ICONS.get(slot, ICONS["armor"])
	icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	icon_area.add_child(icon)
	icon.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	icon.offset_left = 14
	icon.offset_top = 14
	icon.offset_right = -14
	icon.offset_bottom = -14
	var item_name := _label(str(item.get("name", "Recompensa")), 18, Color("f0e6cc"))
	item_name.custom_minimum_size = Vector2(202, 46)
	item_name.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	item_name.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	item_name.max_lines_visible = 2
	item_name.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	content.add_child(item_name)
	content.add_child(_label(rarity, 16, tint))
	var bonuses: Array[String] = []
	var attack := int(item.get("attack_bonus", 0))
	var defense := int(item.get("defense_bonus", 0))
	if attack > 0:
		bonuses.append("Ataque +%d" % attack)
	if defense > 0:
		bonuses.append("Defesa +%d" % defense)
	var bonus_label := _label("\n".join(bonuses) if not bonuses.is_empty() else "Sem bônus de atributos", 14, Color("c8dcbf"))
	bonus_label.custom_minimum_size.y = 36
	bonus_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	content.add_child(bonus_label)
	return card

func _stop_animation() -> void:
	if _reveal_tween != null and _reveal_tween.is_valid():
		_reveal_tween.kill()
	if _glow_tween != null and _glow_tween.is_valid():
		_glow_tween.kill()

func show_items(items: Array) -> void:
	_build_ui()
	_stop_animation()
	for card: Control in item_cards:
		_card_row.remove_child(card)
		card.queue_free()
	item_cards.clear()
	_glows.clear()
	for item: Variant in items:
		if not item is Dictionary:
			continue
		var card := _make_card(item)
		_card_row.add_child(card)
		item_cards.append(card)
		card.modulate.a = 0.0
		card.scale = Vector2(0.92, 0.92)
	_scroll.scroll_horizontal = 0
	modulate.a = 0.0
	scale = Vector2(0.96, 0.96)
	show()
	_reveal_tween = create_tween()
	_reveal_tween.set_pause_mode(Tween.TWEEN_PAUSE_PROCESS)
	_reveal_tween.set_parallel(true)
	_reveal_tween.tween_property(self, "modulate:a", 1.0, 0.24)
	_reveal_tween.tween_property(self, "scale", Vector2.ONE, 0.30).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	for index in item_cards.size():
		var card := item_cards[index]
		var delay := 0.08 + float(index) * 0.10
		_reveal_tween.tween_property(card, "modulate:a", 1.0, 0.34).set_delay(delay)
		_reveal_tween.tween_property(card, "scale", Vector2.ONE, 0.40).set_delay(delay).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		_reveal_tween.tween_property(_glows[index], "strength", 1.0, 0.55).set_delay(delay)
	_reveal_tween.chain().tween_callback(_start_glow)
	_center_pivots.call_deferred()

func _center_pivots() -> void:
	pivot_offset = size * 0.5
	for card: Control in item_cards:
		card.pivot_offset = card.size * 0.5

func _start_glow() -> void:
	if not visible or _glows.is_empty():
		return
	_glow_tween = create_tween().set_loops()
	_glow_tween.set_pause_mode(Tween.TWEEN_PAUSE_PROCESS)
	_glow_tween.set_parallel(true)
	for glow: RewardGlow in _glows:
		_glow_tween.tween_property(glow, "strength", 0.55, 1.15).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	_glow_tween.chain()
	for glow: RewardGlow in _glows:
		_glow_tween.tween_property(glow, "strength", 1.0, 1.15).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)

func hide_panel() -> void:
	_stop_animation()
	hide()
	modulate.a = 1.0
	scale = Vector2.ONE
