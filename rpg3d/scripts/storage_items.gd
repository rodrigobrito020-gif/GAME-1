extends RefCounted
## Personal storage shares the save, but never the merchant's sellable list.
const Loot := preload("res://scripts/loot_items.gd")
const LIMIT := 999999

static func entries(inv: Dictionary, stored: bool) -> Array[Dictionary]:
	var output: Array[Dictionary] = []
	for slot: String in ["potion", "fang"]:
		var field := ("storage_" if stored else "") + ("potions" if slot == "potion" else "fangs")
		if int(inv.get(field, 0)) > 0:
			output.append({"id":slot, "slot":slot, "name":"Poção de vida" if slot == "potion" else "Presa de Grelim", "rarity":"Comum", "count":int(inv[field])})
	for value: Variant in inv.get("storage_items" if stored else "loot_items", []):
		var item := Loot._validated_item(value)
		if not item.is_empty():
			item["count"] = 1
			output.append(item)
	return output

static func transfer(inv: Dictionary, direction: String, id: String, quantity: int) -> Dictionary:
	var rejected := {"ok":false, "message":"Não foi possível mover este item."}
	if direction not in ["deposit", "withdraw"] or quantity < 1 or quantity > LIMIT: return rejected
	var stored := direction == "withdraw"
	for item: Dictionary in entries(inv, stored):
		if item.id != id: continue
		if quantity > item.count: return rejected
		if inv.get("equipped_loot", {}).values().any(func(worn: Dictionary) -> bool: return worn.id == id): return rejected
		if item.slot in ["potion", "fang"]:
			var field := "potions" if item.slot == "potion" else "fangs"
			var from_field := ("storage_" if stored else "") + field
			var to_field := ("" if stored else "storage_") + field
			if int(inv.get(to_field, 0)) + quantity > LIMIT: return rejected
			inv[from_field] = int(inv[from_field]) - quantity
			inv[to_field] = int(inv.get(to_field, 0)) + quantity
		else:
			if quantity != 1: return rejected
			var from_key := "storage_items" if stored else "loot_items"
			var to_key := "loot_items" if stored else "storage_items"
			var source: Array = inv.get(from_key, [])
			var destination: Array = inv.get(to_key, [])
			if Loot._contains_id(destination, id): return rejected
			for index in source.size():
				if source[index].id == id:
					var original: Dictionary = source[index]
					source.remove_at(index)
					destination.append(original)
					break
			inv[from_key] = source
			inv[to_key] = destination
		return {"ok":true, "message":"%s: %s ×%d." % ["Guardado no baú" if not stored else "Retirado para a mochila", item.name, quantity]}
	return rejected
