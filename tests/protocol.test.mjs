import { test } from "node:test";
import assert from "node:assert/strict";
import { Protocol, wire } from "../protocol.mjs";
import { encodeRgba, decodeRgba, adaptIdle } from "../png.mjs";
// Own minimal FileDescriptorProto fixture, not a copy of a game descriptor.
const v = (n) => {
  n = BigInt(n);
  const bytes = [];
  do {
    let b = Number(n & 127n);
    n >>= 7n;
    if (n) b |= 128;
    bytes.push(b);
  } while (n);
  return Buffer.from(bytes);
};
const num = (n, value) => Buffer.concat([v(n * 8), v(value)]);
const str = (n, value) => {
  const data = Buffer.isBuffer(value) ? value : Buffer.from(value);
  return Buffer.concat([v(n * 8 + 2), v(data.length), data]);
};
const field = (name, id, type, extra = []) =>
  Buffer.concat([str(1, name), num(3, id), num(5, type), ...extra]);
const message = (name, fields, extra = []) =>
  Buffer.concat([str(1, name), ...fields.map((f) => str(2, f)), ...extra]);
const envelope = (name) =>
  message(
    name,
    [
      field("request_id", 1, 13),
      field("ping", 2, 11, [str(6, ".leveling.v1.Ping"), num(9, 0)]),
    ],
    [str(8, str(1, "body"))],
  );
const entry = message(
  "LabelsEntry",
  [field("key", 1, 9), field("value", 2, 17)],
  [str(7, num(7, 1))],
);
const probe = message(
  "Probe",
  [
    field("values", 1, 13, [num(4, 3)]),
    field("labels", 2, 11, [
      num(4, 3),
      str(6, ".leveling.v1.Probe.LabelsEntry"),
    ]),
    field("delta", 3, 18),
    field("precision", 4, 1),
    field("payload", 5, 12),
  ],
  [str(3, entry)],
);
const file = Buffer.concat([
  str(1, "our-test.proto"),
  str(2, "leveling.v1"),
  str(4, envelope("ClientMessage")),
  str(4, envelope("ServerMessage")),
  str(4, message("Ping", [field("client_time_ms", 1, 4)])),
  str(4, probe),
  str(12, "proto3"),
]);
const protocol = new Protocol("ko(`" + file.toString("base64") + "`)");
test("standard protobuf golden frame decodes with request ID, oneof and uint64", () => {
  const value = protocol.decode(
    "ClientMessage",
    Buffer.from("08071203089601", "hex"),
  );
  assert.equal(value.requestId, 7);
  assert.equal(value.body.case, "ping");
  assert.equal(value.body.value.clientTimeMs, "150");
  assert.equal(
    protocol
      .encode("ClientMessage", {
        requestId: 7,
        body: { case: "ping", value: { clientTimeMs: 150 } },
      })
      .toString("hex"),
    "08071203089601",
  );
});
test("supports packed and unpacked repeated values, map entries, negative integers and exact 64-bit values", () => {
  const data = protocol.decode(
    "Probe",
    Buffer.from("0a0300960112050a016110071807", "hex"),
  );
  assert.deepEqual(data.values, [0, 150]);
  assert.equal(data.labels.a, -4);
  assert.equal(data.delta, "-4");
  const number = "18446744073709551615";
  assert.equal(
    protocol.decode("Ping", protocol.encode("Ping", { clientTimeMs: number }))
      .clientTimeMs,
    number,
  );
  const original = {
    values: [0, 2, 1000],
    labels: { a: -3 },
    delta: "-9223372036854775808",
    precision: Math.PI,
    payload: Buffer.from([0, 255]),
  };
  const decoded = protocol.decode("Probe", protocol.encode("Probe", original));
  assert.equal(decoded.delta, original.delta);
  assert.equal(decoded.precision, Math.PI);
  assert.equal(decoded.labels.a, -3);
  assert.deepEqual(decoded.payload, original.payload);
});
test("rejects malformed lengths and overlong varints instead of reading outside the packet", () => {
  assert.throws(() => wire(Buffer.from("120408", "hex")), /length/);
  assert.throws(
    () => wire(Buffer.from("08ffffffffffffffffffffffff", "hex")),
    /long/,
  );
  assert.throws(() => wire(Buffer.from("0b", "hex")), /Unsupported/);
});
test("PNG adapter keeps RGBA bytes and converts the available idle into the local frame layout", () => {
  const pixels = Buffer.alloc(384 * 448 * 4);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = 25;
    pixels[i + 1] = 60;
    pixels[i + 2] = 140;
    pixels[i + 3] = 255;
  }
  const source = encodeRgba(384, 448, pixels);
  assert.deepEqual(decodeRgba(source).pixels, pixels);
  const output = decodeRgba(adaptIdle(source, 8));
  assert.equal(output.width, 512);
  assert.equal(output.height, 256);
  assert.equal(output.pixels[3], 0);
  assert.equal(output.pixels[4 * 4 + 3], 255);
  assert.throws(
    () => adaptIdle(encodeRgba(2, 2, Buffer.alloc(16))),
    /dimensions/,
  );
});
