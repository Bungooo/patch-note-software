import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    // Import des logos depuis les paramètres (2 Mo max, vérifié dans l'action)
    serverActions: { bodySizeLimit: "3mb" },
  },
};

export default nextConfig;
