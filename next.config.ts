import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "noirblancnyc.com" },
      { protocol: "https", hostname: "**.noirblancnyc.com" },
      { protocol: "https", hostname: "noirblanc.store" },
      { protocol: "https", hostname: "**.noirblanc.store" },
      { protocol: "https", hostname: "noirandblancnyc.kinsta.cloud" },
    ],
  },
};

export default nextConfig;
