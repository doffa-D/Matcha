import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tanstackStart(),
    viteReact(),
    nitro({
      // config: { preset: "vercel" },
    }),
  ],
  server: {
    port: 3000, // 👈 set your desired port here
    // host: true, // optional, allows access from your local network
  },
});
