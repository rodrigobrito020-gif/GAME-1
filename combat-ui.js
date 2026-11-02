// One card renderer for hotbar skills and active effects over the player.
(() => {
  const card = document.createElement("aside");
  card.className = "royal-skill-card";
  card.hidden = true;
  card.setAttribute("role", "tooltip");
  card.id = "royal-skill-card";
  document.body.append(card);
  let state = null,
    stateAt = 0,
    currentButton = null,
    shownId = "",
    hold = null,
    pendingOrder = null,
    pendingAt = 0;
  const switches = new Map(),
    keys = new Set();
  let dashRequestAt = -Infinity;
  const send = (skillId) =>
    window.__royalCombatSend?.("useSkill", { skillId, target: 0 });
  const skills = () =>
    (window.__royalCombatCatalog?.() ?? []).map((s) =>
      s.id === "dash" && state?.classVisuals
        ? { ...s, icon: state.classVisuals.dashIcon }
        : s,
    );
  const order = () => pendingOrder ?? state?.skillOrder ?? [];
  const time = (ms) => (ms >= 60000 ? `${ms / 60000} min` : `${ms / 1000}s`);
  const text = (tag, value) => {
    const n = document.createElement(tag);
    n.textContent = value;
    return n;
  };
  const overhead = (b) => b?.classList.contains("royal-skill-orb");
  function find(button) {
    return skills().find((s) =>
      button?.dataset.skill
        ? s.id === button.dataset.skill
        : s.name === button?.getAttribute("aria-label"),
    );
  }
  function position() {
    if (!currentButton) return;
    const box = currentButton.getBoundingClientRect(),
      width = Math.min(300, innerWidth - 24);
    card.style.width = width + "px";
    card.style.left =
      Math.min(
        innerWidth - width - 12,
        Math.max(12, box.left + box.width / 2 - width / 2),
      ) + "px";
    card.style.top = Math.max(12, box.top - card.offsetHeight - 15) + "px";
  }
  function show(button) {
    const s = find(button);
    if (!s) return;
    currentButton = button;
    shownId = s.id;
    card.replaceChildren();
    const image = new Image();
    image.src = s.icon;
    image.alt = "";
    card.append(
      image,
      text(
        "small",
        s.classId === "universal"
          ? "HABILIDADE COMUM · TODAS AS CLASSES"
          : ["avatar-da-luz", "espirito-da-floresta", "eclipse"].includes(s.id)
            ? `ULTIMATE · ${s.classId === "pistoleira" ? "PISTOLEIRA DARK ELF" : s.classId === "arqueira" ? "ARQUEIRA ELFA" : "GUERREIRO HUMANO"}`
            : s.classId === "pistoleira"
              ? "PISTOLEIRA DARK ELF"
              : s.classId === "arqueira"
                ? "ARQUEIRA ELFA"
                : "GUERREIRO HUMANO",
      ),
      text("h2", s.name),
      text("p", s.description),
    );
    const stats = document.createElement("dl");
    for (const [label, value] of [
      ["Atalho", s.id === "dash" ? "Shift esquerdo" : s.key],
      [
        "Custo",
        ["avatar-da-luz", "espirito-da-floresta", "eclipse"].includes(s.id)
          ? "100 energia"
          : `${s.manaCost} MP`,
      ],
      ["Recarga", time(s.cooldownMs)],
      ...(s.durationMs ? [["Duração", time(s.durationMs)]] : []),
    ])
      stats.append(text("dt", label), text("dd", value));
    stats.append(
      text("dt", "Uso"),
      Object.assign(
        text("dd", order().includes(s.id) ? "Automático" : "Manual"),
        { className: "royal-card-mode" },
      ),
    );
    if (overhead(button)) {
      stats.append(
        text("dt", "Restante"),
        Object.assign(text("dd", ""), { className: "royal-card-remaining" }),
      );
    }
    card.append(
      stats,
      text(
        "footer",
        overhead(button)
          ? "Efeito ativo · duração acima do personagem"
          : "Clique para usar · AUTO/MANUAL escolhe o uso automático",
      ),
    );
    card.hidden = false;
    button.setAttribute("aria-describedby", card.id);
    position();
    refreshCard();
  }
  function hide() {
    card.hidden = true;
    currentButton?.removeAttribute("aria-describedby");
    currentButton = null;
    shownId = "";
  }
  function refreshCard() {
    if (!currentButton || card.hidden) return;
    if (!currentButton.checkVisibility()) {
      hide();
      return;
    }
    const s = find(currentButton);
    if (s?.id !== shownId) {
      show(currentButton);
      return;
    }
    const mode = card.querySelector(".royal-card-mode");
    if (mode)
      mode.textContent = order().includes(s.id) ? "Automático" : "Manual";
    const left = card.querySelector(".royal-card-remaining");
    if (left) {
      const seconds = Math.ceil(
        Number(currentButton.dataset.remainingMs ?? 0) / 1000,
      );
      left.textContent =
        seconds >= 60
          ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
          : `${seconds}s`;
    }
    position();
  }
  const buttonOf = (e) =>
    e.target.closest?.(
      ".slHudSkill:not(.slHudRoll),.royal-skill-orb[data-skill]",
    );
  document.addEventListener(
    "pointerover",
    (e) => {
      const b = buttonOf(e);
      if (b && b !== currentButton) show(b);
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
      if (overhead(h.button) || performance.now() - h.start >= 350) {
        show(h.button);
        return;
      }
      if (Math.hypot(e.clientX - h.x, e.clientY - h.y) > 12) return;
      const s = find(h.button);
      if (["avatar-da-luz", "espirito-da-floresta", "eclipse"].includes(s?.id))
        window.__royalRequestAvatar?.();
      else if (s?.id === "dash") window.__royalRequestDash?.();
      else if (s) send(s.id);
    },
    true,
  );
  document.addEventListener("pointercancel", () => {
    if (hold) clearTimeout(hold.timer);
    hold = null;
    hide();
  });
  const typing = () =>
    document.activeElement?.matches(
      'input,textarea,select,[contenteditable="true"]',
    ) ||
    [...document.querySelectorAll('[role="dialog"]')].some((d) =>
      d.checkVisibility(),
    );
  window.__royalRequestDash = () => {
    const now = performance.now();
    if (
      !state?.alive ||
      now - dashRequestAt < 250 ||
      Math.max(0, (state.evadeCooldownMs ?? 0) - (now - stateAt)) > 0
    )
      return;
    dashRequestAt = now;
    let x =
        (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
        (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0),
      y =
        (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) -
        (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0);
    window.__royalCombatSend?.("roll", { dirX: x * 1000, dirY: y * 1000 });
  };
  window.addEventListener(
    "keydown",
    (e) => {
      if (typing() || e.ctrlKey || e.metaKey || e.altKey) return;
      keys.add(e.code);
      if (e.code === "ShiftLeft" && !e.repeat) {
        e.preventDefault();
        e.stopImmediatePropagation();
        window.__royalRequestDash();
      }
      if (
        (e.code === "Enter" || e.code === "Space") &&
        overhead(document.activeElement)
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
        show(document.activeElement);
      }
    },
    true,
  );
  window.addEventListener("keyup", (e) => keys.delete(e.code));
  window.addEventListener("blur", () => keys.clear());
  function toggle(skill) {
    const next = [...order()];
    const index = next.indexOf(skill.id);
    if (index >= 0) next.splice(index, 1);
    else next.push(skill.id);
    pendingOrder = next;
    pendingAt = performance.now();
    window.__royalCombatSend?.("setAutomation", {
      automation: {
        skillOrder: next,
        skillOrderStrict: !!state?.skillOrderStrict,
      },
    });
    paint();
  }
  function paint() {
    if (pendingOrder && performance.now() - pendingAt > 2000)
      pendingOrder = null;
    const seen = new Set();
    for (const slot of document.querySelectorAll(
      ".slHudSkill:not(.slHudRoll)",
    )) {
      const skill = find(slot);
      if (!skill) continue;
      const art = slot.querySelector("img");
      if (art && skill.icon && art.getAttribute("src") !== skill.icon)
        art.src = skill.icon;
      seen.add(skill.id);
      let button = switches.get(skill.id);
      if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.className = "royal-skill-mode-switch";
        button.dataset.skill = skill.id;
        button.onclick = () => toggle(skill);
        document.body.append(button);
        switches.set(skill.id, button);
      }
      const visible = state?.inHunt && slot.checkVisibility(),
        automatic = order().includes(skill.id);
      button.hidden = !visible;
      button.textContent = automatic ? "AUTO" : "MANUAL";
      button.dataset.automatic = String(automatic);
      button.setAttribute("aria-pressed", String(automatic));
      button.setAttribute(
        "aria-label",
        `${skill.name}: ${automatic ? "automático" : "manual"}. Alterar para ${automatic ? "manual" : "automático"}`,
      );
      slot.dataset.automatic = String(automatic);
      if (visible) {
        const box = slot.getBoundingClientRect();
        button.style.left = box.left + "px";
        button.style.top = box.top - 25 + "px";
        button.style.width = box.width + "px";
      }
    }
    for (const [id, button] of switches)
      if (!seen.has(id)) {
        button.remove();
        switches.delete(id);
      } else if (!state?.inHunt) button.hidden = true;
    refreshCard();
  }
  window.addEventListener("royal-ultimate-state", (e) => {
    state = e.detail;
    stateAt = performance.now();
    if (
      pendingOrder &&
      JSON.stringify(state.skillOrder) === JSON.stringify(pendingOrder)
    )
      pendingOrder = null;
    paint();
  });
  window.addEventListener("royal-skill-scene-reset", () => {
    hide();
    keys.clear();
    for (const b of switches.values()) b.hidden = true;
  });
  setInterval(paint, 100);
})();
