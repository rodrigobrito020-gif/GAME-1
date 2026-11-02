// Local presentation only. Native action time already includes attack speed.
// No change to world position, collision, model scale or authoritative releases.
const zero = () => ({ x: 0, y: 0, angle: 0 });
const smooth = (p) => {
  p = Math.max(0, Math.min(1, p));
  return p * p * (3 - 2 * p);
};
function impulse(age, release, recovery = 140) {
  const t = age - release;
  if (t < 0 || t >= recovery) return 0;
  return t < 32 ? smooth(t / 32) : 1 - smooth((t - 32) / (recovery - 32));
}
export function rangedMotion(classId, move, age, row = 0) {
  if (!Number.isFinite(age) || age < 0) return zero();
  const [dx, dy] = [
    [0, 1],
    [-1, 0],
    [1, 0],
    [0, -1],
  ][row] ?? [0, 1];
  let weight = 0,
    lift = 0,
    tilt = 0;
  if (
    classId === "arqueira" &&
    ["elfa-flecha", "elfa-perfurante", "elfa-chuva"].includes(move)
  ) {
    const rain = move === "elfa-chuva",
      release = rain ? 350 : move === "elfa-perfurante" ? 300 : 250;
    const power = move === "elfa-perfurante" ? 1.25 : 1;
    // Draw tension into the rear foot, then release through the planted foot.
    const draw =
      age < release
        ? Math.sin(Math.PI * smooth(age / release)) * 0.2 +
          smooth(age / release)
        : 0;
    const settle = age >= release ? 1 - smooth((age - release) / 190) : 0;
    const kick = impulse(age, release, 180);
    weight = power * (-2.4 * (draw + settle) + 5.2 * kick);
    lift = -0.65 * kick;
    tilt = dx * (draw * -0.65 + kick * 1.4 - settle * 0.65);
  } else if (
    classId === "pistoleira" &&
    ["dark-elf-tiros", "dark-elf-disparo", "dark-elf-rajada"].includes(move)
  ) {
    const power = move === "dark-elf-disparo",
      sky = move === "dark-elf-rajada";
    const one = impulse(age, 150),
      two = power ? 0 : impulse(age, 350);
    const ready = age < 150 ? Math.sin((Math.PI * age) / 150) : 0;
    weight = 0.8 * ready - (power ? 4.6 : 3.2) * (one + two);
    lift = sky ? -0.8 * (one + two) : 0.45 * (one + two);
    tilt = -dx * (power ? 1.7 : 1.25) * (one + two);
  } else if (
    (classId === "arqueira" &&
      ["elfa-bencao", "elfa-espirito"].includes(move)) ||
    (classId === "pistoleira" &&
      ["dark-elf-instinto", "dark-elf-eclipse"].includes(move))
  ) {
    if (age >= 580) return zero();
    const p = Math.min(1, age / 580),
      breath = Math.sin(Math.PI * p) ** 2;
    lift = -1.1 * breath;
    tilt = dx * 0.6 * breath;
  } else return zero();
  return { x: dx * weight, y: dy * weight * 0.4 + lift, angle: tilt };
}

// Native rig normalization copies move records and retains their name.
export function nativeMoveName(actor) {
  const move = actor.act?.move;
  if (!move) return "";
  return (
    move.id ??
    move.name ??
    Object.entries(actor.doll?.rig.moves ?? {}).find(
      ([, value]) => value === move,
    )?.[0] ??
    ""
  );
}
