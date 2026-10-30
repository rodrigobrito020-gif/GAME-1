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
