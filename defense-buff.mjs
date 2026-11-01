// One authoritative, runtime-only registry per combat instance. Membership is
// supplied by the server, never by the useSkill request or a client target id.
export const LIGHT_AEGIS = Object.freeze({
  id: "egide-de-luz",
  name: "Égide de Luz",
  durationMs: 300000,
  defensePercent: 0.3,
  minimumBonus: 2,
  manaCost: 10,
  cooldownMs: 120000,
  castMs: 650,
  applyAtMs: 300,
});
export class TeamDefenseBuff {
  constructor({ now = Date.now } = {}) {
    this.now = now;
    this.active = new Map();
  }
  state(character) {
    const state = this.active.get(character);
    return state && state.until > this.now() ? state : null;
  }
  defense(character, base) {
    return (
      base +
      (this.state(character)
        ? Math.max(
            LIGHT_AEGIS.minimumBonus,
            Math.ceil(base * LIGHT_AEGIS.defensePercent),
          )
        : 0)
    );
  }
  apply(caster, members = []) {
    if (!caster.isAlive()) return [];
    const seen = new Set(),
      events = [];
    for (const member of [caster, ...members]) {
      if (
        seen.has(member.character) ||
        !["player", "companion"].includes(member.kind) ||
        !member.isAlive() ||
        !member.isPresent() ||
        member.instanceId !== caster.instanceId ||
        (member.character !== caster.character &&
          (!caster.partyId || member.partyId !== caster.partyId))
      )
        continue;
      seen.add(member.character);
      // Refresh the one effect; never add the previous bonus into the base DEF.
      const until = Math.max(
        this.active.get(member.character)?.until ?? 0,
        this.now() + LIGHT_AEGIS.durationMs,
      );
      this.active.set(member.character, { member, until });
      member.refresh();
      events.push({
        entity: member.entity,
        buffId: LIGHT_AEGIS.id,
        durationMs: until - this.now(),
        removed: false,
      });
    }
    return events;
  }
  remove(character) {
    const state = this.active.get(character);
    if (!state) return [];
    this.active.delete(character);
    state.member.refresh();
    return [
      {
        entity: state.member.entity,
        buffId: LIGHT_AEGIS.id,
        durationMs: 0,
        removed: true,
      },
    ];
  }
  expire() {
    const events = [];
    for (const [character, state] of this.active)
      if (
        state.until <= this.now() ||
        !state.member.isAlive() ||
        !state.member.isPresent()
      )
        events.push(...this.remove(character));
    return events;
  }
}
