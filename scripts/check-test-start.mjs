import net from "node:net";

function free(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen({ port, host: "0.0.0.0", exclusive: true }, () =>
      server.close(() => resolve(true)),
    );
  });
}
const blocked = [];
for (const port of [3001, 5173]) if (!(await free(port))) blocked.push(port);
if (blocked.length) {
  console.error(
    `Ja existe um programa usando a(s) porta(s) ${blocked.join(", ")}.`,
  );
  console.error(
    "Feche a janela do jogo anterior com Ctrl+C. Depois abra INICIAR_TESTE.bat novamente.",
  );
  console.error(
    "Esta tentativa foi interrompida para evitar mostrar a versao antiga no navegador.",
  );
  process.exitCode = 1;
} else console.log("Portas do teste livres. Continuando nesta pasta.");
