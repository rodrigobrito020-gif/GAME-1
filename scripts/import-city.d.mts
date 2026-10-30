import type { CityLayout } from "@idle/shared";
export const projectRoot: string;
export function readZip(bytes: Buffer): Map<string, () => Buffer>;
export function prepareCity(
  entries: Map<string, () => Buffer>,
  packHash: string,
): { files: Map<string, Buffer>; layout: CityLayout };
export function importCity(
  filename: string,
  destination?: string,
): { files: number; layout: CityLayout };
