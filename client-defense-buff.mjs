import { withLocalInterpolation } from "./client-latency.mjs";
// Version-checked bridges from the native renderer to our own small HUD.
// The overhead timer uses the authoritative buff lifetime. Native recharge UI stays intact.
function replaceOnce(code, needle, replacement) {
  if (code.split(needle).length !== 2)
    throw Error("Cliente incompatível com os indicadores da Égide de Luz.");
  return code.replace(needle, replacement);
}
export function withDefenseBuffUi(bytes) {
  let code = bytes.toString("utf8");
  code = replaceOnce(code, "uS=.55,dS=.3,fS=520", "uS=.22,dS=.09,fS=520");
  const damageNumbers =
    "e.flags&Tm.DOT?t.show(s,c+10,tt(e.amount),Dw.dot):l?t.show(s,c,`-${tt(e.amount)}`,e.flags&Tm.CRIT?Dw.crit:Dw.hurt):e.flags&Tm.CRIT?t.show(s,c-6,tt(e.amount),Dw.crit):t.show(s,c,tt(e.amount),e.flags&Tm.MAGIC?Dw.magic:Dw.hit)";
  code = replaceOnce(
    code,
    damageNumbers,
    "(i.kind===Ft.MONSTER&&e.source===o&&window.__royalHitFeedback?.apply(r,i,{amount:e.amount,critical:!!(e.flags&Tm.CRIT),dot:!!(e.flags&Tm.DOT),skillId:e.skillId},this.actor(e.source)))||(" +
      damageNumbers +
      ")",
  );
  code = replaceOnce(
    code,
    "t.flash(16777215,UD);let c=WD*2",
    't.flash(window.__royalUltimateState?.classId==="pistoleira"?0xe6dcff:16777215,window.__royalUltimateState?.classId==="pistoleira"?60:UD);let c=WD*2',
  );
  const buff = "buff(e,t=!1){let n=this.actor(e.entity);";
  code = replaceOnce(
    code,
    buff,
    'buff(e,t=!1){if(e.buffId==="avatar-da-luz"){window.__royalAvatarVisuals?.apply(this.actor(e.entity),e.durationMs,e.removed);if(e.entity===this.d.entities.own)window.dispatchEvent(new CustomEvent("royal-avatar-buff",{detail:{entity:e.entity,durationMs:e.durationMs,removed:e.removed}}));}if(e.buffId==="egide-de-luz")window.__royalAegisVisuals?.apply(this.actor(e.entity),e.durationMs,e.removed);if(e.entity===this.d.entities.own&&e.buffId==="egide-de-luz")window.dispatchEvent(new CustomEvent("royal-defense-buff",{detail:{entity:e.entity,durationMs:e.durationMs,removed:e.removed}}));let n=this.actor(e.entity);',
  );
  code = replaceOnce(
    code,
    "r.on(`worldEvents`,e=>{for(let t of e.cooldowns)",
    'r.on(`worldEvents`,e=>{window.__royalCombatAudio?.events(e,this.entities.own);for(const cd of e.cooldowns)if(cd.skillId==="avatar-da-luz")window.dispatchEvent(new CustomEvent("royal-avatar-cooldown",{detail:cd}));for(let t of e.cooldowns)',
  );
  code = replaceOnce(
    code,
    "function rte(e,t,n){let r=",
    'function rte(e,t,n){window.__royalAudioBridge={load:w_,play:T_,has:p=>!!u_.get(p),defaults:()=>{try{if(localStorage.getItem("leveling.sfx-volume")===null)E_(.25)}catch{}}};window.__royalCombatSend=(kind,value)=>e.net.send(kind,value);window.__royalCombatCatalog=()=>[...e.catalog.skills.values()];window.__royalCastUltimate=()=>e.net.send(`useSkill`,{skillId:window.__royalUltimateState?.ultimateSkillId??"avatar-da-luz",target:0});let r=',
  );
  code = replaceOnce(
    code,
    "f=t=>{d||e.net.send(`useSkill`,",
    'f=t=>{if(t.id===(window.__royalUltimateState?.ultimateSkillId??"avatar-da-luz")){window.__royalRequestAvatar?.();return}d||e.net.send(`useSkill`,',
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
  code = replaceOnce(
    code,
    "levelUp(e,t){let n=this.actor(e);",
    "levelUp(e,t){let n=this.actor(e);if(n&&window.__royalLevelUp?.apply(n,t,e===this.d.entities.own?EC:null))return;",
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
  // A completed dodge may still hold a pose from the previous doll. Clear that
  // class-specific action when changing the sheet, so idle uses the new class.
  code = replaceOnce(
    code,
    "setDoll(e,t,n,r=null){this.stand()",
    "setDoll(e,t,n,r=null){if(this.doll&&this.doll.key!==e)this.act=null;this.stand()",
  );
  code = replaceOnce(
    code,
    "this.baseScale=2,this.height=Ky,this.plateLift=120-Ky,this.radius=34,this.shadow.setDisplaySize(36,12),this.body.setOrigin(32/64,60/64).setScale(2)}headHeight",
    "this.baseScale=e.includes(`orc-berserker`)?2.6:2,this.height=Ky*(this.baseScale/2),this.plateLift=(120-Ky)*(this.baseScale/2),this.radius=34*(this.baseScale/2),this.shadow.setDisplaySize(36*(this.baseScale/2),12*(this.baseScale/2)),this.body.setOrigin(32/64,60/64).setScale(this.baseScale)}headHeight",
  );
  code = replaceOnce(
    code,
    "this.height-Cv(e.tex,this.body.frame)*2:this.height",
    "this.height-Cv(e.tex,this.body.frame)*(e.key.includes(`orc-berserker`)?this.baseScale:2):this.height",
  );
  code = replaceOnce(
    code,
    "this.doll={key:e,tex:this.body.scene.textures.get(e),rig:t,sheet:null",
    "this.doll={key:e,tex:this.body.scene.textures.get(e),rig:e.includes(`orc-berserker`)?{...t,loops:{...t.loops,walk:{...t.loops.walk,stride:t.loops.walk.stride*1.3},run:{...t.loops.run,stride:t.loops.run.stride*1.3}}}:t,sheet:null",
  );
  const project = `
window.__royalAegisVisuals?.update(this);
window.__royalAvatarVisuals?.update(this);
window.__royalHD?.update(this);
window.__royalCombatVisuals?.update(this);
window.__royalArcherVisuals?.update(this);
window.__royalGunslingerVisuals?.update(this);
window.__royalBerserkerVisuals?.update(this);
window.__royalAttachedEnergy?.update(this);
window.__royalOverheadUltimate?.update(this);
`;
  code = replaceOnce(code, "," + anchor, ";" + project + anchor);
  return withLocalInterpolation(Buffer.from(code));
}
