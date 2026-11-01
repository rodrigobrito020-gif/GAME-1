// Shared display contract. The canvas includes weapon/jump headroom; body scale
// is identical for both classes and all animations, independent of that padding.
export const CHARACTER_ART = Object.freeze({
  frame: 384,
  feet: [192, 352],
  bodyHeight: 224,
  worldBodyHeight: 112,
  nativeFrame: 64,
  nativeFeet: [32, 60],
  nativeSampleStep: 4,
  walkFrames: 8,
  walkStride: 120,
});
