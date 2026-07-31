import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, "..");
const serverDirectory = resolve(projectDirectory, "dist", "server");
const hostingDirectory = resolve(projectDirectory, "dist", ".openai");

await mkdir(serverDirectory, { recursive: true });
await mkdir(hostingDirectory, { recursive: true });
await copyFile(resolve(scriptDirectory, "sites-worker.mjs"), resolve(serverDirectory, "index.js"));
await copyFile(resolve(projectDirectory, ".openai", "hosting.json"), resolve(hostingDirectory, "hosting.json"));

console.log("Prepared the static Vite build for Sites hosting.");
