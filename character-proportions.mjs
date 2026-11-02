import { CHARACTER_ART as ART } from "./character-art.mjs";
// A character's model has one world size. Pose, action and camera pixel fitting
// must never squash or inflate the visible ranged-class body.
export function characterDisplayScale(classId, native) {
  if (classId === "berserker") return { x: 0.65, y: 0.65 };
  if (classId === "arqueira" || classId === "pistoleira") {
    const scale = ART.worldBodyHeight / ART.bodyHeight;
    return { x: scale, y: scale };
  }
  return {
    x: native.scaleX / ART.nativeSampleStep,
    y: native.scaleY / ART.nativeSampleStep,
  };
}
