// Geometry moves through the effect rather than scaling a single painted stamp.
export function rainField(g, fx, age, alpha, gun = false) {
  const color = gun ? 0xa970ff : 0x77b75f,
    light = gun ? 0xffce99 : 0xe8ffc0;
  for (let arc = 0; arc < 5; arc++) {
    const start = arc * Math.PI * 0.4 + age / 900,
      rx = fx.radius * 0.96;
    g.lineStyle(1.4, color, alpha * 0.65).beginPath();
    for (let j = 0; j <= 10; j++) {
      const a = start + j * 0.065,
        x = fx.x + Math.cos(a) * rx,
        y = fx.y + Math.sin(a) * rx * 0.7;
      if (j === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.strokePath();
  }
  for (let i = 0; i < 16; i++) {
    const phase = (age / 750 + i / 16) % 1,
      a = i * 2.399963 + age / 1900;
    const r = fx.radius * (0.95 - phase * 0.3),
      x = fx.x + Math.cos(a) * r,
      y = fx.y + Math.sin(a) * r * 0.7;
    g.lineStyle(
      1.4,
      i % 3 ? color : light,
      alpha * Math.sin(phase * Math.PI) * 0.75,
    );
    g.lineBetween(x, y, x - Math.sin(a) * 6, y + Math.cos(a) * 4);
  }
}
export function fallingTrail(g, point, alpha, gun = false) {
  const length = 22 + point.p * (gun ? 46 : 35);
  g.lineStyle(gun ? 3 : 2.5, gun ? 0x9e63d5 : 0x669c62, alpha * 0.28);
  g.lineBetween(point.x, point.y - length, point.x, point.y - 4);
  g.lineStyle(1.2, gun ? 0xffd59e : 0xf4f7c3, alpha * 0.9);
  g.lineBetween(point.x, point.y - length * 0.65, point.x, point.y - 4);
}
export function activationMotes(g, x, y, age, gun = false) {
  const p = age / 650;
  if (p < 0 || p >= 1) return;
  for (let i = 0; i < 16; i++) {
    const a = i * 2.399963 + p * 2.8,
      r = 34 * (1 - p) + 5;
    const px = x + Math.cos(a) * r,
      py = y - 14 - i * 4 - p * 28;
    const alpha = Math.sin(p * Math.PI) * 0.85;
    g.lineStyle(
      i % 3 ? 1.4 : 2,
      i % 3 ? (gun ? 0xd8aeff : 0xbcf69e) : 0xffe8ba,
      alpha,
    );
    g.lineBetween(px, py, px - Math.cos(a + 0.7) * 5, py + 7);
  }
}
export function flameWisps(
  g,
  x,
  y,
  age,
  alpha = 1,
  direction = 0,
  projectile = false,
) {
  for (let i = 0; i < (projectile ? 8 : 10); i++) {
    const p = (age / (projectile ? 230 : 470) + i / 10) % 1;
    const side =
      Math.sin(i * 2.4 + p * 4) * (projectile ? 8 : 13) * (1 - p * 0.5);
    const distance = p * (projectile ? 66 : 48),
      dx = projectile
        ? -Math.cos(direction) * distance - Math.sin(direction) * side
        : side;
    const dy = projectile
      ? -Math.sin(direction) * distance + Math.cos(direction) * side
      : -distance;
    const fade = alpha * Math.sin(p * Math.PI);
    g.lineStyle(3.2 * (1 - p) + 0.5, i % 3 ? 0xd397f2 : 0xffb95b, fade * 0.7);
    g.lineBetween(
      x + dx,
      y + dy,
      x + dx + (projectile ? Math.cos(direction) * 7 : -side * 0.2),
      y + dy + (projectile ? Math.sin(direction) * 7 : 7),
    );
    g.fillStyle(0xffedc5, fade * 0.85).fillCircle(
      x + dx,
      y + dy,
      (1 - p) * 1.5 + 0.3,
    );
  }
}
