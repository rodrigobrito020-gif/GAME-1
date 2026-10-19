extends RefCounted
## One catalog feeds NPC stock and drops; purchases create owned unique items.
const Catalog := preload("res://scripts/equipment_catalog.gd")
const Jewelry := preload("res://scripts/jewelry_catalog.gd")
const Data := preload("res://scripts/client_equipment_data.gd")
const RARITIES := ["Comum", "Incomum", "Raro", "Épico", "Lendário"]
static var _offers: Dictionary = {}
static var _pools: Dictionary = {}

static func offers(vendor: String) -> Array[Dictionary]:
	if _offers.has(vendor): return _offers[vendor]
	var result: Array[Dictionary] = []
	var sources := {"weapon":Data.WEAPONS} if vendor == "weapons" else {"clothing":Catalog.entries, "jewelry":Jewelry.ITEMS} if vendor == "armor" else {}
	for source: String in sources:
		for key: String in sources[source]:
			var entry: Dictionary = sources[source][key]
			var tier := Catalog.GRADES.find(entry.grade)
			var slot := str(entry.get("slot", {"ring":"ring1", "earring":"earring1", "necklace":"necklace"}.get(entry.get("kind", ""), "armor")))
			var item := {"id":source + ":" + key, "catalog_key":key, "source":source, "name":entry.name, "slot":slot, "grade":entry.grade, "rarity":RARITIES[tier], "count":1, "profile":entry.get("profile", "any")}
			if source == "weapon": item["weapon_type"] = entry.weapon_type
			item["price"] = [80, 450, 3000, 22000, 150000][tier] + (20 if slot in ["armor", "sword"] else 0)
			item["price_text"] = "%d ouro · %s" % [item.price, "No Grade" if tier == 0 else "Grau " + entry.grade]
			if source == "clothing": item["lineage_key"] = key
			elif source == "jewelry": item["jewelry_key"] = key
			else: item["weapon_key"] = key
			result.append(item)
	_offers[vendor] = result
	return result

static func find_offer(vendor: String, id: String) -> Dictionary:
	for item: Dictionary in offers(vendor):
		if item.id == id: return item
	return {}

static func create_item(offer: Dictionary) -> Dictionary:
	if offer.is_empty(): return {}
	var tier := RARITIES.find(offer.rarity)
	var strength: int = [3, 7, 16, 35, 75][tier]
	var item := {"id":Crypto.new().generate_random_bytes(16).hex_encode(), "slot":offer.slot, "name":offer.name, "rarity":offer.rarity, "grade":offer.grade, "attack_bonus":strength if offer.slot == "sword" else 0, "defense_bonus":0 if offer.source == "jewelry" or offer.slot == "sword" else strength}
	for field: String in ["weapon_type", "weapon_key", "lineage_key", "jewelry_key"]:
		if field == "weapon_type" and item.slot != "sword": continue
		if offer.has(field): item[field] = offer[field]
	if item.has("jewelry_key"):
		var entry: Dictionary = Jewelry.ITEMS[item.jewelry_key]
		item["magic_defense_bonus"] = entry.magic_defense_bonus
		item["hp_bonus"] = entry.hp_bonus
	return item

static func purchase(inv: Dictionary, vendor: String, id: String) -> Dictionary:
	var offer := find_offer(vendor, id)
	if offer.is_empty(): return {"ok":false, "message":"Este item não está disponível neste NPC."}
	var gold := int(inv.get("gold", 0))
	if gold < int(offer.price) or gold > 999999: return {"ok":false, "message":"Ouro insuficiente para esta compra."}
	var item := create_item(offer)
	if not inv.has("loot_items"): inv["loot_items"] = []
	inv.loot_items.append(item)
	inv.gold = gold - int(offer.price)
	return {"ok":true, "message":"%s recebido na mochila · -%d ouro." % [item.name, int(offer.price)], "item":item}

static func pool(kind: String, grade: String, class_id: String) -> Array[Dictionary]:
	var cache_key := kind + ":" + grade + ":" + class_id
	if _pools.has(cache_key): return _pools[cache_key]
	var result: Array[Dictionary] = []
	for vendor: String in ["armor", "weapons"]:
		for offer: Dictionary in offers(vendor):
			if offer.grade != grade: continue
			if kind in ["sword", "bow", "rod", "shield"]:
				if offer.source == "weapon" and offer.get("weapon_type", "") == kind: result.append(offer)
			elif kind in ["ring1", "earring1", "necklace"]:
				if offer.source == "jewelry" and offer.slot == kind: result.append(offer)
			elif offer.source == "clothing" and offer.slot == kind and offer.profile in ["any", Catalog.profile_for_class(class_id)]: result.append(offer)
	_pools[cache_key] = result
	return result
