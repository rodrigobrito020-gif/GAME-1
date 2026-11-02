const TAU = Math.PI * 2;
const ROW_BY_OCTANT = [2, 4, 0, 5, 1, 7, 3, 6];
const ANGLE_BY_ROW = [
  Math.PI / 2,
  Math.PI,
  0,
  -Math.PI / 2,
  Math.PI / 4,
  (Math.PI * 3) / 4,
  -Math.PI / 4,
  (-Math.PI * 3) / 4,
];
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
export function direction8(dx, dy) {
  return ROW_BY_OCTANT[
    ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8
  ];
}
// Presentation only: velocity/aim select authored whole figures. The turn is
// time based and retains the current step; no image blending, limb assembly,
// world-space prediction, body resizing or change to combat release times.
export function warriorPresentation(state, pose, sample) {
  const {
    x,
    y,
    now,
    action,
    move = "",
    age = 0,
    aim = null,
    dead = false,
    cycle = 0,
    travel = null,
  } = sample;
  const elapsed = state.now === undefined ? 0 : Math.max(0, now - state.now),
    dt = Math.min(80, elapsed);
  const dx = state.x === undefined ? 0 : x - state.x,
    dy = state.y === undefined ? 0 : y - state.y;
  const distance = Math.hypot(dx, dy),
    teleport = distance > 150;
  state.x = x;
  state.y = y;
  state.now = now;
  if (state.angle === undefined || teleport) {
    state.angle = ANGLE_BY_ROW[pose.row] ?? 0;
    state.row =
      Number.isInteger(pose.row) && pose.row >= 0 && pose.row < 8
        ? pose.row
        : 0;
    state.target = state.angle;
    state.action = null;
  }
  const dodge = move === "humano-esquiva";
  if (
    action &&
    action !== state.action &&
    !dodge &&
    aim &&
    Math.hypot(aim.x - x, aim.y - y) > 2
  ) {
    state.target = Math.atan2(aim.y - y, aim.x - x);
    state.action = action;
  } else if (!dead && travel && (!action || dodge)) {
    // In locally controlled scenes use the same input vector as the native
    // predictor. Its reconciliation displacement is not a new walking order.
    if (Math.hypot(travel.x, travel.y) > 0.001)
      state.target = Math.atan2(travel.y, travel.x);
  } else if (
    !dead &&
    !teleport &&
    distance > Math.max(0.03, elapsed * 0.02) &&
    (!action || dodge)
  ) {
    // Interpolation can make tiny corrections after key release. Only actual
    // travel above 20 world units/s may change the facing, not a settling pixel.
    state.target = Math.atan2(dy, dx);
  }
  if (!action) state.action = null;
  if (!dead) {
    const delta = wrap(state.target - state.angle),
      step = dt * 0.025;
    state.angle += Math.max(-step, Math.min(step, delta));
    const row = direction8(Math.cos(state.angle), Math.sin(state.angle));
    // A small angular dead band avoids rapid flips near a diagonal boundary.
    if (
      row !== state.row &&
      Math.abs(wrap(state.angle - ANGLE_BY_ROW[state.row])) >
        Math.PI / 8 + 0.035
    )
      state.row = row;
  }
  let col = pose.col;
  if (
    state.row >= 4 &&
    pose.sheet === "weapon" &&
    [
      "humano-espada",
      "humano-retorno",
      "humano-espada-avatar",
      "humano-retorno-avatar",
    ].includes(move)
  )
    col = age < 200 ? Math.min(3, Math.floor(age / 50)) : age < 300 ? 4 : 5;
  const walking = !action && !dead && ["walk", "run1"].includes(pose.sheet);
  const angle =
    action || dead
      ? 0
      : walking
        ? Math.cos(state.angle) * 0.55 + Math.sin(cycle * TAU) * 0.38
        : Math.sin(now / 1700) * 0.16;
  return {
    pose: { ...pose, row: state.row, col },
    motion: { x: 0, y: 0, angle },
  };
}
