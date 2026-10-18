extends RefCounted
## Equipment rewards and the transfer of unique items between bag and equipment.
const Catalog := preload("res://scripts/equipment_catalog.gd")

const SLOTS: Array[String] = ["sword", "shield", "armor", "gloves", "boots"]
const BASE_KEYS := {"sword": "equipped", "shield": "shield", "armor": "armor", "gloves": "gloves", "boots": "boots"}
const RARITIES: Array[String] = ["Comum", "Incomum", "Raro", "Épico", "Lendário"]
const GRADES := {"Comum": "No Grade", "Incomum": "D", "Raro": "C", "Épico": "B", "Lendário": "A"}
## Percentages, totaling 100. The RNG uses one roll for rarity, regardless of slot.
const WEIGHTS: Array[float] = [65.0, 27.0, 7.5, 0.45, 0.05]
const RARITY_CUTOFFS: Array[float] = [65.0, 92.0, 99.5, 99.95, 100.0]
const MAX_STAT_BONUS := 100000
const ITEM_NAMES := {"sword": "Espada", "shield": "Escudo", "armor": "Armadura", "gloves": "Luvas", "boots": "Botas"}
const WORLD_NAMES: Array[String] = ["da Campina", "da Floresta", "do Pântano", "das Ruínas", "da Montanha", "do Deserto", "da Geada", "das Cinzas", "do Abismo", "da Aurora"]
const RARITY_POWER: Array[int] = [1, 2, 4, 8, 16]

static func grade_for_rarity(rarity: String) -> String:
	return GRADES.get(rarity, "No Grade")

static func grade_text(item: Dictionary) -> String:
	var grade := grade_for_rarity(str(item.get("rarity", "Comum")))
	return "No Grade" if grade == "No Grade" else "Grau " + grade

static func rarity_for_roll(roll: float) -> String:
	# Boundary values belong to the next tier; e.g. 65.0 is Incomum.
	if is_nan(roll) or is_inf(roll):
		roll = 0.0
	for index in RARITIES.size():
		if roll < RARITY_CUTOFFS[index]:
			return RARITIES[index]
	return RARITIES.back()

static func create_reward(rng: RandomNumberGenerator, world_number: int, class_id: String = "tanque") -> Dictionary:
	var rarity := rarity_for_roll(rng.randf() * 100.0)
	var slot := SLOTS[rng.randi_range(0, SLOTS.size() - 1)]
	var world := clampi(world_number, 1, WORLD_NAMES.size())
	var power := world * RARITY_POWER[RARITIES.find(rarity)]
	var attack := 0
	var defense := 0
	match slot:
		"sword":
			attack = power * 2 + rng.randi_range(0, world)
		"shield", "armor":
			defense = power * 2 + rng.randi_range(0, world)
		"gloves":
			attack = power
			defense = power
		"boots":
			defense = power + rng.randi_range(0, world)
	# Crypto IDs remain unique across process restarts and save/load. They do not
	# consume the seeded reward RNG, so seeding still reproduces loot attributes.
	var id := Crypto.new().generate_random_bytes(16).hex_encode()
	var reward := {"id": id, "slot": slot, "name": "%s %s" % [ITEM_NAMES[slot], WORLD_NAMES[world - 1]], "rarity": rarity, "grade": grade_for_rarity(rarity), "attack_bonus": attack, "defense_bonus": defense}
	if slot in Catalog.CLOTHING_SLOTS:
		var key := Catalog.key_for(class_id, reward.grade, slot)
		reward["lineage_key"] = key
		reward["name"] = Catalog.get_entry(key).name
	return reward

static func is_equipped(inv: Dictionary, slot: String) -> bool:
	if slot not in SLOTS:
		return false
	var equipped: Variant = inv.get("equipped_loot", {})
	return bool(inv.get(BASE_KEYS[slot], false)) or (equipped is Dictionary and equipped.has(slot))

static func equip_item(inv: Dictionary, id: String, class_id: String = "") -> bool:
	var bag_value: Variant = inv.get("loot_items", [])
	var equipped_value: Variant = inv.get("equipped_loot", {})
	if not bag_value is Array or not equipped_value is Dictionary:
		return false
	var bag: Array = bag_value
	var equipped: Dictionary = equipped_value
	# Replaying an equip request must never duplicate an item already worn.
	for entry: Variant in equipped.values():
		if entry is Dictionary and entry.get("id", "") == id:
			return false
	var selected: Dictionary = {}
	for entry: Variant in bag:
		var item := _validated_item(entry)
		if not item.is_empty() and item.id == id:
			selected = item
			break
	if selected.is_empty():
		return false
	if not class_id.is_empty() and not Catalog.compatible(selected, class_id):
		return false
	var slot: String = selected.slot
	var previous := _validated_item(equipped.get(slot, {}))
	# Remove every matching bag entry, including malformed duplicate save entries.
	for index in range(bag.size() - 1, -1, -1):
		if bag[index] is Dictionary and bag[index].get("id", "") == id:
			bag.remove_at(index)
	if not previous.is_empty() and not _contains_id(bag, previous.id):
		bag.append(previous.duplicate(true))
	equipped[slot] = selected.duplicate(true)
	inv[BASE_KEYS[slot]] = false
	inv["loot_items"] = bag
	inv["equipped_loot"] = equipped
	return true

static func unequip_slot(inv: Dictionary, slot: String) -> bool:
	if slot not in SLOTS:
		return false
	var bag_value: Variant = inv.get("loot_items", [])
	var equipped_value: Variant = inv.get("equipped_loot", {})
	if not bag_value is Array or not equipped_value is Dictionary:
		return false
	var bag: Array = bag_value
	var equipped: Dictionary = equipped_value
	var previous := _validated_item(equipped.get(slot, {}))
	var had_equipment := bool(inv.get(BASE_KEYS[slot], false)) or not previous.is_empty()
	if not previous.is_empty() and not _contains_id(bag, previous.id):
		bag.append(previous.duplicate(true))
	equipped.erase(slot)
	inv[BASE_KEYS[slot]] = false
	inv["loot_items"] = bag
	inv["equipped_loot"] = equipped
	return had_equipment

static func restore_items(inv: Dictionary, saved: Dictionary) -> void:
	var bag: Array[Dictionary] = []
	var equipped: Dictionary = {}
	var seen: Dictionary = {}
	# Equipment wins if a corrupt save repeats the same ID in both locations.
	var saved_equipped: Variant = saved.get("equipped_loot", {})
	for slot: String in SLOTS:
		var base_key: String = BASE_KEYS[slot]
		if saved.get(base_key) is bool:
			inv[base_key] = saved[base_key]
		elif not inv.get(base_key) is bool:
			inv[base_key] = true
		if not saved_equipped is Dictionary:
			continue
		var item := _validated_item(saved_equipped.get(slot, {}))
		if item.is_empty() or item.slot != slot or seen.has(item.id):
			continue
		equipped[slot] = item.duplicate(true)
		seen[item.id] = true
		inv[base_key] = false
	var saved_bag: Variant = saved.get("loot_items", [])
	if saved_bag is Array:
		for value: Variant in saved_bag:
			var item := _validated_item(value)
			if item.is_empty() or seen.has(item.id):
				continue
			bag.append(item.duplicate(true))
			seen[item.id] = true
	inv["loot_items"] = bag
	inv["equipped_loot"] = equipped

static func bonuses(inv: Dictionary) -> Dictionary:
	var result := {"attack": 0, "defense": 0}
	var equipped: Variant = inv.get("equipped_loot", {})
	if not equipped is Dictionary:
		return result
	var seen: Dictionary = {}
	for slot: String in SLOTS:
		var item := _validated_item(equipped.get(slot, {}))
		if item.is_empty() or item.slot != slot or seen.has(item.id):
			continue
		seen[item.id] = true
		result.attack += item.attack_bonus
		result.defense += item.defense_bonus
	return result

static func _contains_id(bag: Array, id: String) -> bool:
	for entry: Variant in bag:
		if entry is Dictionary and entry.get("id", "") == id:
			return true
	return false

static func _validated_item(value: Variant) -> Dictionary:
	if not value is Dictionary:
		return {}
	for field: String in ["id", "slot", "name", "rarity"]:
		if not value.get(field) is String:
			return {}
	if value.id.is_empty() or value.id.length() > 128 or value.name.strip_edges().is_empty() or value.name.length() > 120:
		return {}
	if value.slot not in SLOTS or value.rarity not in RARITIES:
		return {}
	for stat: String in ["attack_bonus", "defense_bonus"]:
		if not value.get(stat) is int or value[stat] < 0 or value[stat] > MAX_STAT_BONUS:
			return {}
	var result := {"id": value.id, "slot": value.slot, "name": value.name, "rarity": value.rarity, "attack_bonus": value.attack_bonus, "defense_bonus": value.defense_bonus}
	if value.has("grade"):
		result["grade"] = grade_for_rarity(value.rarity)
	if value.has("lineage_key"):
		if not value.lineage_key is String:
			return {}
		var entry := Catalog.get_entry(value.lineage_key)
		if entry.is_empty() or entry.slot != value.slot or entry.grade != grade_for_rarity(value.rarity):
			return {}
		result["lineage_key"] = value.lineage_key
		result["name"] = entry.name
	return result

static func store_incompatible_clothing(inv: Dictionary, class_id: String) -> void:
	for slot: String in Catalog.CLOTHING_SLOTS:
		var item: Dictionary = inv.get("equipped_loot", {}).get(slot, {})
		if not Catalog.compatible(item, class_id):
			unequip_slot(inv, slot)
			inv[BASE_KEYS[slot]] = true
