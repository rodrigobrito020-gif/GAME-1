import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LOCAL_SNAPSHOT_HZ,
  LOCAL_TICK_HZ,
  localInterpolationDelay,
  withLocalInterpolation,
} from "../client-latency.mjs";
test("local snapshots keep the authoritative tick and interpolate one packet plus a jitter margin", () => {
  assert.equal(LOCAL_TICK_HZ, 20);
  assert.equal(LOCAL_SNAPSHOT_HZ, 20);
  assert.equal(localInterpolationDelay(50, 0), 62.5);
  assert.ok(localInterpolationDelay(50, 10) > localInterpolationDelay(50, 0));
  assert.equal(localInterpolationDelay(50, 1000), 250);
  // A stable 20 Hz localhost stream with realistic arrival variation always
  // brackets the presented time; no teleport/extrapolation is introduced.
  const packets = Array.from({ length: 150 }, (_, i) => ({
    server: i * 50,
    arrival: i * 50 + [0, 4, 2, 7, 1, 5][i % 6],
  }));
  for (let now = 200; now < 7000; now += 5) {
    const received = packets.filter((p) => p.arrival <= now);
    const render = now - localInterpolationDelay(50, 7);
    assert.ok(received.at(-1).server >= render);
    assert.ok(received[0].server <= render);
  }
});
test("version checked native interpolation bridge uses the tested function and rejects mismatched clients", () => {
  const input = Buffer.from(
    "class Delay {interval=50;jitter=10;get delay(){return Math.min(300,Math.max(80,2*this.interval+this.jitter))}}",
  );
  const adapted = withLocalInterpolation(input).toString();
  const getter = Function(adapted + ";return new Delay().delay;")();
  assert.equal(getter, localInterpolationDelay(50, 10));
  assert.throws(
    () => withLocalInterpolation(Buffer.from("unsupported client")),
    /incompatível/,
  );
});
