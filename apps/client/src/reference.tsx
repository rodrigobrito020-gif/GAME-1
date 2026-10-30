import React, { createContext, useContext, useEffect, useState } from "react";

export interface ReferencePack {
  version: number;
  images: Record<string, string>;
  audio: Record<string, string>;
  fonts: Record<string, string>;
  missing: string[];
}
const ReferenceContext = createContext<ReferencePack | null>(null);
export const useReference = () => useContext(ReferenceContext);
export function ReferenceProvider({
  url,
  children,
}: {
  url?: string;
  children: React.ReactNode;
}) {
  const [pack, setPack] = useState<ReferencePack | null>(null);
  useEffect(() => {
    setPack(null);
    if (!url || url !== "/local-city/reference.json") return;
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw Error("Pacote local indisponível.");
        const value = (await response.json()) as ReferencePack;
        if (value.version !== 1) throw Error("Versão desconhecida.");
        for (const group of [value.images, value.audio, value.fonts]) {
          if (!group || typeof group !== "object")
            throw Error("Manifesto inválido.");
          for (const path of Object.values(group))
            if (
              typeof path !== "string" ||
              !/^\/local-city\/reference\/(images|audio|fonts)\/[a-zA-Z0-9_-]+\.(png|ogg|woff2)$/.test(
                path,
              )
            )
              throw Error("Caminho de recurso inválido.");
        }
        if (!controller.signal.aborted) setPack(value);
      })
      .catch(() => {
        /* Original icons remain functional if a local pack is absent. */
      });
    return () => controller.abort();
  }, [url]);
  useEffect(() => {
    const source = pack?.fonts["sora-latin"];
    if (!source || !("FontFace" in window)) return;
    const face = new FontFace("ReferenceSora", `url(${source})`);
    let cancelled = false;
    face
      .load()
      .then((loaded) => {
        if (!cancelled) document.fonts.add(loaded);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      document.fonts.delete(face);
    };
  }, [pack]);
  return (
    <ReferenceContext.Provider value={pack}>
      {children}
    </ReferenceContext.Provider>
  );
}
export const referenceIcons: Record<string, string> = {
  bag: "p-inventario",
  inventory: "p-inventario",
  character: "p-status",
  hunts: "p-cacadas",
  party: "p-party",
  forge: "p-forja",
  shop: "p-loja",
  class: "p-linhagens",
  settings: "p-configuracoes",
  storage: "warehouse",
  healer: "heal",
  hp: "pocao-vida",
  mp: "pocao-mana",
};
export function ReferenceGallery() {
  const pack = useReference();
  if (!pack)
    return (
      <p>
        Execute INICIAR_TESTE.bat com recursos-publicos.zip para instalar as
        imagens e os sons locais.
      </p>
    );
  return (
    <>
      <p>
        {Object.keys(pack.images).length} imagens e{" "}
        {Object.keys(pack.audio).length} áudios preparados do pacote enviado.
      </p>
      <p className="approval">
        As camadas completas de corpo, roupas, caminhada e ataques dos
        personagens não vieram no ZIP. O servidor original também não está nele.
        Esta galeria mostra os arquivos existentes, sem confundir referências de
        catálogo com imagens.
      </p>
      <div className="resource-gallery">
        {Object.entries(pack.images).map(([name, url]) => (
          <figure key={name}>
            <img src={url} loading="lazy" alt={name.replaceAll("-", " ")} />
            <figcaption>{name}</figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
