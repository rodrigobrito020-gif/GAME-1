extends Node2D
## Regras e interface do protótipo. Personagens visuais em scenes/hero_visual.tscn.

const BattleEffects := preload("res://scripts/battle_effects.gd")
const BATTLE_BACKGROUND := preload("res://art/backgrounds/village_edge.png")
const SAVE_PATH := "user://progress.json"
const SkillCircle := preload("res://scripts/skill_circle.gd")
const GRELIM_TEXTURE := preload("res://art/enemies/grelim.tres")
const HERO_VISUAL := preload("res://scenes/hero_visual.tscn")
const HERO_HEIGHTS := [120.0, 142.0, 148.0, 148.0, 156.0]
const BISHOP_CAST_TIME := 25.0 / 30.0
const BISHOP_CAST_FRAMES: Array[Texture2D] = [
	preload("res://art/heroes/magic_test/frame-00.png"),
	preload("res://art/heroes/magic_test/frame-01.png"),
	preload("res://art/heroes/magic_test/frame-02.png"),
	preload("res://art/heroes/magic_test/frame-03.png"),
	preload("res://art/heroes/magic_test/frame-04.png"),
	preload("res://art/heroes/magic_test/frame-05.png"),
	preload("res://art/heroes/magic_test/frame-06.png"),
	preload("res://art/heroes/magic_test/frame-07.png"),
	preload("res://art/heroes/magic_test/frame-08.png"),
	preload("res://art/heroes/magic_test/frame-09.png"),
	preload("res://art/heroes/magic_test/frame-10.png"),
	preload("res://art/heroes/magic_test/frame-11.png"),
	preload("res://art/heroes/magic_test/frame-12.png"),
]
const BISHOP_DEATH_FRAMES: Array[Texture2D] = [
	preload("res://art/heroes/magic_test/death-00.png"),
	preload("res://art/heroes/magic_test/death-01.png"),
	preload("res://art/heroes/magic_test/death-02.png"),
	preload("res://art/heroes/magic_test/death-03.png"),
	preload("res://art/heroes/magic_test/death-04.png"),
	preload("res://art/heroes/magic_test/death-05.png"),
	preload("res://art/heroes/magic_test/death-06.png"),
	preload("res://art/heroes/magic_test/death-07.png"),
	preload("res://art/heroes/magic_test/death-08.png"),
	preload("res://art/heroes/magic_test/death-09.png"),
	preload("res://art/heroes/magic_test/death-10.png"),
	preload("res://art/heroes/magic_test/death-11.png"),
	preload("res://art/heroes/magic_test/death-12.png"),
	preload("res://art/heroes/magic_test/death-13.png"),
	preload("res://art/heroes/magic_test/death-14.png"),
	preload("res://art/heroes/magic_test/death-15.png"),
	preload("res://art/heroes/magic_test/death-16.png"),
	preload("res://art/heroes/magic_test/death-17.png"),
	preload("res://art/heroes/magic_test/death-18.png"),
	preload("res://art/heroes/magic_test/death-19.png"),
	preload("res://art/heroes/magic_test/death-20.png"),
	preload("res://art/heroes/magic_test/death-21.png"),
	preload("res://art/heroes/magic_test/death-22.png"),
	preload("res://art/heroes/magic_test/death-23.png"),
	preload("res://art/heroes/magic_test/death-24.png"),
	preload("res://art/heroes/magic_test/death-25.png"),
	preload("res://art/heroes/magic_test/death-26.png"),
	preload("res://art/heroes/magic_test/death-27.png"),
	preload("res://art/heroes/magic_test/death-28.png"),
	preload("res://art/heroes/magic_test/death-29.png"),
	preload("res://art/heroes/magic_test/death-30.png"),
	preload("res://art/heroes/magic_test/death-31.png"),
	preload("res://art/heroes/magic_test/death-32.png"),
	preload("res://art/heroes/magic_test/death-33.png"),
]
const HERO_TEXTURES := [
	preload("res://art/heroes/bounty_hunter.tres"),
	preload("res://art/heroes/bishop.tres"),
	preload("res://art/heroes/silver_ranger.tres"),
	preload("res://art/heroes/spellhowler.tres"),
	preload("res://art/heroes/destroyer.tres"),
]
const HEROES := [
	{"name": "Bounty Hunter", "race": "Anã", "gender": "Mulher", "role": "Tank", "kind": "tank", "color": Color("77b5d4"), "hp": 240.0, "atk": 15.0, "rate": 1.4, "skill": "Muralha", "description": "Protege a si mesmo por 5 segundos."},
	{"name": "Bishop", "race": "Humano", "gender": "Homem", "role": "Healer", "kind": "healer", "color": Color("8ad3a2"), "hp": 140.0, "atk": 12.0, "rate": 1.7, "skill": "Renovar", "description": "Cura todos os aliados vivos."},
	{"name": "Silver Ranger", "race": "Elfa branca", "gender": "Mulher", "role": "Arqueira", "kind": "archer", "color": Color("e3ba72"), "hp": 145.0, "atk": 23.0, "rate": 1.15, "skill": "Tiro preciso", "description": "Causa dano elevado em um alvo."},
	{"name": "Spellhowler", "race": "Elfa negra", "gender": "Mulher", "role": "Maga", "kind": "mage", "color": Color("b89ce5"), "hp": 125.0, "atk": 27.0, "rate": 1.65, "skill": "Tempestade", "description": "Atinge todos os inimigos vivos."},
	{"name": "Destroyer", "race": "Orc", "gender": "Homem", "role": "Guerreiro", "kind": "warrior", "color": Color("db9277"), "hp": 200.0, "atk": 22.0, "rate": 1.4, "skill": "Impacto", "description": "Golpe poderoso no inimigo da frente."},
]
const SLOT_POSITIONS := [Vector2(456, 390), Vector2(456, 600), Vector2(303, 390), Vector2(303, 600), Vector2(150, 390), Vector2(150, 600)]
const FOE_POSITIONS := [Vector2(825, 390), Vector2(825, 600), Vector2(985, 390), Vector2(985, 600), Vector2(1135, 390), Vector2(1135, 600)]
const BATTLE_SLOTS := [Vector2(475, 475), Vector2(475, 735), Vector2(305, 450), Vector2(305, 710), Vector2(135, 425), Vector2(135, 685)]
const BATTLE_FOES := [Vector2(790, 475), Vector2(790, 735), Vector2(970, 450), Vector2(970, 710), Vector2(1135, 425), Vector2(1135, 685)]
const WAVE_NAMES := ["Primeira onda", "Segunda onda", "Terceira onda", "Chefe da região"]

var effect_layer: Node2D
var drag_offset := Vector2.ZERO
var enemy_visuals: Array[Node2D] = []
var hero_visuals: Array[Node2D] = []
var hero_visual_root: Node2D
var heroes: Array[Dictionary] = []
var foes: Array[Dictionary] = []
var slots: Array[int] = [0, 4, 2, -1, 1, 3]
var levels: Array[int] = [1, 1, 1, 1, 1]
var stage := 1
var coins := 150
var wave := 0
var battle_view := false
var preparation_controls: Array[Control] = []
var subtitle_label: Label
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
var skill_circles: Array[Control] = []

func _ready() -> void:
	smoke_test = "--smoke-test" in OS.get_cmdline_user_args()
	if not smoke_test:
		_load_progress()
	_build_ui()
	_prepare_heroes()
	_create_hero_visuals()
	effect_layer = BattleEffects.new()
	effect_layer.name = "BattleEffects"
	effect_layer.items = effects
	add_child(effect_layer)
	move_child(effect_layer, 1)
	_preview_foes()
	_message("Arraste os heróis entre os círculos. A frente recebe os ataques primeiro.")
	_refresh_ui()
	if smoke_test:
		_run_smoke_test.call_deferred()

func _create_hero_visuals() -> void:
	hero_visual_root = Node2D.new()
	hero_visual_root.name = "HeroVisuals"
	hero_visual_root.y_sort_enabled = true
	add_child(hero_visual_root)
	move_child(hero_visual_root, 0)
	for i in range(HEROES.size()):
		var visual := HERO_VISUAL.instantiate()
		visual.name = HEROES[i].name.replace(" ", "")
		visual.artwork = HERO_TEXTURES[i]
		if i == 1:
			visual.cast_frames = BISHOP_CAST_FRAMES
			visual.death_frames = BISHOP_DEATH_FRAMES
		visual.character_height = HERO_HEIGHTS[i]
		visual.phase = i * 0.8
		hero_visual_root.add_child(visual)
		hero_visuals.append(visual)
	_sync_hero_visuals(0)

func _rebuild_enemy_visuals() -> void:
	for visual in enemy_visuals:
		hero_visual_root.remove_child(visual)
		visual.queue_free()
	enemy_visuals.clear()
	for foe in foes:
		var visual := HERO_VISUAL.instantiate()
		visual.name = "ChefeGrelim" if foe.kind == "boss" else "Grelim" + str(foe.id)
		visual.artwork = GRELIM_TEXTURE
		visual.character_height = 188.0 if foe.kind == "boss" else 116.0
		visual.attack_direction = -1.0
		visual.phase = foe.id * 0.7
		hero_visual_root.add_child(visual)
		enemy_visuals.append(visual)

func _sync_hero_visuals(delta: float) -> void:
	for i in range(hero_visuals.size()):
		hero_visuals[i].position = drag_position if dragging == i else _visual_position(heroes[i], false)
		hero_visuals[i].sync_visual(heroes[i], delta, paused)
	for i in range(enemy_visuals.size()):
		enemy_visuals[i].position = _visual_position(foes[i], true)
		enemy_visuals[i].sync_visual(foes[i], delta, paused)

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
	subtitle_label = _label("PREPARE SUA EQUIPE  ·  AVANCE PELAS REGIÕES", Vector2(38, 59), Vector2(700, 25), 13, Color("92aaa9"))
	wallet_label = _label("", Vector2(850, 26), Vector2(390, 32), 21, Color("dfd3a6"))
	wallet_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	title_label = _label("", Vector2(38, 109), Vector2(810, 36), 23)
	status_label = _label("", Vector2(38, 150), Vector2(1190, 28), 16, Color("9fb8b8"))
	start_button = _button("Iniciar batalha", Vector2(1020, 109), Vector2(220, 44), _primary_action)
	preparation_controls.append(_label("COLEÇÃO  ·  Selecione um herói para treinar", Vector2(38, 627), Vector2(780, 28), 15, Color("9fb8b8")))
	for i in range(HEROES.size()):
		var id := i
		cards.append(_button("", Vector2(38 + i * 177, 661), Vector2(167, 54), func() -> void: _select_hero(id)))
		preparation_controls.append(cards[-1])
		var circle := SkillCircle.new()
		circle.kind = HEROES[i].kind
		circle.accent = HEROES[i].color
		circle.activated.connect(func() -> void: _manual_skill(id))
		interface.add_child(circle)
		skill_circles.append(circle)
	preparation_controls.append(_label("Habilidades: clique no círculo acima do herói. Vermelho = recarga em segundos.", Vector2(38, 718), Vector2(880, 28), 14, Color("9fb8b8")))
	detail_label = _label("", Vector2(38, 746), Vector2(890, 48), 14, Color("b7cac8"))
	train_button = _button("Treinar", Vector2(942, 661), Vector2(298, 38), _train_selected)
	preparation_controls.append(detail_label)
	preparation_controls.append(train_button)
	pause_button = _button("Pausar", Vector2(942, 708), Vector2(140, 34), _toggle_pause)
	auto_button = _button("Auto: sim", Vector2(1094, 708), Vector2(146, 34), _toggle_auto)
	speed_button = _button("Velocidade: 1×", Vector2(942, 752), Vector2(298, 34), _toggle_speed)
	log_label = _label("", Vector2(700, 624), Vector2(540, 30), 12, Color("b8c5ba"))
	log_label.clip_text = true
	log_label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	log_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	log_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT

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
	_rebuild_enemy_visuals()

func _primary_action() -> void:
	if battle_view and mode in ["victory", "defeat"]:
		_return_to_preparation()
	else:
		_start_battle()

func _return_to_preparation() -> void:
	if mode == "battle":
		return
	battle_view = false
	mode = "formation"
	paused = false
	wave = 0
	elapsed = 0.0
	transition = 0.0
	dragging = -1
	effects.clear()
	_prepare_heroes()
	_preview_foes()
	_sync_hero_visuals(0)
	_message("Prepare a equipe e inicie a próxima batalha quando estiver pronto.")
	_refresh_ui()
	queue_redraw()

func _start_battle() -> void:
	if mode == "battle":
		return
	battle_view = true
	dragging = -1
	_prepare_heroes()
	wave = 0
	elapsed = 0.0
	transition = 0.0
	paused = false
	mode = "battle"
	effects.clear()
	_spawn_wave()
	_message("A batalha começou. Use os círculos acima dos heróis para ativar as habilidades.")
	_refresh_ui()

func _spawn_wave() -> void:
	foes.clear()
	if wave == 3:
		foes.append(_make_foe(0, true))
	else:
		for i in range(3 + wave):
			foes.append(_make_foe(i))
	_rebuild_enemy_visuals()
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
		if unit.kind == "boss":
			return Vector2(965, 650) if battle_view else Vector2(965, 520)
		return BATTLE_FOES[unit.id] if battle_view else FOE_POSITIONS[unit.id]
	var index := slots.find(int(unit.id))
	return BATTLE_SLOTS[index] if battle_view else SLOT_POSITIONS[index]

func _unit_height(unit: Dictionary, enemy: bool) -> float:
	return (188.0 if unit.kind == "boss" else 116.0) if enemy else HERO_HEIGHTS[unit.id]

func _skill_position(id: int, foot: Vector2) -> Vector2:
	return foot + Vector2(46, -HERO_HEIGHTS[id] - 53)

func _visual_position(unit: Dictionary, enemy: bool) -> Vector2:
	var foot := _unit_position(unit, enemy)
	var clock := float(unit.get("action_clock", 0))
	if unit.hp > 0 and clock > 0 and unit.has("move_to"):
		var progress := 1.0 - clock / maxf(0.01, unit.get("action_length", 0.65))
		foot = foot.lerp(unit.move_to, sin(clampf(progress, 0, 1) * PI))
	return foot

func _effect(kind: String, origin: Vector2, target: Vector2, color: Color, duration: float, hit_time: float, impact := Callable(), actor: Dictionary = {}) -> Dictionary:
	var item := {"kind": kind, "from": origin, "to": target, "color": color, "duration": duration, "age": 0.0, "hit_time": hit_time, "hit": false, "impact": impact, "actor": actor}
	effects.append(item)
	return item

func _number(pos: Vector2, text: String, color: Color) -> void:
	var item := _effect("number", pos, pos, color, 0.85, 0)
	item["text"] = text

func _step_effects(dt: float) -> void:
	for i in range(effects.size() - 1, -1, -1):
		var item := effects[i]
		item.age += dt
		if not item.hit and item.age >= item.hit_time:
			item.hit = true
			var actor: Dictionary = item.actor
			if item.impact.is_valid() and (actor.is_empty() or actor.hp > 0):
				item.impact.call()
		if item.age >= item.duration:
			effects.remove_at(i)

func _decay_visuals(dt: float) -> void:
	for unit in heroes + foes:
		unit["hurt"] = maxf(0, float(unit.get("hurt", 0)) - dt)
		unit["pulse"] = maxf(0, float(unit.get("pulse", 0)) - dt)
		unit["action_clock"] = maxf(0, float(unit.get("action_clock", 0)) - dt)

func _finish_actions() -> void:
	for i in range(effects.size() - 1, -1, -1):
		if not effects[i].hit and effects[i].impact.is_valid():
			effects.remove_at(i)
	for unit in heroes + foes:
		unit["action_clock"] = 0.0
		unit["pulse"] = 0.0
		unit["guard"] = 0.0

func _queue_attack(source: Dictionary, target: Dictionary, amount: float, target_is_enemy: bool, special := false) -> bool:
	if target.is_empty() or source.hp <= 0 or target.hp <= 0:
		return false
	var kind := "claw"
	var color := Color("edb18a")
	match source.kind:
		"archer":
			kind = "charged_arrow" if special else "arrow"
			color = Color("ffe19b")
		"mage":
			kind = "storm" if special else "orb"
			color = Color("c1a0ff")
		"healer":
			kind = "spark"
			color = Color("edebbd")
		"tank":
			kind = "hammer"
			color = Color("a8dcff")
		"warrior":
			kind = "cleave" if special else "axe"
			color = Color("ffb773")
	var melee := kind in ["hammer", "axe", "cleave", "claw"]
	var delay := 0.32 if melee else 0.44
	var duration := 0.68 if melee else 0.82
	if kind == "storm":
		delay = 0.5
		duration = 1.0
	elif kind == "spark":
		delay = BISHOP_CAST_TIME * 0.94
		duration = BISHOP_CAST_TIME
	source["action_clock"] = duration
	source["action_length"] = duration
	source["action_style"] = kind
	source["pulse"] = 0.3
	var source_foot := _unit_position(source, not target_is_enemy)
	var target_foot := _unit_position(target, target_is_enemy)
	if melee:
		source["move_to"] = target_foot + Vector2(-75 if target_is_enemy else 75, 0)
	else:
		source.erase("move_to")
	var origin := source_foot + Vector2(0, -_unit_height(source, not target_is_enemy) * 0.65)
	var destination := target_foot + Vector2(0, -_unit_height(target, target_is_enemy) * 0.55)
	_effect(kind, origin, destination, color, duration, delay, func() -> void: _apply_damage(source, target, amount, target_is_enemy), source)
	return true

func _queue_heal(source: Dictionary, target: Dictionary, amount: float) -> void:
	source["action_clock"] = BISHOP_CAST_TIME
	source["action_length"] = BISHOP_CAST_TIME
	source["action_style"] = "heal"
	source.erase("move_to")
	var destination := _unit_position(target, false) + Vector2(0, -45)
	_effect("heal", _unit_position(source, false), destination, Color("a1f4ac"), 1.15, BISHOP_CAST_TIME * 0.94, func() -> void: _heal(target, amount), source)

func _apply_damage(source: Dictionary, target: Dictionary, amount: float, target_is_enemy: bool) -> void:
	if target.is_empty() or target.hp <= 0.0:
		return
	var actual := amount * (0.35 if target.guard > 0.0 else 1.0)
	target.hp = maxf(0.0, target.hp - actual)
	target["hurt"] = 0.18
	_number(_unit_position(target, target_is_enemy) + Vector2(0, -_unit_height(target, target_is_enemy) * 0.7), "−" + str(roundi(actual)), Color("efd398") if target_is_enemy else Color("ee9891"))

func _heal(unit: Dictionary, amount: float) -> void:
	if unit.hp <= 0.0:
		return
	var actual := minf(amount, unit.max_hp - unit.hp)
	unit.hp += actual
	if actual > 0.1:
		_number(_unit_position(unit, false) + Vector2(0, -_unit_height(unit, false) * 0.7), "+" + str(roundi(actual)), Color("94dfab"))

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
			_queue_heal(hero, ally, hero.atk * 4.0)
	elif hero.kind == "tank":
		hero.guard = 5.0
		_effect("barrier", _unit_position(hero, false), _unit_position(hero, false) + Vector2(0, -HERO_HEIGHTS[id] * 0.5), Color("a4d9ff"), 0.9, 0.01)
	elif hero.kind == "mage":
		for enemy in enemies_alive:
			_queue_attack(hero, enemy, hero.atk * 2.0, true, true)
	else:
		_queue_attack(hero, enemies_alive[0], hero.atk * (3.8 if hero.kind == "archer" else 3.0), true, true)
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
	_advance(delta)
	_sync_hero_visuals(delta * speed)
	effect_layer.queue_redraw()
	_refresh_ui()
	queue_redraw()

func _advance(delta: float) -> void:
	if paused:
		return
	var dt := minf(delta, 0.1) * speed
	if mode == "battle":
		_tick(dt)
	else:
		_step_effects(dt)
		_decay_visuals(dt)

func _tick(dt: float) -> void:
	elapsed += dt
	_step_effects(dt)
	_decay_visuals(dt)
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
		hero.cooldown = maxf(0.0, hero.cooldown - dt)
		if automatic:
			_use_skill(hero.id)
		hero.attack_clock -= dt
		var alive := _living(foes)
		if hero.attack_clock <= 0.0 and float(hero.get("action_clock", 0)) <= 0.0 and not alive.is_empty():
			hero.attack_clock = hero.rate
			var healed := false
			if hero.kind == "healer":
				var allies := _living(heroes)
				allies.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return a.hp / a.max_hp < b.hp / b.max_hp)
				if allies[0].hp < allies[0].max_hp * 0.92:
					_queue_heal(hero, allies[0], hero.atk * 2.2)
					healed = true
			if not healed:
				_queue_attack(hero, alive[0], hero.atk, true)
	for foe in foes:
		if foe.hp <= 0.0:
			continue
		foe.attack_clock -= dt
		if foe.attack_clock <= 0.0 and float(foe.get("action_clock", 0)) <= 0.0:
			foe.attack_clock = foe.rate
			_queue_attack(foe, _front_hero(), foe.atk, false)
	if _living(heroes).is_empty():
		mode = "defeat"
		_finish_actions()
		_message("Equipe derrotada. Treine seus heróis ou ajuste a formação e tente novamente.")
	elif _living(foes).is_empty():
		if wave == 3:
			var reward := 100 + stage * 35
			coins += reward
			stage += 1
			mode = "victory"
			_finish_actions()
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
	if battle_view or mode == "battle" or levels[selected] >= 50 or coins < _train_cost():
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
		log_label.text = messages[-1]

func _layout_ui() -> void:
	for control in preparation_controls:
		control.visible = not battle_view
	subtitle_label.visible = not battle_view
	title_label.position = Vector2(38, 65) if battle_view else Vector2(38, 109)
	status_label.position = Vector2(38, 105) if battle_view else Vector2(38, 150)
	start_button.position = Vector2(1020, 66) if battle_view else Vector2(1020, 109)
	start_button.visible = mode != "battle"
	pause_button.visible = not battle_view or mode == "battle"
	auto_button.visible = pause_button.visible
	speed_button.visible = pause_button.visible
	pause_button.position = Vector2(730, 72) if battle_view else Vector2(942, 708)
	auto_button.position = Vector2(882, 72) if battle_view else Vector2(1094, 708)
	speed_button.position = Vector2(1034, 72) if battle_view else Vector2(942, 752)
	speed_button.size = Vector2(206, 34) if battle_view else Vector2(298, 34)
	log_label.position = Vector2(38, 764) if battle_view else Vector2(700, 624)
	log_label.size = Vector2(1202, 30) if battle_view else Vector2(540, 30)

func _refresh_ui() -> void:
	_layout_ui()
	wallet_label.text = str(coins) + " ADENA   ·   FASE " + str(stage)
	var headings := {"formation": "Floresta da Fenda · Preparação", "battle": "Floresta da Fenda · " + WAVE_NAMES[wave], "victory": "Vitória · Fase " + str(stage - 1) + " concluída", "defeat": "Derrota · Reorganize sua equipe"}
	title_label.text = headings[mode]
	status_label.text = "PAUSADO · use Continuar para retomar" if paused else ("%02d:%02d  ·  Onda %d/4  ·  Habilidades %s" % [int(elapsed) / 60, int(elapsed) % 60, wave + 1, "automáticas" if automatic else "manuais"] if mode == "battle" else ("Volte à preparação para treinar e organizar a equipe." if battle_view else "5 heróis · 6 posições · Arraste para mover ou trocar · 3 ondas e um chefe por fase"))
	start_button.disabled = mode == "battle"
	start_button.text = "Preparar próxima fase" if mode == "victory" else ("Reorganizar equipe" if mode == "defeat" else "Iniciar batalha")
	pause_button.disabled = mode != "battle"
	pause_button.text = "Continuar" if paused else "Pausar"
	auto_button.text = "Auto: " + ("sim" if automatic else "não")
	speed_button.text = "Velocidade: " + str(speed) + "×"
	for i in range(HEROES.size()):
		cards[i].text = ("● " if i == selected else "") + HEROES[i].name + "\n" + HEROES[i].role + " · Nv. " + str(levels[i])
		cards[i].modulate = HEROES[i].color if i == selected else Color.WHITE
		cards[i].tooltip_text = HEROES[i].race + " · " + HEROES[i].gender + " · " + HEROES[i].role
		var hero := heroes[i] if heroes.size() > i else {}
		if not hero.is_empty():
			var circle = skill_circles[i]
			var pos := drag_position if dragging == i else _visual_position(hero, false)
			circle.position = _skill_position(i, pos)
			circle.remaining = maxf(0, hero.cooldown)
			circle.cooling = mode == "battle" and hero.cooldown > 0 and hero.hp > 0
			circle.fallen = hero.hp <= 0
			circle.available = mode == "battle" and not paused and hero.hp > 0 and hero.cooldown <= 0 and transition <= 0
			circle.tooltip_text = HEROES[i].skill + " — " + HEROES[i].description + ("\nRecarga: " + str(ceili(hero.cooldown)) + " segundos" if circle.cooling else "")
			circle.queue_redraw()
	train_button.text = "Treinar: " + str(_train_cost()) + " Adena" if levels[selected] < 50 else "Nível máximo: 50"
	train_button.disabled = mode == "battle" or levels[selected] >= 50 or coins < _train_cost()
	detail_label.text = HEROES[selected].name + " · " + HEROES[selected].race + " · Comum · " + HEROES[selected].description + "\nTreino: +12% dos atributos base por nível. Raridades e demais sistemas virão depois."

func _move_hero(id: int, target: int) -> void:
	if battle_view or mode == "battle" or target < 0 or target >= slots.size():
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
	if battle_view:
		return
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed:
			for i in range(slots.size()):
				if slots[i] >= 0 and Rect2(SLOT_POSITIONS[i] + Vector2(-70, -HERO_HEIGHTS[slots[i]]), Vector2(140, HERO_HEIGHTS[slots[i]] + 15)).has_point(event.position):
					dragging = slots[i]
					drag_offset = SLOT_POSITIONS[i] - event.position
					drag_position = event.position + drag_offset
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
		drag_position = event.position + drag_offset
	queue_redraw()

func _draw() -> void:
	if battle_view:
		# Câmera mais aberta na vertical; preservar a proporção evita deformar os prédios.
		var source_size := BATTLE_BACKGROUND.get_size()
		var source_width := source_size.y * 1280.0 / 660.0
		var crop := Rect2((source_size.x - source_width) * 0.55, 0, source_width, source_size.y)
		draw_texture_rect_region(BATTLE_BACKGROUND, Rect2(0, 140, 1280, 660), crop)
		draw_rect(Rect2(0, 0, 1280, 140), Color("0b171e"))
		draw_rect(Rect2(0, 758, 1280, 42), Color(0.025, 0.04, 0.045, 0.72))
	else:
		draw_texture_rect(BATTLE_BACKGROUND, Rect2(0, 180, 1280, 440), false)
		draw_rect(Rect2(0, 97, 1280, 83), Color("101d24"))
		draw_rect(Rect2(0, 180, 1280, 43), Color(0.025, 0.045, 0.05, 0.38))
		draw_rect(Rect2(0, 620, 1280, 180), Color("0b141b"))
		draw_line(Vector2(0, 620), Vector2(1280, 620), Color("7c7451"), 2)
	if not battle_view:
		for i in range(SLOT_POSITIONS.size()):
			var pos: Vector2 = SLOT_POSITIONS[i]
			draw_set_transform(pos + Vector2(0, 7), 0, Vector2(1, 0.3))
			draw_arc(Vector2.ZERO, 43, 0, TAU, 48, Color("bcae7f") if slots[i] < 0 else Color("dacd9c"), 2)
			draw_set_transform(Vector2.ZERO)
			if slots[i] < 0:
				draw_string(ThemeDB.fallback_font, pos + Vector2(-22, -16), "VAZIO", HORIZONTAL_ALIGNMENT_LEFT, -1, 12, Color("e4d9b4"))
	for foe in foes:
		_draw_unit(foe, _visual_position(foe, true), true)
	for hero in heroes:
		if int(hero.id) != dragging:
			_draw_unit(hero, _visual_position(hero, false), false)
	if dragging >= 0:
		_draw_unit(heroes[dragging], drag_position, false)

func _draw_unit(unit: Dictionary, pos: Vector2, enemy: bool) -> void:
	var alive: bool = unit.hp > 0
	var size_factor := 2.5 if unit.kind == "boss" else 1.8
	draw_set_transform(pos + Vector2(0, 9), 0, Vector2(1, 0.28))
	draw_circle(Vector2.ZERO, 25 * size_factor / 2.15, Color(0, 0, 0, 0.24))
	draw_set_transform(Vector2.ZERO)
	if unit.guard > 0:
		draw_arc(pos + Vector2(0, -_unit_height(unit, enemy) * 0.5), _unit_height(unit, enemy) * 0.6, 0, TAU, 48, Color("a6d5f0"), 3)
	var bar_width := 100.0 if unit.kind == "boss" else 86.0
	var bar_pos := pos + Vector2(-bar_width / 2, -_unit_height(unit, enemy) - 14)
	var name_width := maxf(bar_width, ThemeDB.fallback_font.get_string_size(unit.name, HORIZONTAL_ALIGNMENT_LEFT, -1, 13).x + 8)
	draw_rect(Rect2(bar_pos + Vector2(-4, -21), Vector2(name_width, 20)), Color(0.025, 0.04, 0.045, 0.82))
	draw_rect(Rect2(bar_pos, Vector2(bar_width, 6)), Color("293735"))
	draw_rect(Rect2(bar_pos, Vector2(bar_width * maxf(0, unit.hp / unit.max_hp), 6)), Color("cc8f8c") if enemy else Color("91cba7"))
	draw_string(ThemeDB.fallback_font, bar_pos + Vector2(0, -7), unit.name, HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color("d5deda"))
	if not enemy and int(unit.id) == selected:
		draw_set_transform(pos + Vector2(0, 8), 0, Vector2(1, 0.3))
		draw_arc(Vector2.ZERO, 35, 0, TAU, 48, Color("e5d09a"), 2)
		draw_set_transform(Vector2.ZERO)
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

func _test_combat_timing() -> void:
	mode = "formation"
	_start_battle()
	automatic = false
	var target := foes[0]
	var initial_hp: float = target.hp
	_queue_attack(heroes[2], target, 10, true)
	_check(target.hp == initial_hp, "lançar flecha não causa dano instantâneo")
	_step_effects(0.2)
	_check(target.hp == initial_hp, "flecha em voo ainda não atingiu o alvo")
	_step_effects(0.25)
	_check(is_equal_approx(target.hp, initial_hp - 10), "flecha causa dano ao chegar")
	effects.clear()
	_queue_attack(heroes[0], target, 10, true)
	_decay_visuals(0.34)
	_check(_visual_position(heroes[0], false).distance_to(_unit_position(heroes[0], false)) > 100, "golpe físico aproxima o herói do alvo")
	_step_effects(0.34)
	_check(is_equal_approx(target.hp, initial_hp - 20), "golpe físico aplica dano no contato")
	_decay_visuals(0.5)
	_check(_visual_position(heroes[0], false) == _unit_position(heroes[0], false), "herói retorna à formação após o golpe")
	effects.clear()
	initial_hp = target.hp
	_queue_attack(heroes[4], target, 10, true)
	heroes[4].hp = 0.0
	_step_effects(1)
	_check(target.hp == initial_hp, "personagem derrotado não conclui ataque pendente")
	mode = "formation"
	_start_battle()
	heroes[3].cooldown = 0.0
	var original_hp: float = foes[0].hp
	_use_skill(3)
	_step_effects(0.51)
	var all_hit := true
	for foe in foes:
		all_hit = all_hit and is_equal_approx(foe.hp, original_hp - heroes[3].atk * 2)
	_check(all_hit, "tempestade atinge todos os inimigos vivos")
	heroes[0].cooldown = 0.0
	_use_skill(0)
	var tank_hp: float = heroes[0].hp
	_apply_damage(foes[0], heroes[0], 20, false)
	_check(is_equal_approx(tank_hp - heroes[0].hp, 7), "proteção reduz o dano recebido")
	effects.clear()
	_queue_attack(heroes[2], foes[0], 10, true)
	paused = true
	_advance(0.1)
	_check(effects[0].age == 0.0, "pausa interrompe o voo do projétil")
	paused = false
	_advance(0.1)
	_check(effects[0].age > 0.0, "continuar retoma o projétil")
	automatic = true
	mode = "formation"

func _run_smoke_test() -> void:
	_check(heroes.size() == 5 and slots.size() == 6, "cinco heróis em seis posições")
	_check(enemy_visuals.size() == 3 and enemy_visuals[0].body.texture == GRELIM_TEXTURE, "Grelims usam a arte adaptada")
	_check(enemy_visuals[0].attack_direction == -1.0, "Grelims atacam na direção dos heróis")
	_check(hero_visuals.size() == 5, "cinco cenas visuais de personagens instanciadas")
	for i in range(hero_visuals.size()):
		var expected_texture: Texture2D = BISHOP_CAST_FRAMES[0] if i == 1 else HERO_TEXTURES[i]
		_check(hero_visuals[i].body.texture == expected_texture and expected_texture.get_height() > 0, "arte carregada: " + HEROES[i].name)
	_check(hero_visuals[0].character_height < hero_visuals[4].character_height, "escala da anã menor que a do orc")
	var visual_sample: Dictionary = heroes[0].duplicate()
	visual_sample.pulse = 0.15
	hero_visuals[0].sync_visual(visual_sample, 0.05, false)
	_check(hero_visuals[0].body.position.x > 0, "movimento básico de ataque aplicado ao sprite")
	visual_sample["hurt"] = 0.1
	hero_visuals[0].sync_visual(visual_sample, 0, false)
	_check(hero_visuals[0].body.modulate.g < 1.0, "dano tem indicação visual")
	visual_sample.hp = 0.0
	hero_visuals[0].sync_visual(visual_sample, 0, false)
	_check(hero_visuals[0].body.scale.y < hero_visuals[0].body.scale.x, "derrota altera a pose visual")
	_sync_hero_visuals(0)
	var death_sample: Dictionary = heroes[1].duplicate()
	death_sample.hp = 0.0
	hero_visuals[1].sync_visual(death_sample, 0.0, false)
	_check(hero_visuals[1].body.texture == BISHOP_DEATH_FRAMES[0], "Bishop inicia a animação de morte")
	hero_visuals[1].sync_visual(death_sample, 1.0, false)
	_check(hero_visuals[1].death_frame == 12, "queda avança pelos quadros de morte")
	hero_visuals[1].sync_visual(death_sample, 1.0, true)
	_check(hero_visuals[1].death_frame == 12, "pausa interrompe a queda")
	hero_visuals[1].sync_visual(death_sample, 2.0, false)
	_check(hero_visuals[1].body.texture == BISHOP_DEATH_FRAMES[33], "Bishop mantém a pose final de morte")
	_check(is_equal_approx(hero_visuals[1].body.scale.x, hero_visuals[1].body.scale.y), "pose de morte preserva as proporções")
	hero_visuals[1].sync_visual(death_sample, 5.0, false)
	_check(hero_visuals[1].death_frame == 33, "pose de morte não repete a animação")
	hero_visuals[1].sync_visual(heroes[1], 0.0, false)
	_check(hero_visuals[1].death_frame == 0 and hero_visuals[1].body.texture == BISHOP_CAST_FRAMES[0], "nova tentativa restaura a pose viva do Bishop")
	var sorted_slots := slots.duplicate()
	sorted_slots.sort()
	_check(sorted_slots == [-1, 0, 1, 2, 3, 4], "cada herói aparece uma vez e há uma posição vazia")
	_move_hero(0, 3)
	_check(slots[3] == 0 and slots[0] == -1, "mover para posição vazia")
	_refresh_ui()
	_check(skill_circles[0].position == _skill_position(0, SLOT_POSITIONS[3]), "círculo acompanha o herói após mover a formação")
	_move_hero(0, 1)
	_check(slots[1] == 0 and slots[3] == 4, "trocar dois heróis")
	slots = [0, 4, 2, -1, 1, 3]
	var before := coins
	_train_selected()
	_check(levels[0] == 2 and coins == before - 25, "treino cobra Adena e aumenta nível")
	_test_combat_timing()
	_start_battle()
	_check(battle_view and not train_button.visible and not cards[0].visible, "batalha esconde coleção e treino para ampliar o cenário")
	var hp: float = heroes[0].hp
	_apply_damage(foes[0], heroes[0], 20, false)
	_check(heroes[0].hp < hp, "dano altera vida")
	heroes[1].cooldown = 0.0
	_check(_use_skill(1), "healer inicia habilidade de cura")
	_sync_hero_visuals(0)
	_check(hero_visuals[1].cast_frame == 0, "conjuração começa no primeiro quadro")
	var hp_before_heal: float = heroes[0].hp
	_decay_visuals(0.4)
	_step_effects(0.4)
	_sync_hero_visuals(0)
	_check(hero_visuals[1].cast_frame > 0 and heroes[0].hp == hp_before_heal, "quadros avançam antes do impacto da cura")
	var frame_before_pause: int = hero_visuals[1].cast_frame
	paused = true
	_advance(0.1)
	_sync_hero_visuals(0.1)
	_check(hero_visuals[1].cast_frame == frame_before_pause, "pausa mantém o quadro da conjuração")
	paused = false
	_decay_visuals(0.4)
	_step_effects(0.4)
	_sync_hero_visuals(0)
	_check(hero_visuals[1].cast_frame == 12, "conjuração alcança a pose final")
	_check(heroes[0].hp > hp - 20, "cura é aplicada no momento do efeito")
	_decay_visuals(0.1)
	_sync_hero_visuals(0)
	_check(hero_visuals[1].cast_frame == 0, "Bishop volta ao repouso após conjurar")
	var level_before := levels[0]
	_train_selected()
	_check(levels[0] == level_before, "treino bloqueado durante batalha")
	automatic = false
	heroes[2].cooldown = 0.0
	_refresh_ui()
	_check(skill_circles[2].available and not skill_circles[2].cooling, "círculo pronto para ativação manual")
	var click := InputEventMouseButton.new()
	click.button_index = MOUSE_BUTTON_LEFT
	click.pressed = true
	skill_circles[2]._gui_input(click)
	_check(heroes[2].cooldown == 9.0, "clique no círculo ativa a habilidade")
	_refresh_ui()
	_check(skill_circles[2].cooling and not skill_circles[2].available and skill_circles[2].remaining == 9.0, "círculo mostra recarga e bloqueia reuso")
	_check(not _use_skill(2), "recarga impede uso duplicado")
	heroes[2].cooldown = 0.0
	paused = true
	_refresh_ui()
	skill_circles[2]._gui_input(click)
	_check(heroes[2].cooldown == 0.0 and not skill_circles[2].available, "pausa bloqueia ativação pelo círculo")
	paused = false
	heroes[2].cooldown = 9.0
	automatic = true
	for i in range(12000):
		if mode != "battle":
			break
		_tick(0.05)
	_check(mode == "victory" and stage == 2 and wave == 3, "batalha completa: três ondas, chefe e próxima fase")
	_check(enemy_visuals.size() == 1 and enemy_visuals[0].character_height > 116, "chefe aparece sozinho e maior que o Grelim comum")
	_check(coins > before - 25, "vitória concede recompensa")
	for i in range(20):
		_advance(0.1)
	_check(effects.is_empty(), "efeitos desaparecem após vitória sem congelar")
	_refresh_ui()
	_check(start_button.visible and battle_view, "resultado mantém o campo ampliado e oferece retorno")
	var earned_coins := coins
	var completed_stage := stage
	var trained_levels := levels.duplicate()
	var saved_formation := slots.duplicate()
	_primary_action()
	_check(not battle_view and mode == "formation" and train_button.visible and cards[0].visible, "botão de resultado retorna à preparação com treino")
	_check(coins == earned_coins and stage == completed_stage and levels == trained_levels and slots == saved_formation, "retorno preserva recompensas, níveis e formação")
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
