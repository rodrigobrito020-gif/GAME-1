// A version-checked local adapter for the supplied client's existing sprite
// afterimage renderer. The uploaded ZIP is never modified or redistributed.
import { LIGHT_AFTERIMAGES as FX } from "./light-afterimages.mjs";
const original =
  "for(let t of this.ghosts)t.img.visible&&(t.age+=e,t.age>=$y?t.img.setVisible(!1):t.img.setAlpha(t.alpha*(1-t.age/$y)));this.trailLeft>0&&(this.trailLeft-=e,this.trailNext-=e,this.trailNext<=0&&this.body.visible&&(this.trailNext=Qy,Pl().trails&&this.afterimage()))}afterimage(){let e=this.body,t=null;for(let e of this.ghosts)if(!e.img.visible){t=e;break}t?t.img.setTexture(e.texture.key,e.frame.name):(t={img:this.root.scene.add.image(0,0,e.texture.key,e.frame.name).setTintMode(Yh.FILL).setBlendMode(Lh.ADD),age:0,alpha:0},this.ghosts.push(t)),t.age=0,t.alpha=.35*this.pose.alpha,t.img.setPosition(this.x+e.x,this.y+e.y).setOrigin(e.originX,e.originY).setScale(e.scaleX,e.scaleY).setAngle(e.angle).setFlipX(e.flipX).setTint(this.trailColor).setAlpha(t.alpha).setDepth(this.root.depth-.5).setVisible(!0),kv(t.img)}";
export function withLightAfterimages(bytes) {
  const code = bytes.toString("utf8");
  const at = code.indexOf(original);
  if (at < 0 || code.indexOf(original, at + original.length) !== -1)
    throw Error(
      "Cliente incompatível com o adaptador de rastro do Avanço de Luz.",
    );
  const replacement = `
for(const ghost of this.ghosts) if(ghost.img.visible){
  ghost.age+=e;
  const life=ghost.royalLight?${FX.lifetimeMs / 1000}:$y;
  if(ghost.age>=life)ghost.img.setVisible(false);
  else ghost.img.setAlpha(ghost.alpha*(ghost.royalLight?Math.pow(1-ghost.age/life,1.25):1-ghost.age/life));
}
if(this.trailLeft>0){
  this.trailLeft-=e;this.trailNext-=e;
  if(this.act?.move.id==="humano-avanco-luz")this.royalLightTrail=true;
  if(this.trailNext<=0&&this.body.visible&&(!this.royalLightTrail||(this.alive&&!this.dead&&this.stepDist>1&&this.act?.move.id==="humano-avanco-luz"&&this.act.t<=${FX.emissionUntilMs}))){
    this.trailNext=this.royalLightTrail?${FX.intervalMs / 1000}:Qy;
    if(this.royalLightTrail||Pl().trails)this.afterimage();
  }
}else this.royalLightTrail=false;
}afterimage(){
  const royal=this.royalLightTrail===true,body=window.__royalHD?.capture(this)??this.body;
  if(royal&&this.ghosts.filter(g=>g.royalLight&&g.img.visible).length>=${FX.maxVisible})return;
  let ghost=this.ghosts.find(g=>!g.img.visible);
  if(ghost)ghost.img.setTexture(body.texture.key,body.frame.name);
  else {ghost={img:this.root.scene.add.image(0,0,body.texture.key,body.frame.name),age:0,alpha:0};this.ghosts.push(ghost);}
  ghost.royalLight=royal;ghost.age=0;ghost.alpha=(royal?${FX.opacity}:.35)*this.pose.alpha;
  ghost.img.setTintMode(royal?Yh.MULTIPLY:Yh.FILL).setBlendMode(royal?Lh.NORMAL:Lh.ADD)
    .setPosition(this.x+body.x,this.y+body.y).setOrigin(body.originX,body.originY)
    .setScale(body.scaleX,body.scaleY).setAngle(body.angle).setFlipX(body.flipX)
    .setTint(this.trailColor).setAlpha(ghost.alpha).setDepth(this.root.depth-.5).setVisible(true);
  kv(ghost.img);
}`;
  return Buffer.from(
    code.slice(0, at) + replacement + code.slice(at + original.length),
  );
}
