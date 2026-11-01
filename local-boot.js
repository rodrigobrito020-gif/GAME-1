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

// Show only the authoritative buff duration above the nameplate. Recharge
// remains in the native skill bar and never creates an overhead indicator.
{
  const header = document.createElement("div");
  header.className = "royal-skill-statuses";
  header.hidden = true;
  const node = document.createElement("div");
  node.className = "royal-skill-orb royal-skill-status";
  node.hidden = true;
  node.setAttribute("role", "button");
  node.tabIndex = 0;
  node.setAttribute("aria-live", "off");
  node.innerHTML =
    '<svg viewBox="0 0 48 48" aria-hidden="true"><circle class="cooldown-track" cx="24" cy="24" r="21"/><circle class="cooldown-progress" cx="24" cy="24" r="21" pathLength="100"/></svg><img src="/assets/ui/royal-warrior/egide-de-luz-card.png" alt=""><strong></strong><small></small>';
  header.append(node);
  document.body.append(header);
  const ring = node.querySelector(".cooldown-progress"),
    counter = node.querySelector("strong"),
    label = node.querySelector("small");
  const buff = { until: 0, total: 1 },
    avatar = { until: 0, total: 1 };
  let anchor = null;
  const paint = () => {
    const now = performance.now();
    const timer = avatar.until > now ? avatar : buff;
    const skillName = timer === avatar ? "Avatar da Luz" : "Égide de Luz";
    node.querySelector("img").src =
      timer === avatar
        ? "/assets/ui/royal-warrior/avatar-da-luz-card.png"
        : "/assets/ui/royal-warrior/egide-de-luz-card.png";
    node.dataset.skill = timer === avatar ? "avatar-da-luz" : "egide-de-luz";
    const remaining = Math.max(0, timer.until - now),
      name = "DURAÇÃO";
    node.hidden = remaining <= 0;
    node.classList.add("royal-buff-duration");
    node.dataset.mode = "duration";
    node.dataset.remainingMs = String(Math.round(remaining));
    ring.style.strokeDasharray = `${Math.min(100, (100 * remaining) / timer.total)} 100`;
    const seconds = Math.ceil(remaining / 1000);
    counter.textContent =
      seconds >= 60
        ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
        : `${seconds}s`;
    label.textContent = name;
    node.setAttribute(
      "aria-label",
      `${skillName}: ${name.toLowerCase()} ${Math.ceil(remaining / 1000)} segundos`,
    );
    header.hidden = node.hidden || !anchor?.visible || now - anchor.at > 500;
    if (!header.hidden) {
      header.style.left = `${anchor.x}px`;
      header.style.top = `${anchor.y}px`;
    }

    window.__royalBuffUntil =
      Math.max(buff.until, avatar.until) > now
        ? Math.max(buff.until, avatar.until)
        : 0;
  };
  const start = (timer, entity, remaining, total) => {
    const ms = Math.max(0, Number(remaining) || 0);
    timer.total = Math.max(ms, Number(total) || 0, 1);
    timer.until = performance.now() + ms;
    window.__royalIndicatorEntity = entity;
    paint();
  };
  window.addEventListener("royal-defense-buff", ({ detail }) =>
    start(
      buff,
      detail.entity,
      detail.removed ? 0 : detail.durationMs,
      detail.durationMs,
    ),
  );
  window.addEventListener("royal-avatar-buff", ({ detail }) =>
    start(
      avatar,
      detail.entity,
      detail.removed ? 0 : detail.durationMs,
      detail.durationMs,
    ),
  );
  window.addEventListener("royal-skill-anchor", ({ detail }) => {
    anchor = { ...detail, at: performance.now() };
    paint();
  });
  window.addEventListener("royal-skill-scene-reset", () => {
    buff.until = avatar.until = 0;
    anchor = null;
    paint();
  });
  setInterval(paint, 100);
}
