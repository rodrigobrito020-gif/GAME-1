extends SceneTree
const Icons := preload("res://scripts/item_icons.gd")
const Client := preload("res://scripts/client_item_icons.gd")
const Catalog := preload("res://scripts/equipment_catalog.gd")
const Masks := preload("res://scripts/icon_background_masks.gd")
var failures := 0

func check(ok: bool, message: String) -> void:
	if not ok:
		failures += 1
		push_error(message)
	else:
		print("PASS: " + message)

func _initialize() -> void:
	var specimens := {}
	for key: String in Catalog.entries:
		var entry: Dictionary = Catalog.entries[key]
		specimens[entry.icon_ref] = {"item":{"slot":entry.slot, "lineage_key":key}, "class_id":"tanque"}
	for slot: String in Client.WEAPONS:
		specimens[Client.WEAPONS[slot]] = {"item":{"slot":"shield" if slot == "shield" else "sword"}, "class_id":"arqueiro" if slot == "bow" else "mago" if slot == "rod" else "tanque"}
	for key: String in Icons.Jewelry.ITEMS:
		var entry: Dictionary = Icons.Jewelry.ITEMS[key]
		specimens[entry.icon_ref] = {"item":{"slot": {"ring":"ring1", "earring":"earring1", "necklace":"necklace"}[entry.kind], "jewelry_key":key}, "class_id":"tanque"}
	for ref: String in specimens:
		var specimen: Dictionary = specimens[ref]
		var original: Image = Client.ICONS[ref].get_image()
		var original_bytes := original.get_data().duplicate()
		var preserved := true
		var backgrounds := []
		var background_count := 0
		var object_count := 0
		for rarity: String in ["Comum", "Incomum", "Raro", "Épico", "Lendário"]:
			specimen.item.rarity = rarity
			var texture := Icons.for_display(specimen.item, specimen.class_id)
			check(texture == Icons.for_display(specimen.item, specimen.class_id), "display textures are reused rather than recreated on every UI refresh: " + ref + " " + rarity)
			var rendered := texture.get_image()
			var background_pixel := Color.TRANSPARENT
			for y in 32:
				for x in 32:
					if Masks.ROWS[ref][y] & (1 << x):
						background_pixel = rendered.get_pixel(x, y)
						background_count += 1
					else:
						object_count += 1
						preserved = preserved and rendered.get_pixel(x, y).is_equal_approx(original.get_pixel(x, y))
			backgrounds.append(background_pixel)
			check(texture.get_meta("client_icon_path") == Client.ICONS[ref].resource_path and texture.get_meta("rarity") == rarity, "display variant retains source identity and item rarity: " + ref + " " + rarity)
		check(preserved and original.get_data() == original_bytes, "equipment colors and original image remain untouched: " + ref)
		# The native elemental fire pendant fills almost its entire 32px tile;
		# its illustration must not be erased just to reach a padding quota.
		var minimum_background := 250 if ref == "icon.elemental_necklace_fire_i00" else 500
		check(background_count > minimum_background and object_count > 250, "background replacement retains an equipment silhouette: " + ref)
		check(backgrounds[0] != backgrounds[1] and backgrounds[1] != backgrounds[2] and backgrounds[2] != backgrounds[3] and backgrounds[3] != backgrounds[4], "all five rarities have different backgrounds: " + ref)
	var common := Icons.for_display({"slot":"armor", "rarity":"Comum"}).get_image().get_pixel(31, 0)
	var green := Icons.for_display({"slot":"armor", "rarity":"Incomum"}).get_image().get_pixel(31, 0)
	var blue := Icons.for_display({"slot":"armor", "rarity":"Raro"}).get_image().get_pixel(31, 0)
	var purple := Icons.for_display({"slot":"armor", "rarity":"Épico"}).get_image().get_pixel(31, 0)
	var gold := Icons.for_display({"slot":"armor", "rarity":"Lendário"}).get_image().get_pixel(31, 0)
	check(absf(common.r - common.b) < 0.03 and green.g > green.r * 1.3 and blue.b > blue.r * 1.3 and purple.b > purple.g * 1.3 and purple.r > purple.g * 1.2 and gold.r > gold.g and gold.g > gold.b * 1.5, "background palette is gray, green, blue, purple and gold in rarity order")
	check(Icons.for_display({"slot":"potion"}) == Icons.for_item({"slot":"potion"}), "transparent potion artwork is preserved")
	check(Icons.for_display({"slot":"armor", "rarity":"Inicial"}) == Icons.for_display({"slot":"armor", "rarity":"Comum"}), "starter equipment uses the common gray background")
	print("RARITY ICON BACKGROUNDS COMPLETE: %d failures" % failures)
	quit(0 if failures == 0 else 1)
