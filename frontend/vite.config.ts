import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBaseUrl = env.VITE_API_BASE_URL?.replace(/\/+$/, "");

  if (!apiBaseUrl) {
    throw new Error("Missing VITE_API_BASE_URL. Add it in frontend/.env.");
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "apple-touch-icon.png"],
        manifest: {
          name: "Scripture — Listen to Ancient Wisdom",
          short_name: "Scripture",
          description:
            "Listen to Bhagavad Gita, Ramayana and other ancient scriptures with synchronized text and audio.",
          theme_color: "#1e1b4b",
          background_color: "#0f0e1a",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          icons: [
            { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
            { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
            {
              src: "/pwa-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          runtimeCaching: [
            {
              urlPattern: /\/api\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "api-cache",
                expiration: { maxEntries: 200, maxAgeSeconds: 86400 },
              },
            },
            {
              urlPattern: /\.mp3$/i,
              handler: "CacheFirst",
              options: {
                cacheName: "audio-cache",
                expiration: { maxEntries: 500, maxAgeSeconds: 604800 },
              },
            },
          ],
        },
      }),
    ],
    server: {
      port: 5200,
      allowedHosts: ["scripture.misspdf.com"],
      proxy: {
        "/api": {
          target: apiBaseUrl,
          changeOrigin: true,
        },
        "/audio": {
          target: apiBaseUrl,
          changeOrigin: true,
        },
        "/posters": {
          target: apiBaseUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
