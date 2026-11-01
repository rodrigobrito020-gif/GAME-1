// Forward only the local warrior's own buff event to our small status badge.
// The native renderer still manages all animation and attached aura effects.
export function withDefenseBuffUi(bytes) {
  const code = bytes.toString("utf8");
  const needle = "buff(e,t=!1){let n=this.actor(e.entity);";
  if (code.split(needle).length !== 2)
    throw Error("Cliente incompatível com o indicador da Égide de Luz.");
  return Buffer.from(
    code.replace(
      needle,
      'buff(e,t=!1){if(e.entity===this.d.entities.own&&e.buffId==="egide-de-luz")window.dispatchEvent(new CustomEvent("royal-defense-buff",{detail:{durationMs:e.durationMs,removed:e.removed}}));let n=this.actor(e.entity);',
    ),
  );
}
