// Shared melee opener: validate the entire swept corridor before reserving mana
// or cooldown. Movement and the hit remain authoritative in LocalFarm.step.
export function planMeleeAdvance(client, target, move, now, free = () => true) {
  const distance = Math.hypot(target.x - client.x, target.y - client.y);
  if (distance < move.minRange) throw Error("local.target_too_close");
  if (distance > move.range) throw Error("local.invalid_target");
  const travel = distance - move.stopDistance;
  const from = { x: client.x, y: client.y },
    to = {
      x: from.x + ((target.x - from.x) / distance) * travel,
      y: from.y + ((target.y - from.y) / distance) * travel,
    };
  const samples = Math.max(1, Math.ceil(travel / 4));
  for (let i = 0; i <= samples; i++)
    if (
      !free(
        from.x + ((to.x - from.x) * i) / samples,
        from.y + ((to.y - from.y) * i) / samples,
      )
    )
      throw Error("local.invalid_target");
  return {
    from,
    to,
    target: target.id,
    startsAt: now + move.start,
    endsAt: now + move.end,
    blocked: false,
  };
}
