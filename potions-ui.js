(() => {
  const dock = document.createElement("section");
  dock.className = "royal-potion-dock";
  dock.hidden = true;
  dock.setAttribute("aria-label", "Poções de HP e mana");
  document.body.append(dock);
  const panel = document.createElement("aside");
  panel.className = "royal-potion-panel";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Configurar poção");
  document.body.append(panel);
  let state = null,
    at = 0,
    selected = null;
  const pending = new Map(),
    slots = new Map();
  const el = (tag, text, cls) => {
    const n = document.createElement(tag);
    if (text !== undefined) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  };
  const send = (kind, value) => window.__royalCombatSend?.(kind, value);
  const id = (p) => `${p.kind}:${p.tier}`;
  function preference(p) {
    const next = pending.get(id(p));
    if (next && performance.now() - next.at < 2000) return { ...p, ...next };
    return p;
  }
  function configure(p, automatic, threshold) {
    pending.set(id(p), { automatic, threshold, at: performance.now() });
    send("useSkill", {
      skillId: `potion-config:${p.kind}:${p.tier}:${automatic ? "auto" : "manual"}:${threshold}`,
      target: 0,
    });
    paint();
    renderPanel();
  }
  function renderPanel() {
    if (!selected || !state) return;
    const raw = state.potions.find((p) => id(p) === selected);
    if (!raw) return;
    const p = preference(raw);
    panel.replaceChildren();
    const close = el("button", "×", "royal-close");
    close.type = "button";
    close.setAttribute("aria-label", "Fechar poção");
    close.onclick = () => {
      selected = null;
      panel.hidden = true;
    };
    const image = new Image();
    image.src = p.icon;
    image.alt = "";
    panel.append(
      close,
      image,
      el("small", `LIBERA NO NÍVEL ${p.minLevel}`),
      el("h2", p.name),
      el(
        "p",
        `Recupera ${Math.round(p.pct * 100)}% de ${p.kind === 1 ? "HP" : "mana"}. Na bolsa: ${p.stock}.`,
      ),
    );
    const modes = el("div", undefined, "royal-choice-row");
    for (const [mode, label] of [
      [false, "MANUAL"],
      [true, "AUTO"],
    ]) {
      const b = el("button", label);
      b.type = "button";
      b.disabled = mode && !p.unlocked;
      b.classList.toggle("selected", p.automatic === mode);
      b.setAttribute("aria-pressed", String(p.automatic === mode));
      b.onclick = () => configure(p, mode, p.threshold);
      modes.append(b);
    }
    panel.append(
      modes,
      el("p", "Usar automaticamente quando estiver em:", "royal-potion-label"),
    );
    const percentages = el("div", undefined, "royal-choice-row");
    for (const threshold of [30, 50, 70]) {
      const b = el("button", `${threshold}%`);
      b.type = "button";
      b.setAttribute("aria-label", `Limite de ${threshold}%`);
      b.classList.toggle("selected", p.threshold === threshold);
      b.setAttribute("aria-pressed", String(p.threshold === threshold));
      b.onclick = () => configure(p, p.automatic, threshold);
      percentages.append(b);
    }
    panel.append(
      percentages,
      el(
        "p",
        "O limite vale para o AUTO. No manual, você escolhe quando usar.",
        "royal-potion-hint",
      ),
    );
    const use = el(
      "button",
      p.unlocked ? "Usar agora" : `Libera no nível ${p.minLevel}`,
      "royal-potion-use",
    );
    use.type = "button";
    use.disabled = !p.unlocked || !p.stock || !state.alive;
    use.onclick = () => send("useConsumable", { kind: p.kind, tier: p.tier });
    panel.append(use);
    const buy = el("div", undefined, "royal-choice-row");
    for (const qty of [1, 10]) {
      const b = el("button", `Comprar ${qty} · ${qty * p.price} ouro`);
      b.type = "button";
      b.disabled = !p.unlocked || state.inHunt;
      b.onclick = () =>
        send("buyConsumable", { kind: p.kind, tier: p.tier, qty });
      buy.append(b);
    }
    panel.append(buy);
    if (state.inHunt)
      panel.append(el("small", "Compre mais poções na cidade."));
    panel.hidden = false;
  }
  function paint() {
    dock.hidden = !state?.alive;
    if (!state) return;
    for (const raw of state.potions ?? []) {
      const p = preference(raw);
      let button = slots.get(id(p));
      if (!button) {
        button = el("button", undefined, "royal-potion-slot");
        button.type = "button";
        button.dataset.potion = id(p);
        const im = new Image();
        im.alt = "";
        button.append(
          im,
          el("span", undefined, "royal-potion-stock"),
          el("small", undefined, "royal-potion-mode"),
          el("b", undefined, "royal-potion-lock"),
        );
        button.onclick = () => {
          selected = id(p);
          renderPanel();
        };
        dock.append(button);
        slots.set(id(p), button);
      }
      button.setAttribute("aria-label", p.name);
      const icon = button.querySelector("img");
      if (icon.getAttribute("src") !== p.icon) icon.src = p.icon;
      button.querySelector(".royal-potion-stock").textContent = `×${p.stock}`;
      button.querySelector(".royal-potion-mode").textContent = p.automatic
        ? `AUTO ${p.threshold}%`
        : "MANUAL";
      button.dataset.automatic = String(p.automatic);
      button.classList.toggle("locked", !p.unlocked);
      button.querySelector(".royal-potion-lock").textContent = p.unlocked
        ? ""
        : `Nv. ${p.minLevel}`;
    }
    if (!panel.hidden) {
      const b = panel.querySelector(".royal-potion-use"),
        p = state.potions.find((p) => id(p) === selected);
      if (b && p) {
        const cd = Math.max(
            0,
            (state.potionCooldownMs ?? 0) - (performance.now() - at),
          ),
          full =
            p.kind === 1
              ? state.hp >= state.maxHp
              : state.mana >= state.maxMana;
        b.disabled = !p.unlocked || !p.stock || !state.alive || cd > 0 || full;
        b.textContent = !p.unlocked
          ? `Libera no nível ${p.minLevel}`
          : cd > 0
            ? `Aguarde ${(cd / 1000).toFixed(1)}s`
            : full
              ? "Já está completo"
              : "Usar agora";
      }
    }
  }
  window.addEventListener("royal-ultimate-state", (e) => {
    const previous = state;
    state = e.detail;
    at = performance.now();
    for (const p of state.potions ?? []) {
      const q = pending.get(id(p));
      if (q && q.automatic === p.automatic && q.threshold === p.threshold)
        pending.delete(id(p));
    }
    paint();
    if (
      selected &&
      JSON.stringify(previous?.potions) !== JSON.stringify(state.potions)
    )
      renderPanel();
  });
  window.addEventListener("keydown", (e) => {
    if (e.code === "Escape") {
      selected = null;
      panel.hidden = true;
    }
  });
  window.addEventListener("royal-skill-scene-reset", () => {
    selected = null;
    panel.hidden = true;
  });
  setInterval(paint, 100);
})();
