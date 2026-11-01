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

// Status follows the draggable player card and disappears with the server buff.
{
  const badge = document.createElement("div");
  badge.className = "royal-defense-buff";
  badge.hidden = true;
  badge.setAttribute("role", "status");
  badge.title = "Égide de Luz · Defesa +30% (mínimo +2). Não acumula.";
  const icon = document.createElement("img");
  icon.src = "/assets/ui/royal-warrior/egide-de-luz.svg";
  icon.alt = "";
  const label = document.createElement("span");
  label.textContent = "Égide de Luz";
  const remaining = document.createElement("strong");
  badge.append(icon, label, remaining);
  document.body.append(badge);
  let until = 0;
  const paint = () => {
    const card = document.querySelector(".slHudCard"),
      time = until - performance.now();
    badge.hidden = !card || time <= 0;
    if (badge.hidden) return;
    const rect = card.getBoundingClientRect();
    badge.style.left = `${rect.left}px`;
    badge.style.top = `${rect.bottom + 8}px`;
    remaining.textContent = `${Math.ceil(time / 1000)}s`;
    badge.dataset.remainingMs = String(Math.max(0, Math.round(time)));
  };
  window.addEventListener("royal-defense-buff", ({ detail }) => {
    until = detail.removed ? 0 : performance.now() + detail.durationMs;
    paint();
  });
  setInterval(paint, 125);
}

// This circle follows the rendered character, not the screen center or HUD card.
// It shows the real 20-second recharge even after the 12-second buff expires.
{
  const marker = document.createElement("div");
  marker.className = "royal-skill-cooldown";
  marker.hidden = true;
  marker.setAttribute("role", "status");
  marker.setAttribute("aria-live", "off");
  marker.innerHTML =
    '<svg viewBox="0 0 48 48" aria-hidden="true"><circle class="cooldown-track" cx="24" cy="24" r="21"/><circle class="cooldown-progress" cx="24" cy="24" r="21" pathLength="100"/></svg><img src="/assets/ui/royal-warrior/egide-de-luz.svg" alt=""><strong></strong>';
  document.body.append(marker);
  const ring = marker.querySelector(".cooldown-progress"),
    counter = marker.querySelector("strong");
  let until = 0,
    total = 0,
    anchor = null;
  const paint = () => {
    const now = performance.now(),
      remaining = Math.max(0, until - now);
    marker.hidden = remaining <= 0 || !anchor?.visible || now - anchor.at > 500;
    if (remaining <= 0) window.__royalCooldownUntil = 0;
    if (marker.hidden) return;
    marker.style.left = `${anchor.x}px`;
    marker.style.top = `${anchor.y}px`;
    ring.style.strokeDasharray = `${Math.min(100, (100 * remaining) / total)} 100`;
    counter.textContent = `${Math.ceil(remaining / 1000)}s`;
    marker.setAttribute(
      "aria-label",
      `Égide de Luz: recarga ${Math.ceil(remaining / 1000)} segundos`,
    );
    marker.dataset.remainingMs = String(Math.round(remaining));
  };
  window.addEventListener("royal-skill-cooldown", ({ detail }) => {
    const remaining = Math.max(0, Number(detail.readyInMs) || 0);
    total = Math.max(remaining, Number(detail.totalMs) || 0, 1);
    until = performance.now() + remaining;
    window.__royalCooldownEntity = detail.entity;
    window.__royalCooldownUntil = until;
    paint();
  });
  window.addEventListener("royal-skill-anchor", ({ detail }) => {
    anchor = { ...detail, at: performance.now() };
    paint();
  });
  window.addEventListener("royal-skill-scene-reset", () => {
    until = 0;
    anchor = null;
    window.__royalCooldownUntil = 0;
    marker.hidden = true;
  });
  setInterval(paint, 100);
}
