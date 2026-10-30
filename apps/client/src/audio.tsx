import { useEffect, useRef, useState } from "react";
import type { Snapshot } from "@idle/shared";
import { useReference } from "./reference";

// Local media only. Eight voices maximum, no catch-up burst after reconnecting.
export function ReferenceAudio({ snapshot }: { snapshot: Snapshot | null }) {
  const pack = useReference();
  const [enabled, setEnabled] = useState(
    () => localStorage.getItem("idle-sound") === "on",
  );
  const [unlocked, setUnlocked] = useState(false);
  const [volume, setVolume] = useState(() => {
    const saved = Number(localStorage.getItem("idle-volume") ?? "0.35");
    return Number.isFinite(saved) ? Math.max(0, Math.min(1, saved)) : 0.35;
  });
  const voices = useRef<HTMLAudioElement[]>([]);
  const music = useRef<HTMLAudioElement | null>(null);
  const history = useRef({ map: "", sequence: 0, x: 0, y: 0, step: 0 });
  const controls = useRef({ enabled, volume, unlocked });
  controls.current = { enabled, volume, unlocked };
  useEffect(() => {
    const unlock = () => setUnlocked(true);
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);
  useEffect(() => {
    const track = pack?.audio["praca-de-seul"];
    if (!track) return;
    const element = new Audio(track);
    element.loop = true;
    element.preload = "none";
    music.current = element;
    const visibility = () => {
      if (document.hidden) {
        element.pause();
        voices.current.forEach((voice) => voice.pause());
      } else if (
        controls.current.enabled &&
        controls.current.unlocked &&
        history.current.map === "city"
      ) {
        element.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      element.pause();
      element.removeAttribute("src");
      element.load();
      voices.current.forEach((voice) => {
        voice.pause();
        voice.removeAttribute("src");
        voice.load();
      });
      voices.current = [];
      music.current = null;
    };
  }, [pack]);
  useEffect(() => {
    localStorage.setItem("idle-sound", enabled ? "on" : "off");
    localStorage.setItem("idle-volume", String(volume));
    const element = music.current;
    if (element) {
      element.volume = Math.min(1, Math.max(0, volume * 0.45));
      if (enabled && unlocked && snapshot?.map === "city" && !document.hidden)
        element.play().catch(() => {});
      else element.pause();
    }
    if (!enabled) voices.current.forEach((voice) => voice.pause());
  }, [enabled, unlocked, volume, snapshot?.map, pack]);
  useEffect(() => {
    if (!snapshot) return;
    const previous = history.current;
    const last = Math.max(0, ...snapshot.vfx.map((event) => event.id));
    const reset = previous.map !== snapshot.map;
    const play = (key: string) => {
      if (!enabled || !unlocked || document.hidden || !pack?.audio[key]) return;
      let voice = voices.current.find((item) => item.paused || item.ended);
      if (!voice && voices.current.length < 8) {
        voice = new Audio();
        voices.current.push(voice);
      }
      if (!voice) return;
      voice.src = pack.audio[key];
      voice.volume = Math.min(1, Math.max(0, volume));
      voice.play().catch(() => {});
    };
    if (!reset) {
      const distance = Math.hypot(
        snapshot.actor.x - previous.x,
        snapshot.actor.y - previous.y,
      );
      previous.step += distance;
      if (previous.step > 40 && distance < 100 && snapshot.actor.hp > 0) {
        previous.step = 0;
        play(`caminhada-0${1 + (Math.floor(snapshot.serverTime / 100) % 3)}`);
      }
      const event = snapshot.vfx
        .filter(
          (event) =>
            event.id > previous.sequence &&
            (event.from === snapshot.self.id || event.to === snapshot.self.id),
        )
        .at(-1);
      if (event) {
        const key =
          event.kind === "magic"
            ? "impacto-magico-1"
            : event.kind === "arrow"
              ? "disparo-arco-1"
              : event.kind === "heal"
                ? ""
                : "impacto-corte";
        if (key) play(key);
      }
    }
    history.current = {
      map: snapshot.map,
      sequence: last,
      x: snapshot.actor.x,
      y: snapshot.actor.y,
      step: reset ? 0 : previous.step,
    };
  }, [snapshot, enabled, unlocked, volume, pack]);
  if (!snapshot || !pack) return null;
  return (
    <div className="audio-controls" aria-label="Áudio do jogo">
      <button
        aria-pressed={enabled}
        onClick={() => {
          setUnlocked(true);
          setEnabled(!enabled);
        }}
      >
        {enabled ? "♫ Som ligado" : "♫ Ativar som"}
      </button>
      <input
        aria-label="Volume do jogo"
        title="Volume do jogo"
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
      />
    </div>
  );
}
