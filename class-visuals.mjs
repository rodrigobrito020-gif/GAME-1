// Class energy is shared by the skill card, hotbar icon and dash trail.
export const CLASS_VISUALS = Object.freeze({
  berserker: Object.freeze({
    color: "#ff5148",
    trailColor: 0xff5148,
    dashMove: "orc-esquiva",
    dashIcon: "/assets/ui/royal-berserker/dash.png",
  }),
  guerreiro: Object.freeze({
    color: "#ffe4a0",
    trailColor: 0xffe4a0,
    dashMove: "humano-esquiva",
    dashIcon: "/assets/ui/royal-warrior/dash-card.png",
  }),
  pistoleira: Object.freeze({
    color: "#cda7ff",
    trailColor: 0xcda7ff,
    dashMove: "dark-elf-esquiva",
    dashIcon: "/assets/ui/royal-gunslinger/dash.png",
  }),
  arqueira: Object.freeze({
    color: "#62e89c",
    trailColor: 0x62e89c,
    dashMove: "elfa-esquiva",
    dashIcon: "/assets/ui/royal-archer/dash.png",
  }),
});
export const classVisuals = (id) =>
  CLASS_VISUALS[id] ?? CLASS_VISUALS.guerreiro;
