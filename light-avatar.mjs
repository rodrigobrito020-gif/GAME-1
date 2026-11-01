// First playable balance values; the resource/cooldown belong to the server.
export const LIGHT_AVATAR = Object.freeze({
  id: "avatar-da-luz",
  name: "Avatar da Luz",
  durationMs: 45000,
  cooldownMs: 60000,
  maxCharge: 100,
  damageReduction: 0.35,
  cleaveRadius: 100,
  castMs: 600,
  applyAtMs: 300,
  hitCharge: 4,
  receivedCharge: 2,
  killCharge: 6,
});
export class LightAvatar {
  constructor(character, { now = Date.now, definition = LIGHT_AVATAR } = {}) {
    this.now = now;
    this.definition = definition;
    this.character = character;
    const saved = character.ultimate ?? {};
    this.saved = character.ultimate = {
      charge: Math.max(0, Math.min(100, Number(saved.charge) || 0)),
      readyAt: Math.max(0, Number(saved.readyAt) || 0),
    };
    this.until = 0;
  }
  active() {
    return this.until > this.now();
  }
  gain(amount) {
    if (!this.active())
      this.saved.charge = Math.min(100, this.saved.charge + amount);
  }
  reserve() {
    if (this.active()) throw Error("local.buff_active");
    if (this.saved.readyAt > this.now()) throw Error("local.cooldown");
    if (this.saved.charge < 100) throw Error("local.ultimate_energy");
    this.saved.charge = 0;
    this.saved.readyAt = this.now() + this.definition.cooldownMs;
  }
  activate(entity) {
    this.until = this.now() + this.definition.durationMs;
    return {
      entity,
      buffId: this.definition.id,
      durationMs: this.definition.durationMs,
      removed: false,
    };
  }
  clear(entity, death = false) {
    const hadBuff = this.until > 0;
    this.until = 0;
    if (death) this.saved.charge = 0;
    return hadBuff
      ? [{ entity, buffId: this.definition.id, durationMs: 0, removed: true }]
      : [];
  }
  state(client) {
    return {
      version: 1,
      ultimateSkillId: this.definition.id,
      ultimateName: this.definition.name,
      charge: this.saved.charge,
      maxCharge: 100,
      durationMs: this.definition.durationMs,
      cooldownMs: Math.max(0, this.saved.readyAt - this.now()),
      activeMs: Math.max(0, this.until - this.now()),
      automatic: (this.character.automation.skillOrder ?? []).includes(
        this.definition.id,
      ),
      queued: !!client.hunt?.avatarQueued,
      inHunt: !!client.hunt,
      alive: this.character.progress.hp > 0 && !client.hunt?.deadAt,
    };
  }
}
