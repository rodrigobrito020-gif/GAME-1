(() => {
  const panel = document.createElement("section");
  panel.className = "royal-combat-control";
  panel.hidden = true;
  panel.innerHTML =
    '<button type="button" class="royal-mode-toggle"></button><div class="royal-mode-help"></div><span class="royal-evade-status"></span>';
  document.body.append(panel);
  const card = document.createElement("aside");
  card.className = "royal-skill-card";
  card.hidden = true;
  card.setAttribute("role", "tooltip");
  card.id = "royal-skill-card";
  document.body.append(card);
  let state = null,
    stateAt = 0,
    currentButton = null,
    hold = null;
  const send = (skillId) =>
    window.__royalCombatSend?.("useSkill", { skillId, target: 0 });
  const skills = () => window.__royalCombatCatalog?.() ?? [];
  function find(button) {
    return skills().find((s) => s.name === button?.getAttribute("aria-label"));
  }
  const time = (ms) => (ms >= 60000 ? `${ms / 60000} min` : `${ms / 1000}s`);
  const text = (tag, value) => {
    const n = document.createElement(tag);
    n.textContent = value;
    return n;
  };
  function show(button) {
    const s = find(button);
    if (!s) return;
    currentButton = button;
    card.replaceChildren();
    const image = new Image();
    image.src = s.icon;
    image.alt = "";
    card.append(
      image,
      text(
        "small",
        s.id === "avatar-da-luz"
          ? "ULTIMATE · GUERREIRO HUMANO"
          : "GUERREIRO HUMANO",
      ),
      text("h2", s.name),
      text("p", s.description),
    );
    const stats = document.createElement("dl");
    for (const [label, value] of [
      ["Atalho", s.key],
      ["Custo", s.id === "avatar-da-luz" ? "100 energia" : `${s.manaCost} MP`],
      ["Recarga", time(s.cooldownMs)],
      ...(s.durationMs ? [["Duração", time(s.durationMs)]] : []),
    ]) {
      stats.append(text("dt", label), text("dd", value));
    }
    card.append(
      stats,
      text("footer", "Clique para usar · mantenha pressionado para consultar"),
    );
    card.hidden = false;
    button.setAttribute("aria-describedby", card.id);
    const box = button.getBoundingClientRect(),
      width = Math.min(300, innerWidth - 24);
    card.style.width = width + "px";
    card.style.left =
      Math.min(
        innerWidth - width - 12,
        Math.max(12, box.left + box.width / 2 - width / 2),
      ) + "px";
    card.style.top = Math.max(12, box.top - card.offsetHeight - 15) + "px";
  }
  function hide() {
    card.hidden = true;
    currentButton?.removeAttribute("aria-describedby");
    currentButton = null;
  }
  const buttonOf = (e) => e.target.closest?.(".slHudSkill:not(.slHudRoll)");
  document.addEventListener(
    "pointerover",
    (e) => {
      const b = buttonOf(e);
      if (b) show(b);
    },
    true,
  );
  document.addEventListener(
    "pointerout",
    (e) => {
      const b = buttonOf(e);
      if (b && !b.contains(e.relatedTarget)) hide();
    },
    true,
  );
  document.addEventListener(
    "focusin",
    (e) => {
      const b = buttonOf(e);
      if (b) show(b);
    },
    true,
  );
  document.addEventListener("focusout", hide);
  document.addEventListener(
    "pointerdown",
    (e) => {
      const b = buttonOf(e);
      if (!b || e.button !== 0) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      hold = {
        button: b,
        start: performance.now(),
        x: e.clientX,
        y: e.clientY,
      };
      hold.timer = setTimeout(() => show(b), 350);
    },
    true,
  );
  document.addEventListener(
    "pointerup",
    (e) => {
      if (!hold) return;
      const h = hold;
      hold = null;
      clearTimeout(h.timer);
      e.preventDefault();
      e.stopImmediatePropagation();
      if (performance.now() - h.start >= 350) {
        show(h.button);
        return;
      }
      if (Math.hypot(e.clientX - h.x, e.clientY - h.y) > 12) return;
      const s = find(h.button);
      if (s?.id === "avatar-da-luz") window.__royalRequestAvatar?.();
      else if (s) send(s.id);
    },
    true,
  );
  document.addEventListener("pointercancel", () => {
    if (hold) clearTimeout(hold.timer);
    hold = null;
    hide();
  });
  panel.querySelector("button").onclick = () =>
    send(state?.combatMode === "manual" ? "modo-auto" : "modo-manual");
  const keys = new Set();
  const typing = () =>
    document.activeElement?.matches(
      'input,textarea,select,[contenteditable="true"]',
    ) ||
    [...document.querySelectorAll('[role="dialog"]')].some((d) =>
      d.checkVisibility(),
    );
  window.addEventListener(
    "keydown",
    (e) => {
      if (typing() || e.ctrlKey || e.metaKey || e.altKey) return;
      keys.add(e.code);
      if (e.code === "ShiftLeft" && !e.repeat) {
        e.preventDefault();
        let x =
            (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
            (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0),
          y =
            (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) -
            (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0);
        window.__royalCombatSend?.("roll", { dirX: x * 1000, dirY: y * 1000 });
      }
      if (e.code === "KeyF" && state?.inHunt && state.combatMode === "manual") {
        e.preventDefault();
        send("ataque-basico");
      }
    },
    true,
  );
  window.addEventListener("keyup", (e) => keys.delete(e.code));
  window.addEventListener("blur", () => keys.clear());
  window.addEventListener("royal-ultimate-state", (e) => {
    state = e.detail;
    stateAt = performance.now();
    paint();
  });
  window.addEventListener("royal-skill-scene-reset", hide);
  function paint() {
    panel.hidden = !state?.inHunt;
    if (!state) return;
    const manual = state.combatMode === "manual",
      b = panel.querySelector("button");
    b.textContent = manual
      ? "MODO MANUAL · ativar automático"
      : "MODO AUTOMÁTICO · assumir controle";
    b.setAttribute("aria-pressed", String(!manual));
    panel.querySelector(".royal-mode-help").textContent = manual
      ? "WASD mover · clique no inimigo ou F atacar · Tab alvo · 1–4 habilidades"
      : "Busca inimigos e usa as habilidades habilitadas.";
    const cd = Math.max(
      0,
      (state.evadeCooldownMs ?? 0) - (performance.now() - stateAt),
    );
    panel.querySelector(".royal-evade-status").textContent = cd
      ? `Shift esquerdo · dash em ${(cd / 1000).toFixed(1)}s`
      : "Shift esquerdo · dash pronto";
  }
  setInterval(paint, 100);
})();
