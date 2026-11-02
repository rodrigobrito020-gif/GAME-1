(() => {
  const ui = window.__royalUiFrame;
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
    panelKind = null;
  const pending = new Map(),
    selection = new Map(),
    cells = new Map();
  const el = (tag, text, cls) => {
    const n = document.createElement(tag);
    if (text !== undefined) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  };
  const send = (kind, value) => window.__royalCombatSend?.(kind, value),
    id = (p) => `${p.kind}:${p.tier}`;
  function preference(p) {
    const next = pending.get(id(p));
    return next && performance.now() - next.at < 2000 ? { ...p, ...next } : p;
  }
  function selected(kind) {
    const next = selection.get(kind),
      tier =
        next && performance.now() - next.at < 2000
          ? next.tier
          : (state?.selectedPotionTiers?.[kind] ?? 1);
    const raw = state?.potions?.find((p) => p.kind === kind && p.tier === tier);
    return raw ? preference(raw) : null;
  }
  function choose(p) {
    if (!p.unlocked) return;
    selection.set(p.kind, { tier: p.tier, at: performance.now() });
    send("useSkill", {
      skillId: `potion-select:${p.kind}:${p.tier}`,
      target: 0,
    });
    paint();
    renderPanel();
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
  function close() {
    panelKind = null;
    panel.hidden = true;
  }
  function renderPanel() {
    const p = selected(panelKind);
    if (!p) return;
    panel.replaceChildren();
    const x = el("button", "×", "royal-close");
    x.type = "button";
    x.setAttribute("aria-label", "Fechar poção");
    x.onclick = close;
    const im = new Image();
    im.src = p.icon;
    im.alt = "";
    panel.append(
      x,
      im,
      el("h2", p.kind === 1 ? "Poção de HP" : "Poção de Mana"),
      el("p", "Escolha a poção que ficará na barra:"),
    );
    const types = el("div", undefined, "royal-potion-types");
    for (const raw of state.potions.filter((q) => q.kind === p.kind)) {
      const b = el("button", undefined, "royal-potion-option");
      b.type = "button";
      b.dataset.tier = String(raw.tier);
      b.disabled = !raw.unlocked;
      b.classList.toggle("selected", raw.tier === p.tier);
      b.setAttribute("aria-pressed", String(raw.tier === p.tier));
      b.setAttribute("aria-label", `${raw.name} · nível ${raw.minLevel}`);
      const icon = new Image();
      icon.src = raw.icon;
      icon.alt = "";
      b.append(
        icon,
        el("strong", ["Pequena", "Média", "Grande"][raw.tier - 1]),
        el(
          "small",
          raw.unlocked
            ? `${Math.round(raw.pct * 100)}% · ×${raw.stock}`
            : `Nível ${raw.minLevel}`,
        ),
      );
      b.onclick = () => choose(raw);
      types.append(b);
    }
    panel.append(
      types,
      el(
        "p",
        `${p.name}: recupera ${Math.round(p.pct * 100)}% de ${p.kind === 1 ? "HP" : "mana"}. Na bolsa: ${p.stock}.`,
      ),
    );
    const modes = el("div", undefined, "royal-choice-row");
    for (const [automatic, label] of [
      [false, "MANUAL"],
      [true, "AUTO"],
    ]) {
      const b = el("button", label);
      b.type = "button";
      b.classList.toggle("selected", p.automatic === automatic);
      b.setAttribute("aria-pressed", String(p.automatic === automatic));
      b.onclick = () => configure(p, automatic, p.threshold);
      modes.append(b);
    }
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
      modes,
      el("p", "Usar no AUTO quando estiver em:"),
      percentages,
      el(
        "p",
        "Somente a poção selecionada será usada no AUTO.",
        "royal-potion-hint",
      ),
    );
    const use = el("button", "Usar agora", "royal-potion-use");
    use.type = "button";
    use.onclick = () => send("useConsumable", { kind: p.kind, tier: p.tier });
    panel.append(use);
    const buy = el("div", undefined, "royal-choice-row");
    for (const qty of [1, 10]) {
      const b = el("button", `Comprar ${qty} · ${qty * p.price} ouro`);
      b.type = "button";
      b.disabled = state.inHunt;
      b.onclick = () =>
        send("buyConsumable", { kind: p.kind, tier: p.tier, qty });
      buy.append(b);
    }
    panel.append(buy);
    if (state.inHunt)
      panel.append(el("small", "Compre mais poções na cidade."));
    panel.hidden = false;
    updateUse();
    positionPanel();
  }
  function updateUse() {
    const p = selected(panelKind),
      b = panel.querySelector(".royal-potion-use");
    if (!p || !b) return;
    const cd = Math.max(
        0,
        (state.potionCooldownMs ?? 0) - (performance.now() - at),
      ),
      full =
        p.kind === 1 ? state.hp >= state.maxHp : state.mana >= state.maxMana;
    b.disabled = !p.stock || !state.alive || cd > 0 || full;
    b.textContent =
      cd > 0
        ? `Aguarde ${(cd / 1000).toFixed(1)}s`
        : full
          ? "Já está completo"
          : "Usar agora";
  }
  function positionPanel() {
    if (panel.hidden) return;
    const box = dock.getBoundingClientRect();
    panel.style.left =
      Math.max(
        8,
        Math.min(
          innerWidth - panel.offsetWidth - 8,
          box.right - panel.offsetWidth,
        ),
      ) + "px";
    panel.style.bottom = Math.max(12, innerHeight - box.top + 30) + "px";
  }
  function measureDock() {
    const bar = document.querySelector(".slHudSkills");
    const box = bar?.checkVisibility() ? bar.getBoundingClientRect() : null;
    const panelBox = !panel.hidden
      ? { dock: dock.getBoundingClientRect(), width: panel.offsetWidth }
      : null;
    return { bar, box, panelBox };
  }
  function positionDock(measured) {
    const { bar, box, panelBox } = measured;
    if (box?.width > 0) {
      const changed = bar.style.marginLeft !== "-60px";
      ui.style(bar, "marginLeft", "-60px");
      ui.style(dock, "left", box.right + 10 + "px");
      ui.style(dock, "top", box.top + "px");
      ui.style(dock, "bottom", "auto");
      ui.attr(dock, "data-anchor", "skills");
      if (changed) paint();
    } else {
      ui.style(dock, "left", Math.max(8, innerWidth / 2 - 58) + "px");
      ui.style(dock, "top", "auto");
      ui.style(dock, "bottom", "18px");
      ui.attr(dock, "data-anchor", "city");
    }
    if (panelBox) {
      ui.style(
        panel,
        "left",
        Math.max(
          8,
          Math.min(
            innerWidth - panelBox.width - 8,
            panelBox.dock.right - panelBox.width,
          ),
        ) + "px",
      );
      ui.style(
        panel,
        "bottom",
        Math.max(12, innerHeight - panelBox.dock.top + 30) + "px",
      );
    }
  }
  function paint() {
    ui.schedule("potion-controls", measureDock, paintMeasured);
  }
  function paintMeasured(measured) {
    dock.hidden = !state?.alive;
    if (!state) return;
    for (const kind of [1, 2]) {
      const p = selected(kind);
      if (!p) continue;
      let cell = cells.get(kind);
      if (!cell) {
        cell = el("div", undefined, "royal-potion-cell");
        cell.dataset.kind = String(kind);
        const mode = el("button", undefined, "royal-potion-mode");
        mode.type = "button";
        mode.onclick = () => {
          const current = selected(kind);
          configure(current, !current.automatic, current.threshold);
        };
        const button = el("button", undefined, "royal-potion-slot");
        button.type = "button";
        const im = new Image();
        im.alt = "";
        button.append(
          im,
          el("span", undefined, "royal-potion-stock"),
          el("small", kind === 1 ? "Z" : "X", "royal-potion-key"),
          el("b", "▾", "royal-potion-menu"),
        );
        button.onclick = () => {
          panelKind = kind;
          renderPanel();
        };
        cell.append(mode, button);
        dock.append(cell);
        cells.set(kind, cell);
      }
      const mode = cell.querySelector(".royal-potion-mode"),
        button = cell.querySelector(".royal-potion-slot"),
        im = button.querySelector("img");
      ui.attr(button, "data-potion", id(p));
      ui.attr(button, "aria-label", p.name);
      ui.attr(button, "title", `${p.name} · escolher tipo e limite`);
      if (im.getAttribute("src") !== p.icon) im.src = p.icon;
      ui.text(button.querySelector(".royal-potion-stock"), `×${p.stock}`);
      ui.text(mode, p.automatic ? `AUTO ${p.threshold}%` : "MANUAL");
      ui.attr(mode, "data-automatic", p.automatic);
      ui.attr(mode, "aria-pressed", p.automatic);
      mode.setAttribute(
        "aria-label",
        `Poção ${kind === 1 ? "HP" : "Mana"}: ${p.automatic ? "automática" : "manual"}. Alterar modo`,
      );
      const cd = Math.max(
        0,
        (state.potionCooldownMs ?? 0) - (performance.now() - at),
      );
      button.style.setProperty(
        "--potion-cooldown",
        `${Math.min(100, (cd / 1500) * 100)}%`,
      );
    }
    positionDock(measured);
    updateUse();
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
    for (const [kind, p] of selection)
      if (state.selectedPotionTiers?.[kind] === p.tier) selection.delete(kind);
    paint();
    if (
      panelKind &&
      JSON.stringify(previous?.potions) !== JSON.stringify(state.potions)
    )
      renderPanel();
  });
  window.addEventListener(
    "keydown",
    (e) => {
      if (e.code === "Escape") {
        close();
        return;
      }
      if (
        !["KeyZ", "KeyX"].includes(e.code) ||
        e.repeat ||
        !state?.alive ||
        document.activeElement?.matches(
          'input,textarea,select,[contenteditable="true"]',
        ) ||
        [...document.querySelectorAll('[role="dialog"]')].some((d) =>
          d.checkVisibility(),
        )
      )
        return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const p = selected(e.code === "KeyZ" ? 1 : 2);
      if (p) send("useConsumable", { kind: p.kind, tier: p.tier });
    },
    true,
  );
  window.addEventListener("royal-skill-scene-reset", close);
  window.addEventListener("resize", paint);
  setInterval(paint, 100);
})();
