extends RefCounted
## Original client equipment icons shared by inventory, paper doll and rewards.
const Catalog := preload("res://scripts/equipment_catalog.gd")
const Client := preload("res://scripts/client_item_icons.gd")
const BackgroundMasks := preload("res://scripts/icon_background_masks.gd")
const RARITY_COLORS := {
	"Comum": Color("b1b4b9"), "Incomum": Color("71bb72"),
	"Raro": Color("60a7df"), "Épico": Color("ba84df"),
	"Lendário": Color("f0b84f"),
}
static var _display_cache: Dictionary = {}
const FALLBACK := {
	"potion": preload("res://assets/icons/potion.svg"),
	"fang": preload("res://assets/icons/fang.svg"),
}
static func for_item(item: Dictionary, class_id: String = "tanque") -> Texture2D:
	var slot := str(item.get("slot", "armor"))
	if slot in Catalog.CLOTHING_SLOTS:
		var grade: String = {"Incomum":"D","Raro":"C","Épico":"B","Lendário":"A"}.get(str(item.get("rarity", "Comum")), "No Grade")
		var key: String = item.get("lineage_key", Catalog.key_for(class_id, grade, slot))
		var entry: Dictionary = Catalog.get_entry(key)
		if entry.is_empty():
			entry = Catalog.get_entry(Catalog.key_for(class_id, "No Grade", slot))
		return Client.ICONS[entry.icon_ref]
	if slot == "sword":
		slot = str(item.get("weapon_type", "bow" if class_id == "arqueiro" else "rod" if class_id in ["mago", "healer"] else "sword"))
	if Client.WEAPONS.has(slot):
		return Client.ICONS[Client.WEAPONS[slot]]
	return FALLBACK.get(slot, FALLBACK.potion)

static func for_display(item: Dictionary, class_id: String = "tanque") -> Texture2D:
	var original := for_item(item, class_id)
	var ref := "icon." + original.resource_path.get_file().get_basename()
	if not BackgroundMasks.ROWS.has(ref):
		return original
	var rarity := str(item.get("rarity", "Comum"))
	if not RARITY_COLORS.has(rarity):
		rarity = "Comum"
	var cache_key := ref + ":" + rarity
	if _display_cache.has(cache_key):
		return _display_cache[cache_key]
	# Only the baked background is replaced. Equipment pixels and the original
	# imported resource remain unchanged; cache display variants once per rarity.
	var image := original.get_image().duplicate() as Image
	image.convert(Image.FORMAT_RGBA8)
	var rows: Array = BackgroundMasks.ROWS[ref]
	for y in image.get_height():
		for x in image.get_width():
			if rows[y] & (1 << x):
				var background := background_color(rarity)
				background.a = 1.0
				image.set_pixel(x, y, background)
	var texture := ImageTexture.create_from_image(image)
	texture.set_meta("client_icon_path", original.resource_path)
	texture.set_meta("rarity", rarity)
	_display_cache[cache_key] = texture
	return texture

static func background_color(rarity: String) -> Color:
	var tint: Color = RARITY_COLORS.get(rarity, RARITY_COLORS.Comum)
	var result := tint * 0.28
	result.a = 1.0
	return result
