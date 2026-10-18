extends RefCounted
## Native client jewelry; bonuses are prototype balance values.
const ITEMS := {
  "ring_0": {
    "kind": "ring",
    "grade": "No Grade",
    "name": "Ring of Knowledge",
    "client_item_id": 875,
    "icon_ref": "icon.accessary_ring_of_knowledge_i00",
    "magic_defense_bonus": 2,
    "hp_bonus": 4
  },
  "ring_1": {
    "kind": "ring",
    "grade": "D",
    "name": "Elven Ring",
    "client_item_id": 881,
    "icon_ref": "icon.accessary_elven_ring_i00",
    "magic_defense_bonus": 4,
    "hp_bonus": 6
  },
  "ring_2": {
    "kind": "ring",
    "grade": "C",
    "name": "Ring of Protection",
    "client_item_id": 884,
    "icon_ref": "icon.accessary_ring_of_protection_i00",
    "magic_defense_bonus": 8,
    "hp_bonus": 10
  },
  "ring_3": {
    "kind": "ring",
    "grade": "B",
    "name": "Ring of Black Ore",
    "client_item_id": 895,
    "icon_ref": "icon.accessary_ring_of_black_ore_i00",
    "magic_defense_bonus": 12,
    "hp_bonus": 14
  },
  "ring_4": {
    "kind": "ring",
    "grade": "A",
    "name": "Majestic Ring",
    "client_item_id": 893,
    "icon_ref": "icon.accessary_inferno_ring_i00",
    "magic_defense_bonus": 18,
    "hp_bonus": 20
  },
  "earring_0": {
    "kind": "earring",
    "grade": "No Grade",
    "name": "Cat's Eye Earring",
    "client_item_id": 845,
    "icon_ref": "icon.accessary_catseye_earing_i00",
    "magic_defense_bonus": 3,
    "hp_bonus": 4
  },
  "earring_1": {
    "kind": "earring",
    "grade": "D",
    "name": "Elven Earring",
    "client_item_id": 850,
    "icon_ref": "icon.accessary_elven_earing_i00",
    "magic_defense_bonus": 5,
    "hp_bonus": 7
  },
  "earring_2": {
    "kind": "earring",
    "grade": "C",
    "name": "Earring of Protection",
    "client_item_id": 853,
    "icon_ref": "icon.accessary_earing_of_protection_i00",
    "magic_defense_bonus": 10,
    "hp_bonus": 11
  },
  "earring_3": {
    "kind": "earring",
    "grade": "B",
    "name": "Earring of Black Ore",
    "client_item_id": 864,
    "icon_ref": "icon.accessary_earing_of_black_ore_i00",
    "magic_defense_bonus": 16,
    "hp_bonus": 15
  },
  "earring_4": {
    "kind": "earring",
    "grade": "A",
    "name": "Majestic Earring",
    "client_item_id": 862,
    "icon_ref": "icon.accessary_inferno_earing_i00",
    "magic_defense_bonus": 23,
    "hp_bonus": 22
  },
  "necklace_0": {
    "kind": "necklace",
    "grade": "No Grade",
    "name": "Necklace of Knowledge",
    "client_item_id": 906,
    "icon_ref": "icon.accessary_necklace_of_knowledge_i00",
    "magic_defense_bonus": 4,
    "hp_bonus": 6
  },
  "necklace_1": {
    "kind": "necklace",
    "grade": "D",
    "name": "Elven Necklace",
    "client_item_id": 913,
    "icon_ref": "icon.accessary_elven_necklace_i00",
    "magic_defense_bonus": 7,
    "hp_bonus": 9
  },
  "necklace_2": {
    "kind": "necklace",
    "grade": "C",
    "name": "Necklace of Protection",
    "client_item_id": 916,
    "icon_ref": "icon.accessary_necklace_of_protection_i00",
    "magic_defense_bonus": 14,
    "hp_bonus": 15
  },
  "necklace_3": {
    "kind": "necklace",
    "grade": "B",
    "name": "Necklace of Black Ore",
    "client_item_id": 926,
    "icon_ref": "icon.accessary_necklace_of_black_ore_i00",
    "magic_defense_bonus": 22,
    "hp_bonus": 21
  },
  "necklace_4": {
    "kind": "necklace",
    "grade": "A",
    "name": "Majestic Necklace",
    "client_item_id": 924,
    "icon_ref": "icon.accessary_inferno_necklace_i00",
    "magic_defense_bonus": 32,
    "hp_bonus": 30
  }
}

static func kind_for_slot(slot: String) -> String:
	return "ring" if slot.begins_with("ring") else "earring" if slot.begins_with("earring") else "necklace" if slot == "necklace" else ""

static func key_for(slot: String, rarity: String) -> String:
	return "%s_%d" % [kind_for_slot(slot), maxi(0, ["Comum","Incomum","Raro","Épico","Lendário"].find(rarity))]
