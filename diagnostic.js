async function update() {
  try {
    const status = await (await fetch("/__diagnostic.json")).json();
    const point = status.position
      ? ` Posição: ${status.position.x}, ${status.position.y}.`
      : "";
    document.querySelector("#status").textContent =
      `${status.localBackend ? "Servidor local ativo." : "Servidor local indisponível."} ${status.files} arquivos no pacote. ${status.authenticated ?? 0} autenticações locais.${point}`;
    for (const key of ["served", "missing"]) {
      document.querySelector("#" + key).replaceChildren(
        ...status[key].map((text) => {
          const li = document.createElement("li");
          li.textContent = text;
          return li;
        }),
      );
    }
  } catch {
    document.querySelector("#status").textContent =
      "O iniciador local foi encerrado.";
  }
}
update();
setInterval(update, 2000);
