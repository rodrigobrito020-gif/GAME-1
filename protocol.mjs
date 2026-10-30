// Original data-only Protobuf reader. Descriptors are read from the user's local
// captured build; no uploaded JavaScript is evaluated on the server.
const camel = (text) => text.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
function varint(bytes, cursor) {
  let value = 0n;
  for (let shift = 0n; shift < 70n; shift += 7n) {
    if (cursor.i >= bytes.length) throw Error("Protobuf truncated");
    const b = bytes[cursor.i++];
    value |= BigInt(b & 127) << shift;
    if (!(b & 128)) return value;
  }
  throw Error("Protobuf varint too long");
}
export function wire(bytes) {
  const result = new Map(),
    cursor = { i: 0 };
  while (cursor.i < bytes.length) {
    const tag = Number(varint(bytes, cursor)),
      number = tag >>> 3,
      kind = tag & 7;
    if (number < 1) throw Error("Invalid field");
    let value;
    if (kind === 0) value = varint(bytes, cursor);
    else if (kind === 2) {
      const len = Number(varint(bytes, cursor));
      if (len < 0 || cursor.i + len > bytes.length)
        throw Error("Invalid field length");
      value = bytes.subarray(cursor.i, cursor.i + len);
      cursor.i += len;
    } else if (kind === 1 || kind === 5) {
      const len = kind === 1 ? 8 : 4;
      if (cursor.i + len > bytes.length) throw Error("Truncated fixed field");
      value = bytes.subarray(cursor.i, cursor.i + len);
      cursor.i += len;
    } else throw Error("Unsupported wire type");
    const entries = result.get(number) ?? [];
    entries.push({ kind, value });
    result.set(number, entries);
  }
  return result;
}
const string = (fields, n) => fields.get(n)?.[0]?.value?.toString("utf8") ?? "";
const number = (fields, n) => Number(fields.get(n)?.[0]?.value ?? 0n);
const many = (fields, n) => fields.get(n)?.map((item) => item.value) ?? [];
const unsigned = (value) => {
  let n = BigInt(value);
  if (n < 0) n = BigInt.asUintN(64, n);
  const out = [];
  do {
    let b = Number(n & 127n);
    n >>= 7n;
    if (n) b |= 128;
    out.push(b);
  } while (n);
  return Buffer.from(out);
};
const concat = (field, kind, data) =>
  Buffer.concat([
    unsigned((field << 3) | kind),
    ...(kind === 2 ? [unsigned(data.length)] : []),
    data,
  ]);
export class Protocol {
  messages = new Map();
  enums = new Map();
  files = [];
  constructor(build) {
    const expressions = [...build.matchAll(/\bko\(`([A-Za-z0-9+/=]+)`/g)];
    if (expressions.length < 1)
      throw Error("Protocol descriptors not found in captured build");
    for (const expression of expressions) {
      const data = wire(Buffer.from(expression[1], "base64")),
        name = string(data, 1),
        pkg = string(data, 2);
      if (!name.endsWith(".proto")) continue;
      this.files.push(name);
      for (const entry of many(data, 4)) this.message(entry, pkg);
      for (const entry of many(data, 5)) this.enumeration(entry, pkg);
    }
    for (const message of this.messages.values())
      for (const field of message.fields)
        field.map = this.messages.get(field.typeName)?.mapEntry ?? false;
    for (const name of [
      "leveling.v1.ClientMessage",
      "leveling.v1.ServerMessage",
    ])
      if (!this.messages.has(name)) throw Error(`Missing ${name}`);
  }
  enumeration(bytes, parent) {
    const data = wire(bytes),
      name = `${parent}.${string(data, 1)}`;
    this.enums.set(
      name,
      many(data, 2).map((value) => {
        const v = wire(value);
        return { name: string(v, 1), number: number(v, 2) };
      }),
    );
  }
  message(bytes, parent) {
    const data = wire(bytes),
      name = `${parent}.${string(data, 1)}`;
    const oneofs = many(data, 8).map((entry) => camel(string(wire(entry), 1)));
    const fields = many(data, 2).map((entry) => {
      const f = wire(entry);
      return {
        name: camel(string(f, 10) || string(f, 1)),
        protoName: string(f, 1),
        number: number(f, 3),
        repeated: number(f, 4) === 3,
        type: number(f, 5),
        typeName: string(f, 6).replace(/^\./, ""),
        oneof: f.has(9) && !number(f, 17) ? oneofs[number(f, 9)] : undefined,
      };
    });
    this.messages.set(name, {
      name,
      fields,
      oneofs,
      mapEntry: many(data, 7).some((options) => number(wire(options), 7) === 1),
    });
    for (const entry of many(data, 3)) this.message(entry, name);
    for (const entry of many(data, 4)) this.enumeration(entry, name);
  }
  schema(name) {
    const type = this.messages.get(
      name.startsWith("leveling.") ? name : `leveling.v1.${name}`,
    );
    if (!type) throw Error(`Unknown protobuf type ${name}`);
    return type;
  }
  decode(name, bytes, depth = 0) {
    if (depth > 64) throw Error("Protobuf nested too deep");
    const schema = this.schema(name),
      fields = wire(bytes),
      output = {};
    for (const field of schema.fields) {
      let values = fields.get(field.number) ?? [];
      if (
        field.repeated &&
        field.type !== 9 &&
        field.type !== 11 &&
        field.type !== 12
      )
        values = values.flatMap((value) =>
          value.kind === 2 ? this.packed(field, value.value) : [value],
        );
      const decoded = values.map((value) => this.value(field, value, depth));
      if (field.oneof) {
        if (decoded.length)
          output[field.oneof] = { case: field.name, value: decoded.at(-1) };
        continue;
      }
      if (field.map) {
        output[field.name] = Object.create(null);
        for (const entry of decoded)
          output[field.name][entry.key] = entry.value;
      } else if (field.repeated) output[field.name] = decoded;
      else if (decoded.length) output[field.name] = decoded.at(-1);
      else if (field.type !== 11)
        output[field.name] =
          field.type === 9
            ? ""
            : field.type === 12
              ? Buffer.alloc(0)
              : field.type === 8
                ? false
                : 0;
    }
    return output;
  }
  packed(field, bytes) {
    const values = [],
      cursor = { i: 0 };
    while (cursor.i < bytes.length) {
      let kind = 0,
        value;
      if ([1, 6, 16].includes(field.type)) {
        kind = 1;
        value = bytes.subarray(cursor.i, cursor.i + 8);
        cursor.i += 8;
      } else if ([2, 7, 15].includes(field.type)) {
        kind = 5;
        value = bytes.subarray(cursor.i, cursor.i + 4);
        cursor.i += 4;
      } else value = varint(bytes, cursor);
      values.push({ kind, value });
    }
    return values;
  }
  value(field, { value }, depth) {
    switch (field.type) {
      case 9:
        return value.toString("utf8");
      case 12:
        return value;
      case 11:
        return this.decode(field.typeName, value, depth + 1);
      case 8:
        return value !== 0n;
      case 1:
        return value.readDoubleLE();
      case 2:
        return value.readFloatLE();
      case 6:
        return value.readBigUInt64LE().toString();
      case 7:
        return value.readUInt32LE();
      case 15:
        return value.readInt32LE();
      case 16:
        return value.readBigInt64LE().toString();
      case 17:
      case 18: {
        const n = (value >> 1n) ^ -(value & 1n);
        return field.type === 18 ? n.toString() : Number(n);
      }
      case 3:
        return BigInt.asIntN(64, value).toString();
      case 4:
        return value.toString();
      case 5:
        return Number(BigInt.asIntN(32, value));
      default:
        return Number(value);
    }
  }
  encode(name, object, depth = 0) {
    if (depth > 64) throw Error("Protobuf nested too deep");
    const schema = this.schema(name),
      output = [];
    for (const field of schema.fields) {
      let value = object?.[field.name] ?? object?.[field.protoName];
      if (field.oneof) {
        const selected = object?.[field.oneof];
        if (selected?.case !== field.name) continue;
        value = selected.value;
      }
      if (value === undefined || value === null) continue;
      if (field.map) {
        for (const [key, entry] of Object.entries(value))
          output.push(this.emit(field, { key, value: entry }, depth));
      } else if (field.repeated) {
        for (const entry of value) output.push(this.emit(field, entry, depth));
      } else if (
        field.type === 11 ||
        field.oneof ||
        (value !== "" &&
          value !== false &&
          value !== 0 &&
          value !== 0n &&
          value !== "0")
      )
        output.push(this.emit(field, value, depth));
    }
    return Buffer.concat(output);
  }
  emit(field, value, depth) {
    let kind = 0,
      data;
    switch (field.type) {
      case 11:
        kind = 2;
        data = this.encode(field.typeName, value, depth + 1);
        break;
      case 9:
        kind = 2;
        data = Buffer.from(String(value));
        break;
      case 12:
        kind = 2;
        data = Buffer.from(value);
        break;
      case 1:
        kind = 1;
        data = Buffer.alloc(8);
        data.writeDoubleLE(Number(value));
        break;
      case 2:
        kind = 5;
        data = Buffer.alloc(4);
        data.writeFloatLE(Number(value));
        break;
      case 6:
      case 16:
        kind = 1;
        data = Buffer.alloc(8);
        field.type === 6
          ? data.writeBigUInt64LE(BigInt(value))
          : data.writeBigInt64LE(BigInt(value));
        break;
      case 7:
      case 15:
        kind = 5;
        data = Buffer.alloc(4);
        field.type === 7
          ? data.writeUInt32LE(Number(value))
          : data.writeInt32LE(Number(value));
        break;
      case 8:
        data = unsigned(value ? 1 : 0);
        break;
      case 17:
      case 18: {
        const n = BigInt(value);
        data = unsigned((n << 1n) ^ (n >> 63n));
        break;
      }
      case 14: {
        const entry =
          typeof value === "string"
            ? this.enums
                .get(field.typeName)
                ?.find((item) => item.name === value)
            : null;
        data = unsigned(entry?.number ?? value);
        break;
      }
      default:
        data = unsigned(value);
    }
    return concat(field.number, kind, data);
  }
}
