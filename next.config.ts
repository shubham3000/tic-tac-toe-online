import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
   reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  compiler: {
    styledComponents: true,
  },
  pageExtensions: ["tsx", "ts", "jsx", "js"],
  output: "standalone",
};

export default nextConfig;
