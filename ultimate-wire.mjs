// Optional local extension on ServerMessage. Standard protobuf clients ignore
// this unknown length-delimited field; existing messages retain their schema.
export function withUltimateState(packet, state) {
  const payload = Buffer.from(JSON.stringify(state));
  let n = payload.length;
  const size = [];
  do {
    size.push((n & 127) | (n > 127 ? 128 : 0));
    n >>>= 7;
  } while (n);
  return Buffer.concat([packet, Buffer.from([0xfa, 0x7f, ...size]), payload]);
}
