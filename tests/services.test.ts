import { describe, it, expect } from "vitest";
import { BALANCE, HUNTS, newCharacter, makeEquipment } from "@idle/shared";
import { GameEngine } from "../apps/server/src/engine";
function fixture() {
  const engine = new GameEngine();
  const player = engine.connect(
    newCharacter("services", "Services", "human", "fighter"),
  );
  const approach = (id: string) => {
    const npc = engine.city.npcs.find((npc) => npc.id === id)!;
    player.actor.x = npc.x - 32;
    player.actor.y = npc.y + 38;
  };
  return { engine, player, approach };
}
describe("serviços reais da cidade", () => {
  it("transfere pilhas sem duplicação, mantém equipamento vestido e persiste após reconectar", () => {
    const { engine, player, approach } = fixture();
    approach("storage");
    const stock = player.c.inventory.find((item) => item.potion === "hp")!;
    engine.command(player.c.id, { type: "storage.deposit", id: stock.id });
    expect(player.c.inventory.some((item) => item.id === stock.id)).toBe(false);
    expect(player.c.storage).toEqual([stock]);
    expect(() =>
      engine.command(player.c.id, { type: "storage.deposit", id: stock.id }),
    ).toThrow(/não encontrado/);
    const captured = engine.capture(player);
    engine.disconnect(player.c.id);
    const restored = engine.connect(captured);
    expect(restored.c.storage[0].quantity).toBe(10);
    const npc = engine.city.npcs.find((npc) => npc.id === "storage")!;
    restored.actor.x = npc.x;
    restored.actor.y = npc.y;
    engine.command(restored.c.id, { type: "storage.withdraw", id: stock.id });
    expect(restored.c.storage).toHaveLength(0);
    expect(
      restored.c.inventory.find((item) => item.id === stock.id)?.quantity,
    ).toBe(10);
    expect(() =>
      engine.command(restored.c.id, {
        type: "storage.deposit",
        id: restored.c.equipment.weapon!.id,
      }),
    ).toThrow(/não encontrado/);
    expect(restored.c.equipment.weapon).toBeDefined();
  });
  it("empilha consumíveis iguais mesmo com a coleção cheia e recusa itens novos sem perder nada", () => {
    const { engine, player, approach } = fixture();
    approach("storage");
    player.c.storage = Array.from({ length: BALANCE.storageLimit }, (_, n) =>
      makeEquipment(`storage-${n}`, "NG", "helmet"),
    );
    const item = player.c.inventory[0];
    expect(() =>
      engine.command(player.c.id, { type: "storage.deposit", id: item.id }),
    ).toThrow(/cheio/);
    expect(player.c.inventory).toContain(item);
    player.c.storage[0] = { ...item, id: "old-stock", quantity: 7 };
    engine.command(player.c.id, { type: "storage.deposit", id: item.id });
    expect(player.c.storage[0].quantity).toBe(17);
    expect(player.c.storage).toHaveLength(BALANCE.storageLimit);
    player.c.inventory = Array.from(
      { length: BALANCE.inventoryLimit },
      (_, n) => makeEquipment(`bag-${n}`, "NG", "helmet"),
    );
    expect(() =>
      engine.command(player.c.id, {
        type: "storage.withdraw",
        id: "old-stock",
      }),
    ).toThrow(/Mochila cheia/);
    expect(player.c.storage[0].quantity).toBe(17);
  });
  it("recusa acesso distante e dentro de hunts; curandeira restaura sem dar itens ou adena", () => {
    const { engine, player, approach } = fixture();
    expect(() =>
      engine.command(player.c.id, {
        type: "storage.deposit",
        id: player.c.inventory[0].id,
      }),
    ).toThrow(/Aproxime/);
    approach("healer");
    player.actor.hp = 12;
    player.c.mp = 0;
    const before = engine.capture(player);
    engine.command(player.c.id, { type: "heal.city" });
    expect(player.actor.hp).toBe(player.actor.maxHp);
    expect(player.c.mp).toBeGreaterThan(0);
    expect(player.c.adena).toBe(before.adena);
    expect(player.c.inventory).toEqual(before.inventory);
    approach("portal");
    engine.command(player.c.id, { type: "enter", hunt: HUNTS[0].id });
    expect(() => engine.command(player.c.id, { type: "heal.city" })).toThrow(
      /cidade/,
    );
    expect(() =>
      engine.command(player.c.id, { type: "storage.withdraw", id: "anything" }),
    ).toThrow(/cidade/);
  });
  it("abre saves antigos sem armazém e preserva os itens existentes", () => {
    const engine = new GameEngine(),
      character = newCharacter("old", "Old Save", "human", "fighter");
    const items = structuredClone(character.inventory);
    delete (character as Partial<typeof character>).storage;
    const player = engine.connect(character);
    expect(player.c.storage).toEqual([]);
    expect(player.c.inventory).toEqual(items);
  });
});
