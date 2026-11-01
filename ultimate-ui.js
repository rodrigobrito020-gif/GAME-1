// Optional state extension on the existing authenticated protobuf connection.
// It never invents charge locally or changes the authoritative character.
(() => {
  let state = null,
    at = 0;
  const meter = document.createElement("button");
  meter.type = "button";
  meter.className = "royal-ultimate-meter";
  meter.hidden = true;
  meter.innerHTML =
    "<span>4 · AVATAR DA LUZ</span><strong></strong><div><i></i></div><small></small>";
  document.body.append(meter);
  const receive = (data) => {
    if (!(data instanceof ArrayBuffer)) return;
    const bytes = new Uint8Array(data);
    let pos = 0;
    const read = () => {
      let n = 0,
        shift = 0;
      for (let k = 0; k < 10 && pos < bytes.length; k++) {
        const b = bytes[pos++];
        n += (b & 127) * 2 ** shift;
        if (!(b & 128)) return n;
        shift += 7;
      }
      throw Error("invalid varint");
    };
    try {
      while (pos < bytes.length) {
        const tag = read(),
          wire = tag % 8,
          field = Math.floor(tag / 8);
        if (wire === 0) read();
        else if (wire === 1) pos += 8;
        else if (wire === 5) pos += 4;
        else if (wire === 2) {
          const length = read(),
            end = pos + length;
          if (end > bytes.length) return;
          if (field === 2047 && length < 32768) {
            const value = JSON.parse(
              new TextDecoder().decode(bytes.subarray(pos, end)),
            );
            if (
              value.version === 1 &&
              Number.isFinite(value.charge) &&
              Number.isFinite(value.cooldownMs) &&
              Number.isFinite(value.activeMs)
            ) {
              state = value;
              at = performance.now();
              window.__royalUltimateState = value;
              window.dispatchEvent(
                new CustomEvent("royal-ultimate-state", { detail: value }),
              );
              paint();
            }
          }
          pos = end;
        } else return;
      }
    } catch {
      /* A malformed optional extension must not disrupt the native client. */
    }
  };
  const Native = window.WebSocket;
  window.WebSocket = class extends Native {
    constructor(...args) {
      super(...args);
      if (
        new URL(String(args[0]), location.href).origin ===
        location.origin.replace(/^http/, "ws")
      ) {
        this.addEventListener("message", (e) => receive(e.data));
        this.addEventListener("close", () => {
          state = null;
          paint();
        });
      }
    }
  };
  const remaining = (key) =>
    Math.max(0, (state?.[key] ?? 0) - (performance.now() - at));
  const ready = () =>
    state?.inHunt &&
    state.alive &&
    !state.queued &&
    state.charge >= 100 &&
    !remaining("activeMs") &&
    !remaining("cooldownMs");
  window.__royalRequestAvatar = () => {
    if (ready()) window.__royalCastUltimate?.();
  };
  meter.onclick = () => window.__royalRequestAvatar();
  function paint() {
    meter.hidden = !state?.inHunt || !state.alive;
    if (!state) return;
    const active = remaining("activeMs"),
      cd = remaining("cooldownMs"),
      isReady = ready();
    meter.disabled = !isReady;
    meter.classList.toggle("ready", !!isReady);
    meter.classList.toggle("active", active > 0);
    meter.querySelector("strong").textContent = active
      ? "ATIVO"
      : `${state.charge} / 100`;
    meter.querySelector("i").style.width =
      `${active ? (100 * active) / (state.durationMs || 45000) : Math.max(0, Math.min(100, state.charge))}%`;
    meter.querySelector("small").textContent = state.queued
      ? "Preparando Avatar…"
      : active
        ? `Transformado · ${Math.ceil(active / 1000)}s`
        : isReady
          ? state.automatic
            ? "Pronta · ativação automática em combate"
            : "Pronta · pressione 4"
          : cd
            ? `Recarga · ${Math.ceil(cd / 1000)}s · energia por combate`
            : "Carrega ao causar e receber dano";
    const button = document.querySelector(
      '.slHudSkill[aria-label="Avatar da Luz"]',
    );
    if (button) {
      button.classList.add("royal-ultimate-skill");
      button.classList.toggle("royal-ultimate-ready", !!isReady);
      button.setAttribute("aria-disabled", String(!isReady));
    }
  }
  setInterval(paint, 100);
})();
