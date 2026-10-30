import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Phaser from "phaser";
import { io, Socket } from "socket.io-client";
import {
  CITY,
  HUNTS,
  BOSSES,
  PROFESSIONS,
  RACES,
  WEAPONS,
  GRADES,
  RARITIES,
  BALANCE,
  canEnter,
  professionName,
  xpRequired,
  THIRD_PARTY_SKILLS_PENDING,
} from "@idle/shared";
import type { Command, Item, Race, Snapshot, Weapon } from "@idle/shared";
import { World } from "./world";
import { portraitFor } from "./art";
import { Icon } from "./icons";
import "./style.css";
import "./visual.css";
const money = (n: number) => Math.floor(n).toLocaleString("pt-BR");
function ItemArt({ item }: { item: Item }) {
  return (
    <span
      className={`item-art rarity-${RARITIES.indexOf(item.rarity ?? "Comum")}`}
      aria-hidden
    >
      <Icon
        name={
          item.kind === "potion"
            ? item.potion!
            : item.kind === "material"
              ? "material"
              : (item.weapon ?? item.slot ?? "bag")
        }
        color={
          item.potion === "hp"
            ? "#bd5363"
            : item.potion === "mp"
              ? "#597dc9"
              : "#ae9bdd"
        }
      />
    </span>
  );
}
function GameWorld({
  snapshot,
  send,
  open,
}: {
  snapshot: Snapshot;
  send: (c: Command) => void;
  open: (name: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    scene = useRef<World | null>(null);
  useEffect(() => {
    const world = new World(send, (name) =>
      open(name === "portal" ? "hunts" : name),
    );
    scene.current = world;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host.current!,
      width: innerWidth,
      height: innerHeight,
      pixelArt: true,
      roundPixels: true,
      backgroundColor: "#232a3b",
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: world,
      audio: { noAudio: true },
    });
    return () => {
      scene.current = null;
      game.destroy(true);
    };
  }, [send, open]);
  useEffect(() => {
    scene.current?.setSnapshot(snapshot);
  }, [snapshot]);
  return <div id="game-world" ref={host} aria-label="Mundo 2D navegável" />;
}
function App() {
  const [token, setToken] = useState(
      () => localStorage.getItem("idle-token") ?? "",
    ),
    [snap, setSnap] = useState<Snapshot | null>(null),
    [panel, setPanel] = useState<string | null>(null),
    [notice, setNotice] = useState(""),
    [connected, setConnected] = useState(false),
    [race, setRace] = useState<Race>("human"),
    [mode, setMode] = useState<"register" | "login">("register"),
    [selected, setSelected] = useState<Item | null>(null),
    [busy, setBusy] = useState(false),
    [devProfession, setDevProfession] = useState("warrior");
  const socket = useRef<Socket | null>(null),
    latest = useRef(snap),
    noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  latest.current = snap;
  const tell = useCallback((text: string) => {
    setNotice(text);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 5500);
  }, []);
  const send = useCallback((command: Command) => {
    socket.current?.emit("command", command);
  }, []);
  const open = useCallback((name: string) => setPanel(name), []);
  useEffect(() => {
    if (!token) return;
    const client = io({
      auth: { token },
      transports: ["websocket", "polling"],
    });
    socket.current = client;
    client.on("connect", () => setConnected(true));
    client.on("disconnect", () => setConnected(false));
    client.on("snapshot", (state: Snapshot) => setSnap(state));
    client.on("notice", (n) => tell(n.error ?? n.message));
    client.on("connect_error", (e) => tell(e.message));
    return () => {
      client.disconnect();
      socket.current = null;
    };
  }, [token, tell]);
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (
        ["INPUT", "SELECT", "TEXTAREA"].includes(
          document.activeElement?.tagName ?? "",
        ) ||
        e.ctrlKey ||
        e.altKey ||
        e.metaKey
      )
        return;
      const s = latest.current;
      if (!s) return;
      if (["1", "2", "3", "4"].includes(e.key))
        send({ type: "skill", slot: Number(e.key) - 1 });
      if (e.key.toLowerCase() === "f")
        send({ type: "farm", enabled: !s.autoFarm });
      if (e.key.toLowerCase() === "i")
        setPanel((p) => (p === "inventory" ? null : "inventory"));
      if (e.key === "Escape") setPanel(null);
      if (e.key.toLowerCase() === "e" && s.map === "city") {
        const nearest = CITY.npcs.find(
          (n) => Math.hypot(n.x - s.actor.x, n.y - s.actor.y) < 110,
        );
        if (nearest) setPanel(nearest.id === "portal" ? "hunts" : nearest.id);
        else tell("Aproxime-se de um NPC ou clique nele.");
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [send, tell]);
  async function authenticate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const response = await fetch(`/api/${mode}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }),
        value = await response.json();
      if (!response.ok) throw Error(value.error);
      localStorage.setItem("idle-token", value.token);
      setToken(value.token);
    } catch (error) {
      tell(error instanceof Error ? error.message : "Servidor indisponível.");
    } finally {
      setBusy(false);
    }
  }
  const logout = () => {
    localStorage.removeItem("idle-token");
    setToken("");
    setSnap(null);
    setPanel(null);
  };
  if (!token || !snap)
    return (
      <main className="entry">
        <div className="entry-art">
          <div className="sun-orb" />
          <div className="castle">
            <i />
            <i />
            <i />
          </div>
          <div className="entry-mountains" />
          <div className="entry-label">UM REFÚGIO. INÚMERAS JORNADAS.</div>
        </div>
        <section className="login">
          <div className="eyebrow">PRIMEIRO MARCO JOGÁVEL · 0.1</div>
          <h1>
            LINEAGE<span>2D IDLE</span>
          </h1>
          <p>
            Encontre seu grupo na cidade. Explore hunts, domine suas habilidades
            e conquiste seu equipamento.
          </p>
          <div className="login-tabs">
            <button
              className={mode === "register" ? "active" : ""}
              onClick={() => setMode("register")}
            >
              Criar personagem
            </button>
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => setMode("login")}
            >
              Continuar jornada
            </button>
          </div>
          {token ? (
            <div>
              <p>Conectando ao servidor…</p>
              <button onClick={logout}>Voltar à entrada</button>
            </div>
          ) : (
            <form onSubmit={authenticate}>
              <label>
                Nome do personagem
                <input
                  name="name"
                  required
                  minLength={3}
                  maxLength={20}
                  autoComplete="username"
                  placeholder="Seu nome em Aden"
                />
              </label>
              <label>
                Senha
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  maxLength={100}
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                  placeholder="Pelo menos 6 caracteres"
                />
              </label>
              {mode === "register" && (
                <div className="form-row">
                  <label>
                    Raça
                    <select
                      name="race"
                      value={race}
                      onChange={(e) => setRace(e.target.value as Race)}
                    >
                      {Object.entries(RACES).map(([id, r]) => (
                        <option key={id} value={id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Classe inicial
                    <select key={race} name="archetype">
                      {RACES[race].archetypes.map((a) => (
                        <option key={a} value={a}>
                          {a === "fighter" ? "Fighter" : "Mystic"}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
              <button className="primary wide" disabled={busy}>
                {busy
                  ? "Entrando…"
                  : mode === "register"
                    ? "Começar jornada →"
                    : "Entrar na cidade →"}
              </button>
            </form>
          )}
          <small>
            Arte original de teste · Mundo persistido neste servidor
            <br />
            Balanceamento provisório, sem recursos pagos.
          </small>
        </section>
        {notice && (
          <div className="toast" role="alert">
            {notice}
          </div>
        )}
      </main>
    );
  const self = snap.self,
    stats = snap.stats,
    city = snap.map === "city",
    target = snap.actors.find((a) => a.id === snap.actor.targetId),
    levelProgress = (self.xp / xpRequired(self.level)) * 100;
  const near = (id: string) => {
    const npc = CITY.npcs.find((n) => n.id === id)!;
    return (
      city && Math.hypot(npc.x - snap.actor.x, npc.y - snap.actor.y) <= 105
    );
  };
  const gotoNpc = (id: string) => {
    const npc = CITY.npcs.find((n) => n.id === id)!;
    send({ type: "move", x: npc.x - 32, y: npc.y + 38 });
  };
  const npcPanel =
    panel === "hunts"
      ? "portal"
      : panel === "forge"
        ? "forge"
        : panel === "shop"
          ? "shop"
          : panel === "class"
            ? "class"
            : null;
  const selectItem = (item: Item) => {
    setSelected(item);
  };
  return (
    <main className="play">
      <GameWorld snapshot={snap} send={send} open={open} />
      <header className="topbar">
        <div className="brand">
          L
          <span>
            LINEAGE <b>2D IDLE</b>
          </span>
        </div>
        <div className="location">
          <span>{city ? "ÁREA SEGURA" : "INSTÂNCIA DE CAÇA"}</span>
          <b>{city ? "Refúgio de Aden" : snap.hunt?.name}</b>
        </div>
        <div className="top-actions">
          <span className={connected ? "online" : "offline"}>
            {connected ? "● Conectado" : "● Reconectando"}
          </span>
          <button onClick={() => setPanel("settings")} title="Configurações">
            ⚙
          </button>
          <button onClick={logout}>Sair</button>
        </div>
      </header>
      <section className="player-hud surface">
        <div className="player-title">
          <span className="portrait">
            <img src={portraitFor(self.race, self.archetype)} alt="" />
          </span>
          <div>
            <b>{self.name}</b>
            <small>
              {RACES[self.race].name} · {professionName(self)}
            </small>
          </div>
          <strong>
            {self.level}
            <small>NÍVEL</small>
          </strong>
        </div>
        <div className="meter hp">
          <i style={{ width: `${(snap.actor.hp / stats.maxHp) * 100}%` }} />
          <span>
            HP {Math.ceil(snap.actor.hp)} / {stats.maxHp}
          </span>
        </div>
        <div className="meter mp">
          <i style={{ width: `${(self.mp / stats.maxMp) * 100}%` }} />
          <span>
            MP {Math.floor(self.mp)} / {stats.maxMp}
          </span>
        </div>
        <div className="meter xp">
          <i style={{ width: `${levelProgress}%` }} />
          <span>
            {self.xp.toFixed(0)} / {money(xpRequired(self.level))} EXP
          </span>
        </div>
        <div className="currency">
          ◈ <b>{money(self.adena)}</b> <span>ADENA</span>
        </div>
      </section>
      {target && target.hp > 0 && (
        <section className="target surface">
          <small>ALVO SELECIONADO</small>
          <b>{target.name}</b>
          <div className="meter hp">
            <i style={{ width: `${(target.hp / target.maxHp) * 100}%` }} />
            <span>
              {Math.ceil(target.hp)} / {target.maxHp}
            </span>
          </div>
        </section>
      )}
      <nav className="side-menu" aria-label="Painéis do jogo">
        {[
          ["inventory", "▦", "Mochila [I]"],
          ["character", "♜", "Personagem"],
          ["hunts", "⌁", "Hunts"],
          ["party", "♟", "Party"],
          ["forge", "⚒", "Forja"],
          ["shop", "◈", "Mercador"],
          ["class", "✦", "Profissões"],
        ].map(([id, _icon, name]) => (
          <button
            key={id}
            aria-label={name}
            title={name}
            className={panel === id ? "menu-active" : ""}
            onClick={() => setPanel(panel === id ? null : id)}
          >
            <span>
              <Icon name={id === "inventory" ? "bag" : id} />
            </span>
            <span className="menu-label">{name.replace(" [I]", "")}</span>
          </button>
        ))}
        {snap.dev && (
          <button className="dev-button" onClick={() => setPanel("dev")}>
            DEV · Testar conteúdo
          </button>
        )}
      </nav>
      <aside className="party-hud surface">
        {!city &&
          snap.hunt &&
          BOSSES.filter(
            (b) => b.level === snap.hunt!.max && self.level >= b.level,
          ).map((b) => (
            <button
              key={b.level}
              disabled={snap.actors.some((a) => a.boss)}
              onClick={() => send({ type: "boss", level: b.level })}
            >
              Desafiar {b.name} · teste
            </button>
          ))}
        <small>{snap.party ? "PARTY" : "AVENTURA SOLO"}</small>
        {snap.party ? (
          snap.party.members.map((id) => {
            const member = snap.online.find((m) => m.id === id);
            return (
              <div key={id}>
                {id === snap.party?.leaderId ? "♛" : "◆"}{" "}
                {member?.name ?? "Desconectado"}{" "}
                <span>Nv. {member?.level}</span>
              </div>
            );
          })
        ) : (
          <p>
            Encontre aliados na cidade.
            <br />
            Até 5 personagens por grupo.
          </p>
        )}
        {snap.invites.map((i) => (
          <button
            key={i.partyId}
            className="primary"
            onClick={() => send({ type: "party.accept", id: i.partyId })}
          >
            Aceitar convite de {i.leader}
          </button>
        ))}
      </aside>
      <aside className="journal surface">
        <div className="journal-title">
          <b>REGISTRO DA JORNADA</b>
          <span>{city ? "Chat da cidade" : "Combate & drops"}</span>
        </div>
        <div className="log-lines" aria-live="off">
          {snap.logs.slice(-9).map((l) => (
            <div key={l.id} className={l.kind}>
              {l.text}
            </div>
          ))}
        </div>
        {city && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem(
                "text",
              ) as HTMLInputElement;
              send({ type: "chat", text: input.value });
              input.value = "";
            }}
          >
            <input
              name="text"
              maxLength={180}
              placeholder="Conversar com a cidade…"
              aria-label="Mensagem da cidade"
            />
            <button>↵</button>
          </form>
        )}
      </aside>
      <footer className="action-area">
        <div className="travel-hint">
          {city
            ? "WASD / clique para andar · E conversar · Scroll aproximar"
            : `${money((snap.metrics.exp / snap.metrics.seconds) * 3600)} EXP/h · ${money((snap.metrics.loot / snap.metrics.seconds) * 3600)} itens/h · métricas da sessão`}
        </div>
        <div className="action-row">
          <button
            className="potion hp-potion"
            onClick={() => send({ type: "potion", kind: "hp" })}
            title="Consumir poção de HP"
          >
            <Icon name="hp" color="#c5576e" />
            <small>
              {self.inventory
                .filter((i) => i.potion === "hp")
                .reduce((a, b) => a + b.quantity, 0)}
            </small>
          </button>
          <div className="skills">
            {snap.skills.map((skill, i) => (
              <div className="skill-wrap" key={skill.id}>
                <button
                  className={`skill skill-${i}`}
                  data-skill={i}
                  title={`${skill.name} · ${skill.mp} MP · ${skill.cd / 1000}s${skill.pending ? " · Kit anterior PROVISÓRIO 150+" : ""}`}
                  onClick={() => send({ type: "skill", slot: i })}
                  disabled={
                    city ||
                    skill.effect === "pending" ||
                    snap.cooldowns[i] > 0 ||
                    self.mp < skill.mp
                  }
                >
                  <span className="skill-glyph">
                    <Icon
                      name={
                        skill.effect === "strike"
                          ? (snap.actor.weapon ?? "strike")
                          : skill.effect
                      }
                      color={
                        self.archetype === "mystic" ? "#b2a5e2" : "#deb77c"
                      }
                    />
                  </span>
                  <kbd>{i + 1}</kbd>
                  {snap.cooldowns[i] > 0 && (
                    <span className="cooldown">
                      {(snap.cooldowns[i] / 1000).toFixed(1)}
                    </span>
                  )}
                </button>
                <small>
                  {skill.name}
                  {skill.pending ? " *" : ""}
                </small>
                <label className="auto-skill">
                  <input
                    type="checkbox"
                    checked={snap.autoSkills[i]}
                    onChange={(e) =>
                      send({
                        type: "autoSkill",
                        slot: i,
                        enabled: e.target.checked,
                      })
                    }
                  />{" "}
                  Auto
                </label>
              </div>
            ))}
          </div>
          <button
            className="potion mp-potion"
            onClick={() => send({ type: "potion", kind: "mp" })}
            title="Consumir poção de MP"
          >
            <Icon name="mp" color="#638fda" />
            <small>
              {self.inventory
                .filter((i) => i.potion === "mp")
                .reduce((a, b) => a + b.quantity, 0)}
            </small>
          </button>
          <div className="farm-buttons">
            <button
              className={snap.autoFarm ? "primary farming" : ""}
              disabled={city}
              data-testid="farm-toggle"
              onClick={() => send({ type: "farm", enabled: !snap.autoFarm })}
            >
              {snap.autoFarm ? "❚❚ Pausar farm" : "▶ Auto Farm"} <kbd>F</kbd>
            </button>
            {!city && (
              <button
                onClick={() => {
                  send({ type: "return" });
                  setPanel(null);
                }}
              >
                Retornar à cidade
              </button>
            )}
          </div>
        </div>
        <small className="build-note">
          {snap.dev ? "DEMONSTRAÇÃO LOCAL · " : ""}Balanceamento e conteúdo não
          definido: provisórios{" "}
          {self.level >= 150
            ? "· * Kit anterior mantido para teste; talentos aguardam aprovação"
            : ""}
        </small>
      </footer>
      {panel && (
        <div
          className="panel-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPanel(null);
          }}
        >
          <section
            className={`panel surface panel-${panel}`}
            role="dialog"
            aria-modal="true"
            aria-label={panel}
          >
            <header>
              <div>
                <small>REFÚGIO DE ADEN</small>
                <h2>
                  {
                    {
                      inventory: "Inventário & equipamentos",
                      character: "Seu personagem",
                      hunts: "Escolha sua hunt",
                      party: "Sua Party",
                      forge: "Forja universal",
                      shop: "Mercador da cidade",
                      class: "Caminho de profissão",
                      settings: "Configurações",
                      dev: "Laboratório de desenvolvimento",
                    }[panel]
                  }
                </h2>
              </div>
              <button onClick={() => setPanel(null)} aria-label="Fechar painel">
                ×
              </button>
            </header>
            {npcPanel && !near(npcPanel) && (
              <div className="npc-distance">
                <span>
                  {city
                    ? "Aproxime-se do NPC para realizar ações."
                    : "Retorne à cidade para usar este serviço."}
                </span>
                {city && (
                  <button onClick={() => gotoNpc(npcPanel)}>
                    Caminhar até o NPC →
                  </button>
                )}
              </div>
            )}
            {panel === "inventory" && (
              <div className="inventory-layout">
                <div>
                  <h3>Equipado</h3>
                  <div className="equipment">
                    {[
                      "weapon",
                      "shield",
                      "helmet",
                      "chest",
                      "legs",
                      "gloves",
                      "boots",
                      "ring",
                      "necklace",
                    ].map((slot) => {
                      const item =
                        self.equipment[slot as keyof typeof self.equipment];
                      return (
                        <button
                          key={slot}
                          className="equipped-slot"
                          onClick={() => item && selectItem(item)}
                        >
                          {item ? <ItemArt item={item} /> : <span>◇</span>}
                          <small>
                            {
                              {
                                weapon: "Arma",
                                shield: "Escudo",
                                helmet: "Cabeça",
                                chest: "Peito",
                                legs: "Calças",
                                gloves: "Luvas",
                                boots: "Botas",
                                ring: "Anel",
                                necklace: "Colar",
                              }[slot]
                            }
                          </small>
                        </button>
                      );
                    })}
                  </div>
                  <p className="muted">
                    A arma e o peitoral mudam a aparência no mundo. Equipar é
                    permitido na cidade.
                  </p>
                </div>
                <div>
                  <h3>
                    Mochila{" "}
                    <span>
                      {self.inventory.length} / {BALANCE.inventoryLimit}
                    </span>
                  </h3>
                  <div className="bag-grid">
                    {self.inventory.map((item) => (
                      <button
                        className={`item-cell ${selected?.id === item.id ? "selected" : ""}`}
                        key={item.id}
                        title={`${item.name} · ${item.rarity ?? ""}`}
                        onClick={() => selectItem(item)}
                        onDoubleClick={() =>
                          item.kind === "equipment" &&
                          send({ type: "equip", id: item.id })
                        }
                      >
                        <ItemArt item={item} />
                        {item.quantity > 1 && <small>×{item.quantity}</small>}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="item-detail">
                  {selected ? (
                    <>
                      <ItemArt item={selected} />
                      <h3>{selected.name}</h3>
                      <p>
                        {selected.grade === "NG" ? "No Grade" : selected.grade}{" "}
                        · {selected.rarity ?? selected.kind}
                      </p>
                      <p>
                        {selected.grade
                          ? `Requer nível ${GRADES[selected.grade]}`
                          : ""}
                      </p>
                      {selected.kind === "equipment" && (
                        <>
                          <p>
                            Linha de ataque de teste: +{selected.bonus ?? 0}
                          </p>
                          {self.inventory.some((i) => i.id === selected.id) ? (
                            <button
                              className="primary wide"
                              disabled={!city}
                              onClick={() =>
                                send({ type: "equip", id: selected.id })
                              }
                            >
                              Equipar
                            </button>
                          ) : (
                            <button
                              className="wide"
                              disabled={!city}
                              onClick={() =>
                                send({ type: "unequip", slot: selected.slot })
                              }
                            >
                              Retirar para mochila
                            </button>
                          )}
                        </>
                      )}
                      <small>
                        Duplo clique em equipamento da mochila também equipa.
                      </small>
                    </>
                  ) : (
                    <p>Selecione um item para ver os detalhes.</p>
                  )}
                </div>
              </div>
            )}
            {panel === "character" && (
              <>
                <div className="stat-grid">
                  {Object.entries({
                    Nível: self.level,
                    EXP: self.xp.toFixed(0),
                    SP: self.sp,
                    Ataque: stats.attack.toFixed(0),
                    "Defesa física": stats.defense.toFixed(0),
                    "Defesa mágica": stats.mdef.toFixed(0),
                    "Precisão física": stats.accuracy,
                    "Precisão mágica": stats.magicAccuracy,
                    Esquiva: stats.evasion.toFixed(0),
                    "Poder recomendado": stats.power,
                  }).map(([k, v]) => (
                    <div key={k}>
                      <small>{k}</small>
                      <b>{v}</b>
                    </div>
                  ))}
                </div>
                <h3>Árvore de talentos</h3>
                <p>
                  {self.level < 150
                    ? "Bloqueada até o nível 150. Não existem passivas ou talentos antes desse nível."
                    : "Desbloqueio por nível atingido. Efeitos e escolhas aguardam aprovação; nenhuma passiva inventada foi aplicada."}
                </p>
                <p className="approval">{THIRD_PARTY_SKILLS_PENDING}</p>
              </>
            )}
            {panel === "hunts" && (
              <>
                <p className="muted">
                  Nível e precisão são obrigatórios. Poder é apenas
                  recomendação. Solo entra em instância privada; a Party
                  compartilha uma instância exclusiva. O líder escolhe a hunt.
                </p>
                <div className="hunts-grid">
                  {HUNTS.map((h) => {
                    const error = canEnter(self, h);
                    return (
                      <article
                        className={`hunt-card ${error ? "locked" : ""}`}
                        key={h.id}
                      >
                        <small>
                          {h.min >= 251
                            ? "PRIMEVAL ISLE"
                            : "TERRITÓRIO PROVISÓRIO"}
                        </small>
                        <h3>
                          {h.min}—{h.max}
                        </h3>
                        <b>
                          {h.type === "mixed"
                            ? "Duas espécies · Mista"
                            : h.type === "physical"
                              ? "Favorece DPS físico"
                              : "Favorece DPS mágico"}
                        </b>
                        <p>
                          Precisão ≥ {h.accuracy}
                          <br />
                          Poder sugerido: {h.recommendedPower}
                        </p>
                        <button
                          data-hunt={h.id}
                          className="primary wide"
                          disabled={!!error || !near("portal")}
                          onClick={() => {
                            send({ type: "enter", hunt: h.id });
                            setPanel(null);
                          }}
                        >
                          {error ?? "Entrar na hunt →"}
                        </button>
                      </article>
                    );
                  })}
                </div>
                <p className="approval">
                  Nomes, monstros, precisão mínima e números de combate são
                  TODO_APROVACAO.
                </p>
              </>
            )}
            {panel === "party" && (
              <>
                <p>
                  Até cinco personagens. Classes repetidas são permitidas.
                  Summons não ocupam vagas nem recebem divisão própria de EXP.
                </p>
                {!snap.party ? (
                  <button
                    className="primary"
                    disabled={!city}
                    onClick={() => send({ type: "party.create" })}
                  >
                    Criar Party
                  </button>
                ) : (
                  <>
                    <div className="member-list">
                      {snap.party.members.map((id) => (
                        <div key={id}>
                          {id === snap.party?.leaderId ? "♛ " : ""}
                          {snap.online.find((o) => o.id === id)?.name ??
                            "Desconectado"}
                        </div>
                      ))}
                    </div>
                    {snap.party.leaderId === self.id && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const f = new FormData(e.currentTarget);
                          send({
                            type: "party.settings",
                            loot: f.get("loot"),
                            recipient: f.get("recipient"),
                            assist: f.get("assist") === "on",
                          });
                        }}
                      >
                        <label>
                          Distribuição de itens
                          <select name="loot" defaultValue={snap.party.loot}>
                            <option value="random">Integrante aleatório</option>
                            <option value="leader">Tudo para o líder</option>
                            <option value="designated">
                              Integrante escolhido
                            </option>
                          </select>
                        </label>
                        <label>
                          Integrante escolhido
                          <select
                            name="recipient"
                            defaultValue={snap.party.recipientId ?? self.id}
                          >
                            {snap.party.members.map((id) => (
                              <option key={id} value={id}>
                                {snap.online.find((o) => o.id === id)?.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="check-label">
                          <input
                            type="checkbox"
                            name="assist"
                            defaultChecked={snap.party.assist}
                          />{" "}
                          Seguir/assistir alvo do líder
                        </label>
                        <button className="primary">Salvar configuração</button>
                      </form>
                    )}
                    <button
                      disabled={!city}
                      onClick={() => send({ type: "party.leave" })}
                    >
                      Sair da Party
                    </button>
                  </>
                )}
                <h3>Jogadores conectados</h3>
                <div className="online-list">
                  {snap.online
                    .filter((o) => o.id !== self.id)
                    .map((o) => (
                      <div key={o.id}>
                        <span>
                          {o.name} <small>Nv. {o.level}</small>
                        </span>
                        <button
                          disabled={
                            !city ||
                            !snap.party ||
                            snap.party.leaderId !== self.id ||
                            snap.party.members.includes(o.id)
                          }
                          onClick={() =>
                            send({ type: "party.invite", id: o.id })
                          }
                        >
                          Convidar
                        </button>
                      </div>
                    ))}
                </div>
                <p className="approval">
                  Party completa: +20% EXP total antes da divisão e +10%
                  relativo na chance de loot normal. Bosses não recebem bônus de
                  drop.
                </p>
              </>
            )}
            {panel === "forge" && (
              <>
                <p>
                  Fabricação disponível para todas as classes.
                  Receitas/custos/raridade de teste, não decisões definitivas.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    send({
                      type: "craft",
                      grade: f.get("grade"),
                      weapon: f.get("weapon"),
                    });
                  }}
                >
                  <div className="form-row">
                    <label>
                      Grade
                      <select name="grade">
                        {Object.entries(GRADES).map(([g, l]) => (
                          <option key={g} value={g} disabled={self.level < l}>
                            {g} · nível {l}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Arma
                      <select name="weapon">
                        {Object.entries(WEAPONS).map(([id, name]) => (
                          <option key={id} value={id}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p>
                    5 Animal Bone + {BALANCE.craftCost} Adena. Grades B/A/S
                    também exigem 3 minérios da grade. Resultado Comum
                    provisório.
                  </p>
                  <button className="primary" disabled={!near("forge")}>
                    Fabricar arma
                  </button>
                </form>
                <h3>Reforja de atributo</h3>
                <p>
                  Um atributo de ataque de teste, de +1 a +10. Pesos de rolagem
                  aprovados; custo e número final de linhas pendentes.
                </p>
                <div className="reforge-list">
                  {[...Object.values(self.equipment), ...self.inventory]
                    .filter((i) => i?.slot === "weapon")
                    .map((i) => (
                      <div key={i!.id}>
                        <span>
                          {i!.name} <b>+{i!.bonus ?? 0}</b>
                        </span>
                        <button
                          disabled={!near("forge")}
                          onClick={() => send({ type: "reforge", id: i!.id })}
                        >
                          Reforjar · {BALANCE.reforgeCost}
                        </button>
                      </div>
                    ))}
                </div>
                <p className="approval">
                  Encantamento, reparo, desmonte, trocas e mercado ainda não
                  implementados; não há botões simulando esses sistemas.
                </p>
              </>
            )}
            {panel === "shop" && (
              <>
                <h3>Suprimentos</h3>
                <div className="shop-grid">
                  {(["hp", "mp"] as const).map((kind) => (
                    <article key={kind}>
                      <div className={`potion ${kind}-potion`}>
                        <Icon
                          name={kind}
                          color={kind === "hp" ? "#c5576e" : "#638fda"}
                        />
                      </div>
                      <h3>5 poções de {kind.toUpperCase()}</h3>
                      <button
                        disabled={!near("shop")}
                        onClick={() => send({ type: "buy", kind })}
                      >
                        Comprar · {BALANCE.potionCost * 5}
                      </button>
                    </article>
                  ))}
                </div>
                <h3>Armas iniciais · No Grade</h3>
                <div className="shop-grid">
                  {Object.entries(WEAPONS).map(([kind, name]) => (
                    <article key={kind}>
                      <span className="shop-glyph">
                        <Icon name={kind} />
                      </span>
                      <b>{name}</b>
                      <button
                        disabled={!near("shop")}
                        onClick={() => send({ type: "buy", kind })}
                      >
                        Comprar · 150
                      </button>
                    </article>
                  ))}
                </div>
                <h3>Vender itens da mochila</h3>
                <div className="sell-list">
                  {self.inventory.map((item) => (
                    <div key={item.id}>
                      <ItemArt item={item} />
                      <span>
                        {item.name} ×{item.quantity}
                      </span>
                      <button
                        disabled={!near("shop")}
                        onClick={() => send({ type: "sell", id: item.id })}
                      >
                        Vender ·{" "}
                        {item.kind === "equipment" ? 80 : 2 * item.quantity}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
            {panel === "class" && (
              <>
                <p>
                  Primeira profissão no nível 50. A arma autorizada determina o
                  kit de quatro habilidades. Equipamentos incompatíveis voltam
                  para a mochila.
                </p>
                <div className="profession-grid">
                  {PROFESSIONS.filter(
                    (p) =>
                      p.race === self.race && p.archetype === self.archetype,
                  ).map((p) => (
                    <article key={p.id}>
                      <h3>{p.name}</h3>
                      <p>{p.weapons.map((w) => WEAPONS[w]).join(" ou ")}</p>
                      <button
                        disabled={
                          !near("class") || self.level < 50 || !!self.profession
                        }
                        onClick={() => send({ type: "profession", id: p.id })}
                      >
                        {self.profession === p.id
                          ? "Profissão escolhida"
                          : self.level < 50
                            ? "Requer nível 50"
                            : "Escolher profissão"}
                      </button>
                    </article>
                  ))}
                </div>
                {self.profession && (
                  <>
                    <h3>Especialização · nível 150</h3>
                    <div className="profession-grid">
                      {PROFESSIONS.find((p) => p.id === self.profession)
                        ?.branches.filter(
                          (b, i, a) => a.findIndex((x) => x.id === b.id) === i,
                        )
                        .map((b) => (
                          <article key={b.id}>
                            <h3>{b.name}</h3>
                            <p>
                              {WEAPONS[b.weapon]} → {b.third} no 300
                            </p>
                            <button
                              disabled={
                                !near("class") ||
                                self.level < 150 ||
                                !!self.specialization
                              }
                              onClick={() =>
                                send({ type: "specialization", id: b.id })
                              }
                            >
                              Registrar especialização
                            </button>
                          </article>
                        ))}
                    </div>
                    <p className="approval">{THIRD_PARTY_SKILLS_PENDING}</p>
                  </>
                )}
              </>
            )}
            {panel === "settings" && (
              <>
                <h3>Poções automáticas</h3>
                <p>
                  Escolha o percentual de HP/MP que dispara o consumo. Zero
                  desliga. Cada uso consome uma poção real da mochila; recarga
                  de teste: 4 segundos.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    send({
                      type: "potions",
                      hp: Number(f.get("hp")),
                      mp: Number(f.get("mp")),
                    });
                    tell("Configuração enviada ao servidor.");
                  }}
                >
                  <div className="form-row">
                    <label>
                      HP abaixo de (%)
                      <input
                        name="hp"
                        type="number"
                        min="0"
                        max="90"
                        defaultValue={self.autoPotion.hp}
                      />
                    </label>
                    <label>
                      MP abaixo de (%)
                      <input
                        name="mp"
                        type="number"
                        min="0"
                        max="90"
                        defaultValue={self.autoPotion.mp}
                      />
                    </label>
                  </div>
                  <button className="primary">Salvar configuração</button>
                </form>
                <h3>Controles</h3>
                <p>
                  WASD e setas: andar na cidade · Clique: caminhar / selecionar
                  alvo
                  <br />
                  E: conversar · I: inventário · 1–4: habilidades · F: Auto Farm
                  · Esc: fechar painel
                </p>
                <p className="approval">
                  Auto skills também podem ser ligadas e desligadas
                  individualmente na barra.
                </p>
              </>
            )}
            {panel === "dev" && snap.dev && (
              <>
                <p className="approval">
                  SOMENTE DESENVOLVIMENTO. Muda nível/classe e adiciona recursos
                  de teste. Com NODE_ENV=production, o servidor recusa estes
                  comandos.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    send({
                      type: "dev",
                      level: Number(f.get("level")),
                      profession: f.get("profession"),
                      weapon: f.get("weapon"),
                      specialization: f.get("specialization"),
                      race: f.get("race"),
                      archetype: f.get("archetype"),
                    });
                    setPanel(null);
                  }}
                >
                  <div className="form-row">
                    <label>
                      Nível
                      <input
                        name="level"
                        type="number"
                        min="1"
                        max="1000"
                        defaultValue="50"
                      />
                    </label>
                    <label>
                      Primeira profissão
                      <select
                        name="profession"
                        value={devProfession}
                        onChange={(e) => setDevProfession(e.target.value)}
                      >
                        <option value="initial">Classe inicial</option>
                        {PROFESSIONS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="form-row">
                    <label>
                      Raça inicial
                      <select name="race">
                        <option value="human">Humano</option>
                        <option value="dwarf">Anão</option>
                      </select>
                    </label>
                    <label>
                      Arquétipo inicial
                      <select name="archetype">
                        <option value="fighter">Fighter</option>
                        <option value="mystic">Mystic</option>
                      </select>
                    </label>
                  </div>
                  <label>
                    Arma
                    <select key={devProfession} name="weapon">
                      {(
                        PROFESSIONS.find((p) => p.id === devProfession)
                          ?.weapons ?? Object.keys(WEAPONS)
                      ).map((id) => (
                        <option key={id} value={id}>
                          {WEAPONS[id as Weapon]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Especialização 150+
                    <select name="specialization">
                      <option value="">Não escolhida</option>
                      {PROFESSIONS.find((p) => p.id === devProfession)
                        ?.branches.filter(
                          (b, i, a) => a.findIndex((x) => x.id === b.id) === i,
                        )
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <button className="primary wide">
                    Aplicar personagem de teste
                  </button>
                </form>
                <p>
                  Também adiciona 10.000 Adena e materiais de exemplo. Não
                  modifica outros personagens.
                </p>
              </>
            )}
          </section>
        </div>
      )}
      {notice && (
        <div className="toast" role="alert">
          {notice}
        </div>
      )}
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
