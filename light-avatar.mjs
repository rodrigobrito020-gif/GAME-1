// First playable balance values; the resource/cooldown belong to the server.
export const LIGHT_AVATAR = Object.freeze({
  id: "avatar-da-luz",
  name: "Avatar da Luz",
  durationMs: 8000,
  cooldownMs: 45000,
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
  constructor(character, { now = Date.now } = {}) {
    this.now = now;
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
    this.saved.readyAt = this.now() + LIGHT_AVATAR.cooldownMs;
  }
  activate(entity) {
    this.until = this.now() + LIGHT_AVATAR.durationMs;
    return {
      entity,
      buffId: LIGHT_AVATAR.id,
      durationMs: LIGHT_AVATAR.durationMs,
      removed: false,
    };
  }
  clear(entity, death = false) {
    const hadBuff = this.until > 0;
    this.until = 0;
    if (death) this.saved.charge = 0;
    return hadBuff
      ? [{ entity, buffId: LIGHT_AVATAR.id, durationMs: 0, removed: true }]
      : [];
  }
  state(client) {
    return {
      version: 1,
      charge: this.saved.charge,
      maxCharge: 100,
      cooldownMs: Math.max(0, this.saved.readyAt - this.now()),
      activeMs: Math.max(0, this.until - this.now()),
      automatic: (this.character.automation.skillOrder ?? []).includes(
        LIGHT_AVATAR.id,
      ),
      queued: !!client.hunt?.avatarQueued,
      inHunt: !!client.hunt,
      alive: this.character.progress.hp > 0 && !client.hunt?.deadAt,
    };
  }
}
