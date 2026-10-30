import { SPECIES } from "./config";
import { huntGrade } from "./rules";
// TODO_APROVACAO: every species has its own explicit table. The approved
// Animal Bone 1–2 / 5–10 example is restricted to physical-1, not a multiplier.
export interface MaterialDrop {
  name: string;
  material: string;
  min: number;
  max: number;
  chance: number;
}
export const DROP_TABLES: Record<
  string,
  { normal: MaterialDrop[]; spoil: MaterialDrop[] }
> = Object.fromEntries(
  SPECIES.map((s, i) => {
    const grade = huntGrade(s.min),
      normal: MaterialDrop[] = [
        { name: "Animal Bone", material: "bone", min: 1, max: 2, chance: 0.6 },
      ];
    const spoil: MaterialDrop[] =
      s.id === "physical-1"
        ? [
            {
              name: "Animal Bone",
              material: "bone",
              min: 5,
              max: 10,
              chance: 0.85,
            },
          ]
        : [
            {
              name:
                s.min > 150
                  ? `Minério ${grade}`
                  : i % 2
                    ? "Fragmento Arcano"
                    : "Couro Bruto",
              material:
                s.min > 150
                  ? `ore-${grade}`
                  : i % 2
                    ? "arcane-fragment"
                    : "leather",
              min: 2,
              max: 4,
              chance: 0.7,
            },
          ];
    return [s.id, { normal, spoil }];
  }),
);
