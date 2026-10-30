import React, { useMemo, useState } from "react";
import { BALANCE, GRADES, RARITIES, professionName } from "@idle/shared";
import type { Command, Item, Snapshot, Slot } from "@idle/shared";
import { Icon } from "./icons";
import { fullBodyFor } from "./art";
export function ItemArt({ item }: { item: Item }) {
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
const slotNames: Record<Slot, string> = {
  weapon: "Arma",
  shield: "Escudo",
  chest: "Peito",
  legs: "Calças",
  helmet: "Cabeça",
  gloves: "Luvas",
  boots: "Botas",
  ring: "Anel",
  necklace: "Colar",
};
type Filter = "all" | "weapon" | "armor" | "jewelry" | "potion" | "material";
export function ItemGrid({
  items,
  label,
  limit,
  onSelect,
  selected,
  onTransfer,
  collection,
  disabled = false,
}: {
  items: Item[];
  label: string;
  limit: number;
  onSelect?: (item: Item) => void;
  selected?: string;
  onTransfer?: (id: string) => void;
  collection?: "inventory" | "storage";
  disabled?: boolean;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [descending, setDescending] = useState(true);
  const shown = useMemo(
    () =>
      items
        .filter((item) => {
          if (
            !item.name
              .toLocaleLowerCase("pt-BR")
              .includes(search.toLocaleLowerCase("pt-BR"))
          )
            return false;
          return (
            filter === "all" ||
            (filter === "weapon"
              ? item.slot === "weapon" || item.slot === "shield"
              : filter === "armor"
                ? ["chest", "legs", "helmet", "gloves", "boots"].includes(
                    item.slot ?? "",
                  )
                : filter === "jewelry"
                  ? item.slot === "ring" || item.slot === "necklace"
                  : item.kind === filter)
          );
        })
        .sort(
          (a, b) =>
            (descending ? -1 : 1) *
              (RARITIES.indexOf(a.rarity ?? "Comum") -
                RARITIES.indexOf(b.rarity ?? "Comum")) ||
            a.name.localeCompare(b.name, "pt-BR"),
        ),
    [items, filter, search, descending],
  );
  return (
    <section className="collection" data-collection={collection}>
      <div className="collection-title">
        <h3>
          {label}{" "}
          <span>
            {items.length} / {limit}
          </span>
        </h3>
        <button
          onClick={() => setDescending(!descending)}
          aria-label={`Organizar ${label} por raridade`}
          title="Clique novamente para inverter a ordem"
        >
          Raridade {descending ? "↓" : "↑"}
        </button>
      </div>
      <div className="collection-tools">
        <input
          aria-label={`Buscar em ${label}`}
          placeholder="Buscar item…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label={`Filtrar ${label}`}
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
        >
          <option value="all">Todos</option>
          <option value="weapon">Armas e escudos</option>
          <option value="armor">Armaduras</option>
          <option value="jewelry">Joias</option>
          <option value="potion">Poções</option>
          <option value="material">Materiais</option>
        </select>
      </div>
      <div
        className="bag-grid"
        role="group"
        aria-label={`Itens de ${label}`}
        onDragOver={(event) => {
          if (!disabled && onTransfer) event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();
          if (disabled || !onTransfer) return;
          try {
            const data = JSON.parse(
              event.dataTransfer.getData("application/x-idle-item"),
            );
            if (data.collection !== collection && typeof data.id === "string")
              onTransfer(data.id);
          } catch {
            /* Ignore unrelated dragged content. */
          }
        }}
      >
        {shown.map((item) => (
          <button
            className={`item-cell ${selected === item.id ? "selected" : ""}`}
            key={item.id}
            title={`${item.name} · ${item.rarity ?? ""}`}
            aria-label={`${item.name} ×${item.quantity}`}
            draggable={!!onTransfer && !disabled}
            onDragStart={(event) => {
              event.dataTransfer.setData(
                "application/x-idle-item",
                JSON.stringify({ id: item.id, collection }),
              );
              event.dataTransfer.effectAllowed = "move";
            }}
            onClick={() => onSelect?.(item)}
            onDoubleClick={() => !disabled && onTransfer?.(item.id)}
            onContextMenu={(event) => {
              if (onTransfer) {
                event.preventDefault();
                if (!disabled) onTransfer(item.id);
              }
            }}
          >
            <ItemArt item={item} />
            {item.quantity > 1 && <small>×{item.quantity}</small>}
            {item.grade && <em>{item.grade}</em>}
          </button>
        ))}
        {Array.from(
          { length: Math.max(0, Math.min(30, limit) - shown.length) },
          (_, index) => (
            <div className="empty-cell" key={`empty-${index}`} aria-hidden />
          ),
        )}
      </div>
      {shown.length === 0 && (
        <p className="empty-collection">
          {items.length
            ? "Nenhum item corresponde ao filtro."
            : "Nenhum item nesta coleção."}
        </p>
      )}
    </section>
  );
}
export function Inventory({
  snapshot,
  send,
}: {
  snapshot: Snapshot;
  send: (cmd: Command) => void;
}) {
  const [selectedId, setSelectedId] = useState("");
  const self = snapshot.self,
    city = snapshot.map === "city";
  const selected = [...self.inventory, ...Object.values(self.equipment)].find(
    (item) => item?.id === selectedId,
  );
  return (
    <div className="inventory-layout">
      <section className="paperdoll">
        <h3>{self.name}</h3>
        <p>
          {professionName(self)} · Nv. {self.level}
        </p>
        <div className="paperdoll-slots">
          <img
            className="body-preview"
            src={fullBodyFor(self.race, self.archetype)}
            alt="Prévia do personagem"
          />
          {(Object.keys(slotNames) as Slot[]).map((slot) => {
            const item = self.equipment[slot];
            return (
              <button
                key={slot}
                className={`equipped-slot slot-${slot}`}
                title={slotNames[slot]}
                onClick={() => item && setSelectedId(item.id)}
              >
                <small>{slotNames[slot]}</small>
                {item ? (
                  <ItemArt item={item} />
                ) : (
                  <span className="empty-equipment">
                    <Icon name={slot} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="paperdoll-stats">
          <span>
            Ataque <b>{Math.floor(snapshot.stats.attack)}</b>
          </span>
          <span>
            Defesa <b>{Math.floor(snapshot.stats.defense)}</b>
          </span>
        </div>
      </section>
      <ItemGrid
        items={self.inventory}
        label="Mochila"
        limit={BALANCE.inventoryLimit}
        selected={selectedId}
        onSelect={(item) => setSelectedId(item.id)}
        onTransfer={(id) => {
          if (
            self.inventory.find((item) => item.id === id)?.kind === "equipment"
          )
            send({ type: "equip", id });
        }}
        disabled={!city}
      />
      <section className="item-detail">
        {selected ? (
          <>
            <ItemArt item={selected} />
            <h3>{selected.name}</h3>
            <p
              className={`rarity-label rarity-text-${RARITIES.indexOf(selected.rarity ?? "Comum")}`}
            >
              {selected.rarity ??
                (selected.kind === "material" ? "Material" : "Consumível")}
              {selected.grade
                ? ` · ${selected.grade === "NG" ? "No Grade" : `Grau ${selected.grade}`}`
                : ""}
            </p>
            <p>
              {selected.slot ? slotNames[selected.slot] : selected.name} ·
              Quantidade {selected.quantity}
            </p>
            {selected.grade && <p>Requer nível {GRADES[selected.grade]}</p>}
            {selected.kind === "equipment" && (
              <>
                <p>Atributo de ataque de teste: +{selected.bonus ?? 0}</p>
                {self.inventory.some((item) => item.id === selected.id) ? (
                  <button
                    className="primary wide"
                    disabled={!city}
                    onClick={() => send({ type: "equip", id: selected.id })}
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
            {selected.kind === "potion" && (
              <button
                className="primary wide"
                onClick={() => send({ type: "potion", kind: selected.potion })}
              >
                Usar poção
              </button>
            )}
          </>
        ) : (
          <div className="detail-empty">
            <Icon name="bag" />
            <h3>Selecione um item</h3>
            <p>Confira seus equipamentos, materiais e consumíveis.</p>
          </div>
        )}
        <small>
          Duplo clique em equipamento da mochila para equipar. Itens equipados
          ficam nos slots do personagem.
        </small>
      </section>
    </div>
  );
}
export function Warehouse({
  snapshot,
  send,
  near,
}: {
  snapshot: Snapshot;
  send: (cmd: Command) => void;
  near: boolean;
}) {
  const [selected, setSelected] = useState("");
  return (
    <>
      <p className="muted">
        Duplo clique ou botão direito transfere uma pilha completa. Você também
        pode arrastar de uma coleção para a outra. Equipamentos vestidos
        precisam ser retirados antes.
      </p>
      <div className="warehouse-layout">
        <ItemGrid
          items={snapshot.self.inventory}
          label="Mochila"
          collection="inventory"
          limit={BALANCE.inventoryLimit}
          selected={selected}
          onSelect={(item) => setSelected(item.id)}
          disabled={!near}
          onTransfer={(id) =>
            send({
              type: snapshot.self.inventory.some((item) => item.id === id)
                ? "storage.deposit"
                : "storage.withdraw",
              id,
            })
          }
        />
        <ItemGrid
          items={snapshot.self.storage ?? []}
          label="Armazém"
          collection="storage"
          limit={BALANCE.storageLimit}
          selected={selected}
          onSelect={(item) => setSelected(item.id)}
          disabled={!near}
          onTransfer={(id) =>
            send({
              type: snapshot.self.storage?.some((item) => item.id === id)
                ? "storage.withdraw"
                : "storage.deposit",
              id,
            })
          }
        />
      </div>
    </>
  );
}
