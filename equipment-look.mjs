import { WARRIOR_SKIN } from "./warrior.mjs";
export const TRAINING_ARMOR_LOOK = "humano-guerreiro-peitoral-treino";
export function equipmentSkin(character) {
  const base = character.identity.skinId;
  if (base !== WARRIOR_SKIN || character.identity.classId !== "guerreiro")
    return base;
  return character.equipment.slots.some(
    (e) => e.slot === 4 && e.item.defId === "peitoral-local",
  )
    ? TRAINING_ARMOR_LOOK
    : base;
}
export function equipmentIdentity(character) {
  return { ...character.identity, skinId: equipmentSkin(character) };
}
