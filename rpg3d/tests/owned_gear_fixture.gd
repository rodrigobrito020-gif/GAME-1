extends RefCounted
## Explicit test equipment. Class selection itself must never grant weapons.
static func equip_weapon(game, class_id: String) -> void:
	var kind: String = game.LootItems.weapon_type_for_class(class_id)
	var item := {"id":"fixture-weapon-" + class_id, "slot":"sword", "name":game.LootItems.weapon_name(kind), "weapon_type":kind, "rarity":"Comum", "attack_bonus":0, "defense_bonus":0}
	if game.LootItems.equipped_item(game.inventory, "sword").get("id", "") == item.id:
		return
	game.inventory.loot_items = game.inventory.loot_items.filter(func(value: Dictionary) -> bool: return value.id != item.id)
	game.inventory.loot_items.append(item)
	assert(game._use_item("loot_equip:" + item.id))
