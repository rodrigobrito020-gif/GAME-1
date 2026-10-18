extends RefCounted
## Transactions validate before mutation. Only stored items can be sold.
const Loot := preload("res://scripts/loot_items.gd")
const LIMIT := 999999
const OFFERS := {
	"potion": {"name":"Poção de vida", "slot":"potion", "field":"potions", "count":1, "price":12, "description":"Recupera 40 de vida. Usa a configuração automática da sua poção."},
	"potion_bundle": {"name":"Kit com 5 poções", "slot":"potion", "field":"potions", "count":5, "price":50, "description":"Cinco poções de vida com desconto. Cada uma recupera 40 de vida."},
	"fang": {"name":"Presa de Grelim", "slot":"fang", "field":"fangs", "count":1, "price":8, "description":"Material comum de Grelim."},
}

static func sale_price(item: Dictionary) -> int:
	if item.get("slot", "") == "potion": return 3
	if item.get("slot", "") == "fang": return 2
	if Loot._validated_item(item).is_empty(): return 0
	var tier := Loot.RARITIES.find(item.rarity)
	return [8, 20, 60, 180, 600][tier] + mini(1000, int(item.attack_bonus) + int(item.defense_bonus) + int(item.get("magic_defense_bonus", 0)) + int(item.get("hp_bonus", 0)))

static func selling_entries(inv: Dictionary) -> Array[Dictionary]:
	var entries: Array[Dictionary] = []
	for slot: String in ["potion", "fang"]:
		var field := "potions" if slot == "potion" else "fangs"
		if int(inv.get(field, 0)) > 0:
			entries.append({"id":slot, "slot":slot, "name":"Poção de vida" if slot == "potion" else "Presa de Grelim", "rarity":"Comum", "count":int(inv[field])})
	for value: Variant in inv.get("loot_items", []):
		var item := Loot._validated_item(value)
		if not item.is_empty():
			item["count"] = 1
			entries.append(item)
	return entries

static func trade(inv: Dictionary, mode: String, id: String, quantity: int) -> Dictionary:
	var rejected := {"ok":false, "message":"Transação indisponível."}
	if quantity < 1 or quantity > (99 if mode == "buy" else LIMIT): return rejected
	var gold := int(inv.get("gold", 0))
	if gold < 0 or gold > LIMIT: return rejected
	if mode == "buy":
		if not OFFERS.has(id): return rejected
		var offer: Dictionary = OFFERS[id]
		var cost: int = offer.price * quantity
		if gold < cost: return {"ok":false, "message":"Ouro insuficiente para esta compra."}
		var current := int(inv.get(offer.field, 0))
		var amount: int = offer.count * quantity
		if current < 0 or current + amount > LIMIT: return {"ok":false, "message":"Limite de itens atingido."}
		inv.gold = gold - cost
		inv[offer.field] = current + amount
		return {"ok":true, "message":"Compra concluída: %s ×%d · -%d ouro." % [offer.name, quantity, cost]}
	if mode != "sell": return rejected
	for item: Dictionary in selling_entries(inv):
		if item.id != id: continue
		if quantity > item.count or (item.slot in Loot.SLOTS and quantity != 1): return rejected
		# Corrupt duplicate locations never allow selling an equipped unique item.
		if inv.get("equipped_loot", {}).values().any(func(worn: Dictionary) -> bool: return worn.id == id): return rejected
		var proceeds := sale_price(item) * quantity
		if gold + proceeds > LIMIT: return {"ok":false, "message":"Limite de ouro atingido."}
		if item.slot in ["potion", "fang"]:
			var field := "potions" if item.slot == "potion" else "fangs"
			inv[field] = int(inv[field]) - quantity
		else:
			for index in range(inv.loot_items.size() - 1, -1, -1):
				if inv.loot_items[index].id == id: inv.loot_items.remove_at(index)
		inv.gold = gold + proceeds
		return {"ok":true, "message":"Venda concluída: %s ×%d · +%d ouro." % [item.name, quantity, proceeds]}
	return rejected

static func sell_selected(inv: Dictionary, selection: Dictionary) -> Dictionary:
	if selection.is_empty(): return {"ok":false, "message":"Selecione os itens que deseja vender."}
	var working := inv.duplicate(true)
	var before := int(inv.get("gold", 0))
	for id: Variant in selection:
		if not id is String or not selection[id] is int:
			return {"ok":false, "message":"Seleção inválida. Nenhum item foi vendido."}
		var result := trade(working, "sell", id, selection[id])
		if not result.ok:
			return {"ok":false, "message":"A seleção mudou ou contém item indisponível. Nenhum item foi vendido."}
	inv.merge(working, true)
	return {"ok":true, "message":"%d itens/pilhas vendidos · +%d ouro." % [selection.size(), int(inv.gold) - before]}
