// Version-checked bridges from the native renderer to our own small HUD.
// The overhead timer uses the authoritative buff lifetime. Native recharge UI stays intact.
function replaceOnce(code, needle, replacement) {
  if (code.split(needle).length !== 2)
    throw Error("Cliente incompatível com os indicadores da Égide de Luz.");
  return code.replace(needle, replacement);
}
export function withDefenseBuffUi(bytes) {
  let code = bytes.toString("utf8");
  const buff = "buff(e,t=!1){let n=this.actor(e.entity);";
  code = replaceOnce(
    code,
    buff,
    'buff(e,t=!1){if(e.buffId==="egide-de-luz")window.__royalAegisVisuals?.apply(this.actor(e.entity),e.durationMs,e.removed);if(e.entity===this.d.entities.own&&e.buffId==="egide-de-luz")window.dispatchEvent(new CustomEvent("royal-defense-buff",{detail:{entity:e.entity,durationMs:e.durationMs,removed:e.removed}}));let n=this.actor(e.entity);',
  );
  const scene = "r.on(`sceneEnter`,e=>this.enterScene(e))";
  code = replaceOnce(
    code,
    scene,
    'r.on(`sceneEnter`,e=>{window.dispatchEvent(new CustomEvent("royal-skill-scene-reset"));this.enterScene(e)})',
  );
  code = replaceOnce(
    code,
    "o.level&&t.level?Jr(`world.plate.level`",
    "!r&&o.level&&t.level?Jr(`world.plate.level`",
  );
  code = replaceOnce(
    code,
    "this.d.floating.show(n.x,n.y-n.height-30,Jr(`world.fx.level_up`",
    "e!==this.d.entities.own&&this.d.floating.show(n.x,n.y-n.height-30,Jr(`world.fx.level_up`",
  );
  const anchor = "this.plate.setBar(this.hp,this.maxHp,this.shield)}tumble";
  const project = `
window.__royalAegisVisuals?.update(this);
`;
  code = replaceOnce(code, "," + anchor, ";" + project + anchor);
  return Buffer.from(code);
}
