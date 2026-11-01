export const MONSTER_ROLES = [
  {
    id: "guardiao",
    name: "Guardião da Coroa",
    role: "melee",
    tint: 0xd7bd86,
    displayHeight: 142,
  },
  {
    id: "arqueiro",
    name: "Sentinela Arqueira",
    role: "ranged",
    tint: 0x83c6a4,
    displayHeight: 130,
  },
  {
    id: "feiticeiro",
    name: "Feiticeiro das Ruínas",
    role: "mage",
    tint: 0xc19aed,
    displayHeight: 136,
  },
];
export function startMonsterSkill(m, client, now) {
  const role = m.role ?? "melee",
    distance = Math.hypot(m.x - client.x, m.y - client.y);
  if (
    !m.hp ||
    m.cast ||
    now < (m.nextSkill ?? Infinity) ||
    !m.aggro ||
    distance > (role === "melee" ? 120 : 330)
  )
    return null;
  const type =
    role === "melee" ? "cleave" : role === "ranged" ? "arrow" : "meteor";
  const windup = type === "cleave" ? 850 : type === "arrow" ? 700 : 1200;
  m.nextSkill = now + 6500 + (m.id % 3) * 700;
  m.cast = {
    id: `${m.id}:${now}`,
    caster: m.id,
    type,
    start: now,
    impact: now + windup + (type === "arrow" ? 450 : 0),
    release: now + windup,
    x: m.x,
    y: m.y,
    tx: client.x,
    ty: client.y,
    radius: type === "cleave" ? 105 : type === "meteor" ? 90 : 23,
  };
  m.nextAttack = now + windup + 650;
  return m.cast;
}
export function skillHits(cast, point) {
  if (cast.type !== "arrow")
    return Math.hypot(point.x - cast.tx, point.y - cast.ty) <= cast.radius;
  // An aimed projectile travels to the marked position, rather than following
  // the player after firing. Stepping/dashing away can avoid the impact.
  return Math.hypot(point.x - cast.tx, point.y - cast.ty) <= cast.radius + 12;
}
export function combatState(account, client, now) {
  return {
    combatMode: "auto",
    skillOrder: [...(account.character.automation.skillOrder ?? [])],
    skillOrderStrict: !!account.character.automation.skillOrderStrict,
    evadeCooldownMs: Math.max(0, (client.evadeReadyAt ?? 0) - now),
    monsterCasts: (client.hunt?.monsters ?? [])
      .filter((m) => m.hp > 0 && m.cast)
      .map((m) => ({
        ...m.cast,
        remainingMs: Math.max(0, m.cast.impact - now),
        windupMs: m.cast.release - m.cast.start,
        durationMs: m.cast.impact - m.cast.start,
      })),
  };
}
