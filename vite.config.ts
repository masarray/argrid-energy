import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

function githubPagesBase() {
  const explicitBase = process.env.VITE_BASE_PATH;
  if (explicitBase) return explicitBase.endsWith("/") ? explicitBase : `${explicitBase}/`;

  if (process.env.GITHUB_ACTIONS === "true") {
    const repository = process.env.GITHUB_REPOSITORY?.split("/")[1];
    return repository ? `/${repository}/` : "/";
  }

  return "/";
}

export default defineConfig({
  base: githubPagesBase(),
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsConfigPaths(),
  ],
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 900,
  },
});
