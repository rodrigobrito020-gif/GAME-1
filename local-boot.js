// Optional auto-entry for the single local demo account. This submits the real
// captured login form to our local server; it does not bypass authentication.
if (new URLSearchParams(location.search).get("demo") === "1") {
  let submitted = false;
  const enter = () => {
    if (submitted) return;
    const home = document.querySelector(".slAuthTopEnter");
    if (home) {
      home.click();
      return;
    }
    const user = document.querySelector("#slAuth-username");
    const password = document.querySelector("#slAuth-password");
    const form = document.querySelector("#slAuthForm");
    if (!user || !password || !form) return;
    submitted = true;
    user.value = "teste";
    password.value = "Teste123!";
    user.dispatchEvent(new Event("input", { bubbles: true }));
    password.dispatchEvent(new Event("input", { bubbles: true }));
    form.requestSubmit();
    observer.disconnect();
  };
  const observer = new MutationObserver(enter);
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
  });
  enter();
  setTimeout(() => observer.disconnect(), 30000);
}

// Show every active buff independently, using the authoritative runtime list.
{
  const header = document.createElement("div");
  header.className = "royal-skill-statuses";
  header.hidden = true;
  document.body.append(header);
  const nodes = new Map();
  let buffs = [],
    at = 0,
    anchor = null;
  function paint() {
    const now = performance.now(),
      alive = new Set();
    for (const buff of buffs) {
      const remaining = Math.max(0, buff.remainingMs - (now - at));
      if (!remaining) continue;
      alive.add(buff.id);
      let node = nodes.get(buff.id);
      if (!node) {
        node = document.createElement("div");
        node.className =
          "royal-skill-orb royal-skill-status royal-buff-duration";
        node.tabIndex = 0;
        node.setAttribute("role", "button");
        node.innerHTML =
          '<svg viewBox="0 0 48 48" aria-hidden="true"><circle class="cooldown-track" cx="24" cy="24" r="21"/><circle class="cooldown-progress" cx="24" cy="24" r="21" pathLength="100"/></svg><img alt=""><strong></strong><small>DURAÇÃO</small>';
        header.append(node);
        nodes.set(buff.id, node);
      }
      node.hidden = false;
      node.dataset.skill = buff.id;
      node.dataset.mode = "duration";
      node.dataset.remainingMs = String(Math.round(remaining));
      const icon = node.querySelector("img");
      if (icon.getAttribute("src") !== buff.icon) icon.src = buff.icon;
      node.querySelector(".cooldown-progress").style.strokeDasharray =
        `${Math.min(100, (100 * remaining) / buff.totalMs)} 100`;
      const seconds = Math.ceil(remaining / 1000);
      node.querySelector("strong").textContent =
        seconds >= 60
          ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
          : `${seconds}s`;
      node.setAttribute(
        "aria-label",
        `${buff.name}: duração ${seconds} segundos`,
      );
    }
    for (const [id, node] of nodes)
      if (!alive.has(id)) {
        node.remove();
        nodes.delete(id);
      }
    window.__royalBuffUntil = buffs.length
      ? now + Math.max(0, ...buffs.map((b) => b.remainingMs - (now - at)))
      : 0;
    header.hidden =
      nodes.size === 0 || !anchor?.visible || now - anchor.at > 500;
    if (!header.hidden) {
      header.style.left = `${anchor.x}px`;
      header.style.top = `${anchor.y}px`;
    }
  }
  window.addEventListener("royal-ultimate-state", (e) => {
    buffs = e.detail.activeBuffs ?? [];
    at = performance.now();
    if (buffs.length) window.__royalIndicatorEntity = 1;
    paint();
  });
  window.addEventListener("royal-skill-anchor", (e) => {
    anchor = { ...e.detail, at: performance.now() };
    paint();
  });
  window.addEventListener("royal-skill-scene-reset", () => {
    buffs = [];
    anchor = null;
    paint();
  });
  setInterval(paint, 100);
}
