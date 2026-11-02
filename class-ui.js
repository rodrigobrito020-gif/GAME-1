(() => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "royal-class-button";
  button.textContent = "Trocar classe";
  button.hidden = true;
  document.body.append(button);
  const panel = document.createElement("aside");
  panel.className = "royal-class-panel";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Escolher classe");
  document.body.append(panel);
  let state = null;
  const el = (tag, text) => {
    const n = document.createElement(tag);
    if (text) n.textContent = text;
    return n;
  };
  function render() {
    panel.replaceChildren();
    const close = el("button", "×");
    close.className = "royal-close";
    close.type = "button";
    close.setAttribute("aria-label", "Fechar classes");
    close.onclick = () => (panel.hidden = true);
    panel.append(
      close,
      el("h2", "Escolha sua classe"),
      el("p", "Troque na cidade. Seus itens e seu progresso são mantidos."),
    );
    const row = el("div");
    row.className = "royal-class-cards";
    for (const c of [
      {
        id: "guerreiro",
        name: "Guerreiro Humano",
        icon: "/assets/ui/royal-classes/warrior.png",
        desc: "Espada e escudo · combate próximo",
      },
      {
        id: "arqueira",
        name: "Arqueira Elfa",
        icon: "/assets/ui/royal-classes/archer.png",
        desc: "Arco e flechas · combate à distância",
      },
      {
        id: "pistoleira",
        name: "Pistoleira Dark Elf",
        icon: "/assets/ui/royal-classes/gunslinger.png",
        desc: "Duas pistolas · combate à distância",
      },
      {
        id: "berserker",
        name: "Berserker Orc",
        icon: "/assets/ui/royal-classes/berserker.png",
        desc: "Orc · machado de duas mãos · combate próximo",
      },
    ]) {
      const card = el("section"),
        im = new Image();
      im.src = c.icon;
      im.alt = c.name;
      const choose = el(
        "button",
        state?.classId === c.id ? "Classe atual" : "Escolher " + c.name,
      );
      choose.type = "button";
      choose.disabled = state?.inHunt || state?.classId === c.id;
      choose.onclick = () => {
        window.__royalCombatSend?.("useSkill", {
          skillId: `classe:${c.id}`,
          target: 0,
        });
        panel.hidden = true;
      };
      const portrait = el("div");
      portrait.className = "royal-class-portrait";
      portrait.dataset.class = c.id;
      portrait.append(im);
      card.append(portrait, el("h3", c.name), el("p", c.desc), choose);
      row.append(card);
    }
    panel.append(row);
    const compare = el("a", "Comparar animações dos personagens");
    compare.href = "/personagens";
    compare.target = "_blank";
    compare.rel = "noopener";
    compare.className = "royal-class-compare";
    panel.append(compare);
  }
  button.onclick = () => {
    render();
    panel.hidden = false;
  };
  window.addEventListener("royal-ultimate-state", (e) => {
    state = e.detail;
    const card = document.querySelector("#ui .slHudCard");
    if (card)
      button.style.top = `${Math.round(card.getBoundingClientRect().bottom + 10)}px`;
    button.hidden = state.inHunt || !state.alive;
    button.textContent = `${state.className ?? "Personagem"} · Trocar classe`;
  });
  window.addEventListener("keydown", (e) => {
    if (e.code === "Escape") panel.hidden = true;
  });
  window.addEventListener(
    "royal-skill-scene-reset",
    () => (panel.hidden = true),
  );
})();
