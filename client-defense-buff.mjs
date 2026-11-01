// Version-checked bridges from the native renderer to our own small HUD.
// Timers use authoritative cooldown events, independently of the 12-second buff.
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
    'buff(e,t=!1){if(e.entity===this.d.entities.own&&e.buffId==="egide-de-luz")window.dispatchEvent(new CustomEvent("royal-defense-buff",{detail:{durationMs:e.durationMs,removed:e.removed}}));let n=this.actor(e.entity);',
  );
  const cooldown = "r.on(`worldEvents`,e=>{for(let t of e.cooldowns)";
  code = replaceOnce(
    code,
    cooldown,
    'r.on(`worldEvents`,e=>{for(const cd of e.cooldowns)if(cd.skillId==="egide-de-luz")window.dispatchEvent(new CustomEvent("royal-skill-cooldown",{detail:{entity:this.entities.own,readyInMs:cd.readyInMs,totalMs:cd.totalMs}}));for(let t of e.cooldowns)',
  );
  const scene = "r.on(`sceneEnter`,e=>this.enterScene(e))";
  code = replaceOnce(
    code,
    scene,
    'r.on(`sceneEnter`,e=>{window.dispatchEvent(new CustomEvent("royal-skill-scene-reset"));this.enterScene(e)})',
  );
  const anchor = "this.plate.setBar(this.hp,this.maxHp,this.shield)}tumble";
  const project = `
if(this.id===window.__royalCooldownEntity&&performance.now()<window.__royalCooldownUntil){
  const scene=this.root.scene,cam=scene.cameras.main,rect=scene.game.canvas.getBoundingClientRect();
  const wx=this.x+this.body.x,wy=Math.min(this.y-this.height-this.plateLift-28,this.y+this.body.y-this.height-12);
  const x=rect.left+(cam.x+(wx-cam.worldView.x)*cam.zoom)*rect.width/scene.scale.width;
  const y=rect.top+(cam.y+(wy-cam.worldView.y)*cam.zoom)*rect.height/scene.scale.height;
  window.dispatchEvent(new CustomEvent("royal-skill-anchor",{detail:{x,y,visible:this.alive&&!this.hidden&&this.root.visible&&x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom}}));
}
`;
  code = replaceOnce(code, "," + anchor, ";" + project + anchor);
  return Buffer.from(code);
}
