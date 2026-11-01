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
