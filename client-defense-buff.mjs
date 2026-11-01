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
    'buff(e,t=!1){if(e.buffId==="avatar-da-luz"){window.__royalAvatarVisuals?.apply(this.actor(e.entity),e.durationMs,e.removed);if(e.entity===this.d.entities.own)window.dispatchEvent(new CustomEvent("royal-avatar-buff",{detail:{entity:e.entity,durationMs:e.durationMs,removed:e.removed}}));}if(e.buffId==="egide-de-luz")window.__royalAegisVisuals?.apply(this.actor(e.entity),e.durationMs,e.removed);if(e.entity===this.d.entities.own&&e.buffId==="egide-de-luz")window.dispatchEvent(new CustomEvent("royal-defense-buff",{detail:{entity:e.entity,durationMs:e.durationMs,removed:e.removed}}));let n=this.actor(e.entity);',
  );
  code = replaceOnce(
    code,
    "r.on(`worldEvents`,e=>{for(let t of e.cooldowns)",
    'r.on(`worldEvents`,e=>{for(const cd of e.cooldowns)if(cd.skillId==="avatar-da-luz")window.dispatchEvent(new CustomEvent("royal-avatar-cooldown",{detail:cd}));for(let t of e.cooldowns)',
  );
  code = replaceOnce(
    code,
    "function rte(e,t,n){let r=",
    'function rte(e,t,n){window.__royalCombatSend=(kind,value)=>e.net.send(kind,value);window.__royalCombatCatalog=()=>[...e.catalog.skills.values()];window.__royalCastUltimate=()=>e.net.send(`useSkill`,{skillId:"avatar-da-luz",target:0});let r=',
  );
  code = replaceOnce(
    code,
    "f=t=>{d||e.net.send(`useSkill`,",
    'f=t=>{if(t.id==="avatar-da-luz"){window.__royalRequestAvatar?.();return}d||e.net.send(`useSkill`,',
  );
  code = replaceOnce(
    code,
    "if(i.hidden||d||!op(e))return;let t=e.key.toLowerCase()",
    'if(i.hidden||(d&&e.key!=="4")||!op(e))return;let t=e.key.toLowerCase()',
  );
  code = replaceOnce(
    code,
    "d?J(`hud.skills.auto_hint`):r&&r!==t.key",
    '(d&&(n.id!=="avatar-da-luz"||window.__royalUltimateState?.automatic))?J(`hud.skills.auto_hint`):r&&r!==t.key',
  );
  code = replaceOnce(
    code,
    "autoCombat:()=>t.stores.world.autoCombat,",
    'autoCombat:()=>window.__royalUltimateState?window.__royalUltimateState.inHunt&&window.__royalUltimateState.combatMode!=="manual":t.stores.world.autoCombat,',
  );
  code = replaceOnce(
    code,
    "e.stores.world.autoCombat!==d&&(d=e.stores.world.autoCombat,",
    "false!==d&&(d=false,",
  );
  code = replaceOnce(
    code,
    "this.net.send(`setTarget`,{entity:n.id});return}break;case Ft.PLAYER",
    'this.net.send(`setTarget`,{entity:n.id});if(window.__royalUltimateState?.combatMode==="manual")this.net.send(`useSkill`,{skillId:"ataque-basico",target:n.id});return}break;case Ft.PLAYER',
  );
  code = replaceOnce(
    code,
    "if(e.rightButtonDown()){let t=this.scene.cameras.main.getWorldPoint(e.x,e.y),n=this.hooks.pick(t.x,t.y);",
    'if(e.rightButtonDown()){let t=this.scene.cameras.main.getWorldPoint(e.x,e.y),n=this.hooks.pick(t.x,t.y);if(n?.kind===Ft.MONSTER&&n.alive){this.net.send(`useSkill`,{skillId:"ataque-direito",target:n.id});return;}',
  );
  code = replaceOnce(
    code,
    "filter(e=>e.classId===t&&t!==``)",
    "filter(e=>(e.classId===t||e.classId===`universal`)&&t!==``)",
  );
  code = replaceOnce(
    code,
    "let t=e.key.toLowerCase(),n=[`1`,`2`,`3`,`4`].indexOf(t)",
    "let t=e.key.toLowerCase();if(t===`shift`)return;let n=[`1`,`2`,`3`,`4`].indexOf(t)",
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
window.__royalAvatarVisuals?.update(this);
window.__royalHD?.update(this);
window.__royalCombatVisuals?.update(this);
`;
  code = replaceOnce(code, "," + anchor, ";" + project + anchor);
  return Buffer.from(code);
}
