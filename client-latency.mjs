export const LOCAL_TICK_HZ = 20;
export const LOCAL_SNAPSHOT_HZ = 20;
// One snapshot plus a margin, adapting to observed jitter. This is the local
// server's presentation buffer; skill windups and authoritative combat stay intact.
export function localInterpolationDelay(interval, jitter) {
  return Math.min(250, Math.max(60, interval * 1.25 + jitter * 1.5));
}
export function withLocalInterpolation(bytes) {
  let code = bytes.toString("utf8");
  const needle =
    "get delay(){return Math.min(300,Math.max(80,2*this.interval+this.jitter))}";
  if (code.split(needle).length !== 2)
    throw Error("Cliente incompatível com a interpolação local.");
  code = code.replace(
    needle,
    "get delay(){return __royalLocalInterpolationDelay(this.interval,this.jitter)}",
  );
  return Buffer.from(
    `const __royalLocalInterpolationDelay = ${localInterpolationDelay.toString()};\n` +
      code,
  );
}
