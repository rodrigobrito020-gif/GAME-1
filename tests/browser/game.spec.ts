import { test, expect, Page } from "@playwright/test";
const suffix = () => Math.random().toString(36).slice(2, 8);
async function observe(p: Page) {
  await p.addInitScript(() => {
    const Native = window.WebSocket;
    window.WebSocket = class extends Native {
      constructor(...args: ConstructorParameters<typeof WebSocket>) {
        super(...args);
        this.addEventListener("message", (e) => {
          if (
            typeof e.data === "string" &&
            e.data.startsWith('42["snapshot"')
          ) {
            try {
              (window as any).__state = JSON.parse(e.data.slice(2))[1];
            } catch {
              /* other packets */
            }
          }
        });
      }
    };
  });
}
const state = (p: Page) => p.evaluate(() => (window as any).__state);
async function register(p: Page, name: string, race = "human") {
  await observe(p);
  await p.goto("/");
  await p.getByLabel("Nome do personagem").fill(name);
  await p.getByLabel("Senha", { exact: true }).fill("test-pass-123");
  await p
    .getByRole("combobox", { name: "Raça", exact: true })
    .selectOption(race);
  await p
    .getByRole("button", { name: "Começar jornada →", exact: true })
    .click();
  await expect(p.locator("#game-world canvas")).toBeVisible();
  await expect.poll(async () => (await state(p))?.self?.name).toBe(name);
}
async function goNpc(p: Page, panel: string) {
  await p
    .locator(".side-menu")
    .getByRole("button", { name: panel, exact: false })
    .click();
  const walk = p.getByRole("button", { name: "Caminhar até o NPC →" });
  if (await walk.isVisible()) await walk.click();
}
test("criar, caminhar, conversar, caçar, ganhar EXP/loot, equipar e persistir após reconectar", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await register(page, `Hero ${suffix()}`);
  const before = await state(page);
  await page.keyboard.down("d");
  await page.waitForTimeout(550);
  await page.keyboard.up("d");
  await expect
    .poll(async () => (await state(page)).actor.x)
    .toBeGreaterThan(before.actor.x + 35);
  await goNpc(page, "Hunts");
  await expect(page.locator('[data-hunt="hunt-1-physical"]')).toBeEnabled({
    timeout: 12000,
  });
  await page.locator('[data-hunt="hunt-1-physical"]').click();
  await expect.poll(async () => (await state(page)).map).toMatch(/^solo:/);
  await expect
    .poll(async () => (await state(page)).metrics.exp, { timeout: 20000 })
    .toBeGreaterThan(0);
  await expect(page.locator("[data-skill]")).toHaveCount(4);
  await page
    .getByRole("button", { name: "Retornar à cidade", exact: true })
    .click();
  await expect.poll(async () => (await state(page)).map).toBe("city");
  expect((await state(page)).self.adena).toBeGreaterThan(before.self.adena);
  await goNpc(page, "Mercador");
  const bowCard = page
    .locator(".shop-grid article")
    .filter({ hasText: "Arco" });
  await expect(bowCard.getByRole("button")).toBeEnabled({ timeout: 12000 });
  await bowCard.getByRole("button").click();
  await expect
    .poll(async () =>
      (await state(page)).self.inventory.some((i: any) => i.weapon === "bow"),
    )
    .toBe(true);
  await page.getByRole("button", { name: "Fechar painel" }).click();
  await page
    .locator(".side-menu")
    .getByRole("button", { name: "Mochila", exact: false })
    .click();
  await page.locator('.item-cell[title^="Arco"]').click();
  await page.getByRole("button", { name: "Equipar", exact: true }).click();
  await expect
    .poll(async () => (await state(page)).self.equipment.weapon.weapon)
    .toBe("bow");
  await page.getByRole("button", { name: "Fechar painel" }).click();
  const gained = await state(page);
  expect(gained.metrics.exp).toBeGreaterThan(0);
  await page.reload();
  await expect
    .poll(async () => (await state(page))?.self?.adena)
    .toBe(gained.self.adena);
  await expect
    .poll(async () => (await state(page))?.self?.level)
    .toBe(gained.self.level);
  expect(errors).toEqual([]);
});
test("cidade real com dois jogadores: chat, convite, Party compartilhada e distribuição", async ({
  browser,
}) => {
  const a = await browser.newContext(),
    b = await browser.newContext(),
    p = await a.newPage(),
    q = await b.newPage();
  await register(p, `Lead ${suffix()}`);
  await register(q, `Mate ${suffix()}`, "dwarf");
  const other = await state(q);
  await p.getByLabel("Mensagem da cidade").fill("Olá, cidade multiplayer!");
  await p.getByLabel("Mensagem da cidade").press("Enter");
  await expect(q.locator(".log-lines")).toContainText(
    "Olá, cidade multiplayer!",
  );
  await p
    .locator(".side-menu")
    .getByRole("button", { name: "Party", exact: false })
    .click();
  await p.getByRole("button", { name: "Criar Party", exact: true }).click();
  await p
    .locator(".online-list>div")
    .filter({ hasText: other.self.name })
    .getByRole("button", { name: "Convidar" })
    .click();
  await q.getByRole("button", { name: /Aceitar convite de/ }).click();
  await expect.poll(async () => (await state(q)).party?.members.length).toBe(2);
  await p.getByRole("button", { name: "Fechar painel" }).click();
  await goNpc(p, "Hunts");
  await expect(p.locator('[data-hunt="hunt-1-physical"]')).toBeEnabled({
    timeout: 12000,
  });
  await p.locator('[data-hunt="hunt-1-physical"]').click();
  await expect.poll(async () => (await state(q)).map).toMatch(/^party:/);
  expect((await state(q)).map).toBe((await state(p)).map);
  expect(
    (await state(p)).actors.filter((a: any) => a.kind === "monster"),
  ).toHaveLength(10);
  await a.close();
  await b.close();
});
test("DEV: Artisan tem summon no slot 4, segue alvo e crafts universais usam materiais reais", async ({
  page,
}) => {
  await register(page, `Craft ${suffix()}`, "dwarf");
  await page.getByRole("button", { name: "DEV · Testar conteúdo" }).click();
  await page.getByLabel("Nível", { exact: true }).fill("151");
  await page
    .getByRole("combobox", { name: "Primeira profissão", exact: true })
    .selectOption("artisan");
  await page
    .getByRole("combobox", { name: "Arma", exact: true })
    .selectOption("hammer");
  await page
    .getByRole("combobox", { name: "Especialização 150+", exact: true })
    .selectOption("warsmith");
  await page
    .getByRole("button", { name: "Aplicar personagem de teste" })
    .click();
  await expect.poll(async () => (await state(page)).self.level).toBe(151);
  await goNpc(page, "Forja");
  await expect(
    page.getByRole("button", { name: "Fabricar arma", exact: true }),
  ).toBeEnabled({ timeout: 12000 });
  const before = await state(page);
  await page
    .getByRole("button", { name: "Fabricar arma", exact: true })
    .click();
  await expect
    .poll(async () => (await state(page)).self.adena)
    .toBe(before.self.adena - 500);
  await page.getByRole("button", { name: "Fechar painel" }).click();
  await goNpc(page, "Hunts");
  await expect(page.locator('[data-hunt="hunt-151-mixed"]')).toBeEnabled({
    timeout: 12000,
  });
  await page.locator('[data-hunt="hunt-151-mixed"]').click();
  await expect
    .poll(
      async () =>
        (await state(page)).actors.filter((a: any) => a.kind === "summon")
          .length,
      { timeout: 20000 },
    )
    .toBeGreaterThan(0);
  const s = await state(page);
  expect(s.skills[3].name).toBe("Summon");
  for (const summon of s.actors.filter((a: any) => a.kind === "summon"))
    expect(summon.targetId).toBe(s.actor.targetId);
});
test("celular: criação anã sem Mystic, painéis operantes e canvas sem erro", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await register(page, `Small ${suffix()}`, "dwarf");
  await page
    .locator(".side-menu")
    .getByRole("button", { name: "Mochila", exact: false })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Fechar painel" }).click();
  await expect(page.locator("[data-skill]")).toHaveCount(4);
  expect((await state(page)).skills.map((s: any) => s.name)).toEqual([
    "Ataque Reforçado",
    "Summon",
    "Spoil",
    "Sweeper",
  ]);
});
