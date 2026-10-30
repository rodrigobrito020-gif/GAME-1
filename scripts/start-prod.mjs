// Cross-platform: works in Windows PowerShell/CMD without shell env syntax.
process.env.NODE_ENV = "production";
process.env.DEV_MODE = "false";
await import("../apps/server/dist/index.js");
