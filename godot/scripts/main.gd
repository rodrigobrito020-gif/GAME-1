extends Node2D
## Protótipo independente: a arte provisória é desenhada aqui, sem assets externos.

const SAVE_PATH := "user://progress.json"
const HEROES := [
	{"name": "Guardião", "role": "Tank", "kind": "tank", "color": Color("77b5d4"), "hp": 240.0, "atk": 15.0, "rate": 1.4, "skill": "Muralha", "description": "Protege a si mesmo por 5 segundos."},
	{"name": "Restaurador", "role": "Healer", "kind": "healer", "color": Color("8ad3a2"), "hp": 140.0, "atk": 12.0, "rate": 1.7, "skill": "Renovar", "description": "Cura todos os aliados vivos."},
	{"name": "Batedora", "role": "Arqueira", "kind": "archer", "color": Color("e3ba72"), "hp": 145.0, "atk": 23.0, "rate": 1.15, "skill": "Tiro preciso", "description": "Causa dano elevado em um alvo."},
	{"name": "Elementalista", "role": "Maga", "kind": "mage", "color": Color("b89ce5"), "hp": 125.0, "atk": 27.0, "rate": 1.65, "skill": "Tempestade", "description": "Atinge todos os inimigos vivos."},
	{"name": "Devastador", "role": "Guerreiro", "kind": "warrior", "color": Color("db9277"), "hp": 200.0, "atk": 22.0, "rate": 1.4, "skill": "Impacto", "description": "Golpe poderoso no inimigo da frente."},
]
const SLOT_POSITIONS := [Vector2(456, 360), Vector2(456, 500), Vector2(303, 360), Vector2(303, 500), Vector2(150, 360), Vector2(150, 500)]
const FOE_POSITIONS := [Vector2(825, 360), Vector2(825, 500), Vector2(985, 360), Vector2(985, 500), Vector2(1135, 360), Vector2(1135, 500)]
const WAVE_NAMES := ["Primeira onda", "Segunda onda", "Terceira onda", "Chefe da região"]

var heroes: Array[Dictionary] = []
var foes: Array[Dictionary] = []
var slots: Array[int] = [0, 4, 2, -1, 1, 3]
var levels: Array[int] = [1, 1, 1, 1, 1]
var stage := 1
var coins := 150
var wave := 0
var mode := "formation"
var selected := 0
var dragging := -1
var drag_position := Vector2.ZERO
var paused := false
var automatic := true
var speed := 1
var elapsed := 0.0
var transition := 0.0
var effects: Array[Dictionary] = []
var messages: Array[String] = []
var smoke_test := false
var smoke_failures := 0
var interface: Control
var title_label: Label
var status_label: Label
var wallet_label: Label
var detail_label: Label
var log_label: Label
var start_button: Button
var train_button: Button
var pause_button: Button
var auto_button: Button
var speed_button: Button
var cards: Array[Button] = []
var skill_buttons: Array[Button] = []

func _ready() -> void:
	smoke_test = "--smoke-test" in OS.get_cmdline_user_args()
	if not smoke_test:
		_load_progress()
	_build_ui()
	_prepare_heroes()
	_preview_foes()
	_message("Arraste os heróis entre os círculos. A frente recebe os ataques primeiro.")
	_refresh_ui()
	if smoke_test:
		_run_smoke_test.call_deferred()

func _label(text: String, position: Vector2, size: Vector2, font_size: int, color := Color("e6ecea")) -> Label:
	var node := Label.new()
	node.text = text
	node.position = position
	node.size = size
	node.add_theme_font_size_override("font_size", font_size)
	node.add_theme_color_override("font_color", color)
	node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	interface.add_child(node)
	return node

func _button(text: String, position: Vector2, size: Vector2, callback: Callable) -> Button:
	var node := Button.new()
	node.text = text
	node.position = position
	node.size = size
	node.add_theme_font_size_override("font_size", 16)
	node.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	node.pressed.connect(callback)
	interface.add_child(node)
	return node

func _build_ui() -> void:
	interface = Control.new()
	interface.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	interface.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(interface)
	var theme := Theme.new()
	for style_name in ["normal", "hover", "pressed", "disabled", "focus"]:
		var style := StyleBoxFlat.new()
		style.bg_color = Color("233d48") if style_name != "hover" else Color("34565b")
		if style_name == "disabled":
			style.bg_color = Color("17252d")
		style.border_color = Color("8ac5aa") if style_name == "focus" else Color("3d5960")
		style.set_border_width_all(1)
		style.set_corner_radius_all(8)
		theme.set_stylebox(style_name, "Button", style)
	interface.theme = theme
	_label("RELOAD ADVENTURE", Vector2(36, 18), Vector2(600, 38), 28, Color("dfd3a6"))
	_label("PROTÓTIPO GODOT  /  PERSONAGENS PROVISÓRIOS", Vector2(38, 59), Vector2(700, 25), 13, Color("92aaa9"))
	wallet_label = _label("", Vector2(850, 26), Vector2(390, 32), 21, Color("dfd3a6"))
	wallet_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	title_label = _label("", Vector2(38, 109), Vector2(810, 36), 23)
	status_label = _label("", Vector2(38, 150), Vector2(1190, 28), 16, Color("9fb8b8"))
	start_button = _button("Iniciar batalha", Vector2(1020, 109), Vector2(220, 44), _start_battle)
	_label("SUA EQUIPE", Vector2(55, 195), Vector2(530, 30), 16, Color("9fd0bc"))
	_label("INIMIGOS", Vector2(795, 195), Vector2(400, 30), 16, Color("dfa29b"))
	_label("RETAGUARDA           MEIO                FRENTE", Vector2(98, 223), Vector2(490, 22), 12, Color("849c9d"))
	_label("COLEÇÃO  ·  Selecione um herói para treinar", Vector2(38, 558), Vector2(780, 28), 15, Color("9fb8b8"))
	for i in range(HEROES.size()):
		var id := i
		cards.append(_button("", Vector2(38 + i * 177, 598), Vector2(167, 70), func() -> void: _select_hero(id)))
		skill_buttons.append(_button("", Vector2(38 + i * 177, 681), Vector2(167, 42), func() -> void: _manual_skill(id)))
	detail_label = _label("", Vector2(38, 736), Vector2(890, 48), 14, Color("b7cac8"))
	train_button = _button("Treinar", Vector2(942, 599), Vector2(298, 42), _train_selected)
	pause_button = _button("Pausar", Vector2(942, 652), Vector2(140, 34), _toggle_pause)
	auto_button = _button("Auto: sim", Vector2(1094, 652), Vector2(146, 34), _toggle_auto)
	speed_button = _button("Velocidade: 1×", Vector2(942, 699), Vector2(298, 34), _toggle_speed)
	log_label = _label("", Vector2(650, 550), Vector2(590, 44), 12, Color("b8c5ba"))
	log_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_label("Arte original provisória · progresso salvo neste dispositivo", Vector2(942, 751), Vector2(300, 35), 11, Color("7e9598"))

func _prepare_heroes() -> void:
	heroes.clear()
	for i in range(HEROES.size()):
		var template: Dictionary = HEROES[i]
		var boost := 1.0 + (levels[i] - 1) * 0.12
		heroes.append({"id": i, "name": template.name, "kind": template.kind, "color": template.color, "max_hp": template.hp * boost, "hp": template.hp * boost, "atk": template.atk * boost, "rate": template.rate, "attack_clock": 0.3 + i * 0.2, "cooldown": 2.0 + i * 0.5, "guard": 0.0, "pulse": 0.0})

func _make_foe(id: int, boss: bool = false) -> Dictionary:
	var boost := 1.0 + (stage - 1) * 0.22 + wave * 0.12
	var hp := (430.0 if boss else 85.0) * boost
	return {"id": id, "name": "Chefe Grelim" if boss else "Grelim", "kind": "boss" if boss else "foe", "color": Color("ac778b") if boss else Color("99ad72"), "max_hp": hp, "hp": hp, "atk": (22.0 if boss else 10.0) * boost, "rate": 1.9 if boss else 1.65, "attack_clock": 0.9 + id * 0.3, "guard": 0.0, "pulse": 0.0}

func _preview_foes() -> void:
	foes.clear()
	for i in range(3):
		foes.append(_make_foe(i))

func _start_battle() -> void:
	if mode == "battle":
		return
	dragging = -1
	_prepare_heroes()
	wave = 0
	elapsed = 0.0
	transition = 0.0
	paused = false
	mode = "battle"
	effects.clear()
	_spawn_wave()
	_message("A batalha começou. Habilidades disponíveis nos botões abaixo.")
	_refresh_ui()

func _spawn_wave() -> void:
	foes.clear()
	if wave == 3:
		foes.append(_make_foe(0, true))
	else:
		for i in range(3 + wave):
			foes.append(_make_foe(i))
	_message(WAVE_NAMES[wave] + "!")

func _living(units: Array[Dictionary]) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for unit in units:
		if unit.hp > 0.0:
			result.append(unit)
	return result

func _front_hero() -> Dictionary:
	for id in slots:
		if id >= 0 and heroes[id].hp > 0.0:
			return heroes[id]
	return {}

func _unit_position(unit: Dictionary, enemy: bool) -> Vector2:
	if enemy:
		return Vector2(965, 400) if unit.kind == "boss" else FOE_POSITIONS[unit.id]
	return SLOT_POSITIONS[slots.find(int(unit.id))]

func _damage(source: Dictionary, target: Dictionary, amount: float, target_is_enemy: bool) -> void:
	if target.is_empty() or target.hp <= 0.0:
		return
	var actual := amount * (0.35 if target.guard > 0.0 else 1.0)
	target.hp = maxf(0.0, target.hp - actual)
	source.pulse = 0.18
	effects.append({"from": _unit_position(source, not target_is_enemy) + Vector2(0, -40), "to": _unit_position(target, target_is_enemy) + Vector2(0, -40), "text": "−" + str(roundi(actual)), "color": Color("efd398") if target_is_enemy else Color("ee9891"), "life": 0.7})

func _heal(unit: Dictionary, amount: float) -> void:
	if unit.hp <= 0.0:
		return
	var actual := minf(amount, unit.max_hp - unit.hp)
	unit.hp += actual
	if actual > 0.1:
		var pos := _unit_position(unit, false) + Vector2(0, -40)
		effects.append({"from": pos, "to": pos, "text": "+" + str(roundi(actual)), "color": Color("94dfab"), "life": 0.7})

func _use_skill(id: int) -> bool:
	var hero := heroes[id]
	var enemies_alive := _living(foes)
	if mode != "battle" or paused or transition > 0.0 or hero.hp <= 0.0 or hero.cooldown > 0.0 or enemies_alive.is_empty():
		return false
	if hero.kind == "healer":
		var injured := false
		for ally in _living(heroes):
			if ally.hp < ally.max_hp - 1:
				injured = true
		if not injured:
			return false
		for ally in _living(heroes):
			_heal(ally, hero.atk * 4.0)
	elif hero.kind == "tank":
		hero.guard = 5.0
	elif hero.kind == "mage":
		for enemy in enemies_alive:
			_damage(hero, enemy, hero.atk * 2.0, true)
	else:
		_damage(hero, enemies_alive[0], hero.atk * (3.8 if hero.kind == "archer" else 3.0), true)
	hero.cooldown = 9.0
	hero.pulse = 0.3
	_message(hero.name + ": " + HEROES[id].skill)
	return true

func _manual_skill(id: int) -> void:
	_use_skill(id)
	_refresh_ui()

func _process(delta: float) -> void:
	if smoke_test:
		return
	if mode == "battle" and not paused:
		_tick(minf(delta, 0.1) * speed)
	_refresh_ui()
	queue_redraw()

func _tick(dt: float) -> void:
	elapsed += dt
	for i in range(effects.size() - 1, -1, -1):
		effects[i].life -= dt
		if effects[i].life <= 0.0:
			effects.remove_at(i)
	if transition > 0.0:
		transition -= dt
		if transition <= 0.0:
			wave += 1
			_spawn_wave()
		return
	for hero in heroes:
		if hero.hp <= 0.0:
			continue
		hero.guard = maxf(0.0, hero.guard - dt)
		hero.pulse = maxf(0.0, hero.pulse - dt)
		hero.cooldown = maxf(0.0, hero.cooldown - dt)
		if automatic:
			_use_skill(hero.id)
		hero.attack_clock -= dt
		var alive := _living(foes)
		if hero.attack_clock <= 0.0 and not alive.is_empty():
			hero.attack_clock = hero.rate
			var healed := false
			if hero.kind == "healer":
				var allies := _living(heroes)
				allies.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return a.hp / a.max_hp < b.hp / b.max_hp)
				if allies[0].hp < allies[0].max_hp * 0.92:
					_heal(allies[0], hero.atk * 2.2)
					healed = true
			if not healed:
				_damage(hero, alive[0], hero.atk, true)
	for foe in foes:
		if foe.hp <= 0.0:
			continue
		foe.pulse = maxf(0.0, foe.pulse - dt)
		foe.attack_clock -= dt
		if foe.attack_clock <= 0.0:
			foe.attack_clock = foe.rate
			_damage(foe, _front_hero(), foe.atk, false)
	if _living(heroes).is_empty():
		mode = "defeat"
		_message("Equipe derrotada. Treine seus heróis ou ajuste a formação e tente novamente.")
	elif _living(foes).is_empty():
		if wave == 3:
			var reward := 100 + stage * 35
			coins += reward
			stage += 1
			mode = "victory"
			_message("Vitória! +" + str(reward) + " Adena. Próxima fase desbloqueada.")
			_save_progress()
		else:
			transition = 1.3
			_message("Onda vencida! A próxima se aproxima…")

func _select_hero(id: int) -> void:
	selected = id
	_refresh_ui()
	queue_redraw()

func _train_cost() -> int:
	return 25 + (levels[selected] - 1) * 15

func _train_selected() -> void:
	if mode == "battle" or levels[selected] >= 50 or coins < _train_cost():
		return
	coins -= _train_cost()
	levels[selected] += 1
	_prepare_heroes()
	_message(HEROES[selected].name + " avançou para o nível " + str(levels[selected]) + ".")
	_save_progress()
	_refresh_ui()

func _toggle_pause() -> void:
	if mode == "battle":
		paused = not paused
		_refresh_ui()

func _toggle_auto() -> void:
	automatic = not automatic
	_refresh_ui()

func _toggle_speed() -> void:
	speed = 2 if speed == 1 else 1
	_refresh_ui()

func _message(text: String) -> void:
	messages.append(text)
	if messages.size() > 2:
		messages.pop_front()
	if is_instance_valid(log_label):
		log_label.text = "\n".join(messages)

func _refresh_ui() -> void:
	wallet_label.text = str(coins) + " ADENA   ·   FASE " + str(stage)
	var headings := {"formation": "Floresta da Fenda · Preparação", "battle": "Floresta da Fenda · " + WAVE_NAMES[wave], "victory": "Vitória · Fase " + str(stage - 1) + " concluída", "defeat": "Derrota · Reorganize sua equipe"}
	title_label.text = headings[mode]
	status_label.text = "PAUSADO · use Continuar para retomar" if paused else ("%02d:%02d  ·  Onda %d/4  ·  Habilidades %s" % [int(elapsed) / 60, int(elapsed) % 60, wave + 1, "automáticas" if automatic else "manuais"] if mode == "battle" else "5 heróis · 6 posições · Arraste para mover ou trocar · 3 ondas e um chefe por fase")
	start_button.disabled = mode == "battle"
	start_button.text = "Em batalha" if mode == "battle" else ("Próxima fase" if mode == "victory" else "Tentar novamente" if mode == "defeat" else "Iniciar batalha")
	pause_button.disabled = mode != "battle"
	pause_button.text = "Continuar" if paused else "Pausar"
	auto_button.text = "Auto: " + ("sim" if automatic else "não")
	speed_button.text = "Velocidade: " + str(speed) + "×"
	for i in range(HEROES.size()):
		cards[i].text = ("● " if i == selected else "") + HEROES[i].name + "\n" + HEROES[i].role + " · Nv. " + str(levels[i])
		cards[i].modulate = HEROES[i].color if i == selected else Color.WHITE
		var hero := heroes[i] if heroes.size() > i else {}
		if not hero.is_empty():
			var remaining := float(hero.cooldown)
			skill_buttons[i].text = HEROES[i].skill + (" · " + str(ceili(remaining)) + "s" if mode == "battle" and remaining > 0 else "")
			skill_buttons[i].disabled = mode != "battle" or paused or hero.hp <= 0 or remaining > 0 or transition > 0
			skill_buttons[i].tooltip_text = HEROES[i].description
	train_button.text = "Treinar: " + str(_train_cost()) + " Adena" if levels[selected] < 50 else "Nível máximo: 50"
	train_button.disabled = mode == "battle" or levels[selected] >= 50 or coins < _train_cost()
	detail_label.text = HEROES[selected].name + " · Comum · " + HEROES[selected].description + "\nTreino: +12% dos atributos base por nível. Raridades e demais sistemas virão depois."

func _move_hero(id: int, target: int) -> void:
	if mode == "battle" or target < 0 or target >= slots.size():
		return
	var origin := slots.find(id)
	if origin < 0:
		return
	var other := slots[target]
	slots[target] = id
	slots[origin] = other
	_save_progress()

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_ESCAPE:
		_toggle_pause()
	if mode == "battle":
		return
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed:
			for i in range(slots.size()):
				if slots[i] >= 0 and event.position.distance_to(SLOT_POSITIONS[i] + Vector2(0, -28)) < 60:
					dragging = slots[i]
					drag_position = event.position + Vector2(0, 28)
					_select_hero(dragging)
					break
		else:
			if dragging >= 0:
				for i in range(slots.size()):
					if event.position.distance_to(SLOT_POSITIONS[i] + Vector2(0, -28)) < 65:
						_move_hero(dragging, i)
						break
			dragging = -1
	elif event is InputEventMouseMotion and dragging >= 0:
		drag_position = event.position + Vector2(0, 28)
	queue_redraw()

func _draw() -> void:
	draw_rect(Rect2(22, 97, 1236, 450), Color("10272d"))
	draw_rect(Rect2(22, 97, 1236, 450), Color("355256"), false, 2)
	# Silhuetas de floresta; sem texturas de terceiros.
	for i in range(18):
		var x := float(i * 83 - 25)
		draw_rect(Rect2(x, 199, 17, 330), Color("142f33"))
		draw_colored_polygon(PackedVector2Array([Vector2(x - 45, 310), Vector2(x + 9, 183 + (i % 3) * 17), Vector2(x + 62, 310)]), Color("183a3a"))
	draw_rect(Rect2(24, 287, 1232, 258), Color(0.08, 0.20, 0.19, 0.72))
	for i in range(45):
		var pos := Vector2(42 + (i * 137) % 1190, 300 + (i * 71) % 230)
		draw_line(pos, pos + Vector2(9, -4), Color("2b4940"), 2)
	draw_line(Vector2(637, 262), Vector2(637, 529), Color("35514b"), 1)
	for i in range(SLOT_POSITIONS.size()):
		var pos: Vector2 = SLOT_POSITIONS[i]
		draw_arc(pos + Vector2(0, 8), 43, 0, TAU, 32, Color("4b7169") if slots[i] < 0 else Color("719989"), 2)
		if slots[i] < 0:
			draw_string(ThemeDB.fallback_font, pos + Vector2(-22, -20), "VAZIO", HORIZONTAL_ALIGNMENT_LEFT, -1, 12, Color("72968b"))
	for foe in foes:
		_draw_unit(foe, _unit_position(foe, true), true)
	for hero in heroes:
		if int(hero.id) != dragging:
			_draw_unit(hero, _unit_position(hero, false), false)
	if dragging >= 0:
		_draw_unit(heroes[dragging], drag_position, false)
	for effect in effects:
		var opacity: float = clampf(effect.life / 0.7, 0.0, 1.0)
		var color: Color = effect.color
		color.a = opacity
		if effect.life > 0.48:
			draw_line(effect.from, effect.to, color, 3)
		draw_string(ThemeDB.fallback_font, effect.to + Vector2(-12, -30 - (0.7 - effect.life) * 45), effect.text, HORIZONTAL_ALIGNMENT_LEFT, -1, 20, color)

func _pixel_rect(pos: Vector2, rect: Rect2, color: Color, flip: bool, scale_factor: float) -> void:
	var x := -rect.position.x - rect.size.x if flip else rect.position.x
	draw_rect(Rect2(pos + Vector2(x, rect.position.y) * scale_factor, rect.size * scale_factor), color)

func _draw_unit(unit: Dictionary, pos: Vector2, enemy: bool) -> void:
	var alive: bool = unit.hp > 0
	var color: Color = unit.color if alive else Color("536263")
	var size_factor := 2.5 if unit.kind == "boss" else 1.8
	var outline := Color("15232b")
	if alive and unit.pulse > 0:
		pos.x += (-7 if enemy else 7) * sin(unit.pulse * 16)
	draw_set_transform(pos + Vector2(0, 9), 0, Vector2(1, 0.28))
	draw_circle(Vector2.ZERO, 25 * size_factor / 2.15, Color(0, 0, 0, 0.24))
	draw_set_transform(Vector2.ZERO)
	var parts := [
		[Rect2(-10, -29, 20, 25), outline], [Rect2(-9, -28, 18, 20), color.darkened(0.2)],
		[Rect2(-10, -33, 7, 9), color.lightened(0.15)], [Rect2(4, -33, 7, 9), color.lightened(0.15)],
		[Rect2(-7, -47, 14, 16), outline], [Rect2(-6, -44, 12, 12), Color("b5c782") if enemy else Color("dfb488")],
		[Rect2(-7, -48, 14, 6), Color("5b4c48") if not enemy else color.darkened(0.35)],
		[Rect2(2, -39, 3, 2), outline], [Rect2(-8, -10, 6, 11), outline], [Rect2(3, -10, 6, 11), outline],
		[Rect2(-10, -3, 8, 5), Color("34414a")], [Rect2(3, -3, 9, 5), Color("34414a")],
		[Rect2(-9, -13, 18, 3), Color("ad9561")], [Rect2(-13, -25, 5, 13), color], [Rect2(9, -25, 5, 13), color]
	]
	for part in parts:
		_pixel_rect(pos, part[0], part[1], enemy, size_factor)
	if unit.kind == "tank":
		_pixel_rect(pos, Rect2(11, -28, 11, 20), Color("c4b78c"), enemy, size_factor)
		_pixel_rect(pos, Rect2(13, -26, 7, 15), color.darkened(0.1), enemy, size_factor)
	elif unit.kind == "archer":
		for j in range(5):
			_pixel_rect(pos, Rect2(16 + (2 - absi(2 - j)) * 2, -38 + j * 6, 2, 7), Color("c79d63"), enemy, size_factor)
		_pixel_rect(pos, Rect2(16, -37, 1, 30), Color("e2d7b0"), enemy, size_factor)
	elif unit.kind in ["healer", "mage"]:
		_pixel_rect(pos, Rect2(16, -42, 2, 43), Color("987954"), enemy, size_factor)
		_pixel_rect(pos, Rect2(13, -47, 8, 8), color.lightened(0.3), enemy, size_factor)
		_pixel_rect(pos, Rect2(-8, -17, 17, 15), color.darkened(0.2), enemy, size_factor)
	else:
		_pixel_rect(pos, Rect2(16, -40, 4, 31), Color("c3cace"), enemy, size_factor)
		_pixel_rect(pos, Rect2(12, -13, 12, 3), Color("b59660"), enemy, size_factor)
	if unit.guard > 0:
		draw_arc(pos + Vector2(0, -45), 57, 0, TAU, 36, Color("a6d5f0"), 3)
	var bar_width := 100.0 if unit.kind == "boss" else 86.0
	var bar_pos := pos + Vector2(-bar_width / 2, -57 * size_factor)
	draw_rect(Rect2(bar_pos, Vector2(bar_width, 6)), Color("293735"))
	draw_rect(Rect2(bar_pos, Vector2(bar_width * maxf(0, unit.hp / unit.max_hp), 6)), Color("cc8f8c") if enemy else Color("91cba7"))
	draw_string(ThemeDB.fallback_font, bar_pos + Vector2(0, -7), unit.name, HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color("d5deda"))
	if not enemy and int(unit.id) == selected:
		draw_arc(pos + Vector2(0, 8), 35, 0, TAU, 32, Color("e5d09a"), 2)
	if not alive:
		draw_line(pos + Vector2(-17, -80), pos + Vector2(17, -45), Color("d69a90"), 4)
		draw_line(pos + Vector2(17, -80), pos + Vector2(-17, -45), Color("d69a90"), 4)

func _save_progress() -> void:
	if smoke_test:
		return
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		_message("Não foi possível salvar o progresso neste dispositivo.")
		return
	file.store_string(JSON.stringify({"version": 1, "coins": coins, "stage": stage, "levels": levels, "slots": slots}))

func _load_progress() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var data = JSON.parse_string(FileAccess.get_file_as_string(SAVE_PATH))
	if not data is Dictionary or data.get("version") != 1:
		return
	coins = clampi(int(data.get("coins", 150)), 0, 100000000)
	stage = clampi(int(data.get("stage", 1)), 1, 10000)
	var saved_levels = data.get("levels", [])
	if saved_levels is Array and saved_levels.size() == 5:
		for i in range(5):
			levels[i] = clampi(int(saved_levels[i]), 1, 50)
	var saved_slots = data.get("slots", [])
	if saved_slots is Array and saved_slots.size() == 6:
		var candidate: Array[int] = []
		for value in saved_slots:
			candidate.append(int(value))
		var sorted := candidate.duplicate()
		sorted.sort()
		if sorted == [-1, 0, 1, 2, 3, 4]:
			slots = candidate

func _check(condition: bool, explanation: String) -> void:
	if not condition:
		smoke_failures += 1
		push_error("SMOKE FAIL: " + explanation)
		return
	print("PASS: " + explanation)

func _run_smoke_test() -> void:
	_check(heroes.size() == 5 and slots.size() == 6, "cinco heróis em seis posições")
	var sorted_slots := slots.duplicate()
	sorted_slots.sort()
	_check(sorted_slots == [-1, 0, 1, 2, 3, 4], "cada herói aparece uma vez e há uma posição vazia")
	_move_hero(0, 3)
	_check(slots[3] == 0 and slots[0] == -1, "mover para posição vazia")
	_move_hero(0, 1)
	_check(slots[1] == 0 and slots[3] == 4, "trocar dois heróis")
	slots = [0, 4, 2, -1, 1, 3]
	var before := coins
	_train_selected()
	_check(levels[0] == 2 and coins == before - 25, "treino cobra Adena e aumenta nível")
	_start_battle()
	var hp: float = heroes[0].hp
	_damage(foes[0], heroes[0], 20, false)
	_check(heroes[0].hp < hp, "dano altera vida")
	heroes[1].cooldown = 0.0
	_check(_use_skill(1) and heroes[0].hp > hp - 20, "healer recupera vida")
	var level_before := levels[0]
	_train_selected()
	_check(levels[0] == level_before, "treino bloqueado durante batalha")
	automatic = false
	heroes[2].cooldown = 0.0
	_check(_use_skill(2), "habilidade manual disponível")
	_check(not _use_skill(2), "recarga impede uso duplicado")
	automatic = true
	for i in range(12000):
		if mode != "battle":
			break
		_tick(0.05)
	_check(mode == "victory" and stage == 2 and wave == 3, "batalha completa: três ondas, chefe e próxima fase")
	_check(coins > before - 25, "vitória concede recompensa")
	_start_battle()
	for hero in heroes:
		hero.hp = 0.0
	_tick(0.05)
	_check(mode == "defeat", "derrota detectada")
	_start_battle()
	_check(_living(heroes).size() == 5, "nova tentativa restaura equipe")
	_refresh_ui()
	queue_redraw()
	print("SMOKE COMPLETE: " + str(smoke_failures) + " falhas")
	get_tree().quit(0 if smoke_failures == 0 else 1)
