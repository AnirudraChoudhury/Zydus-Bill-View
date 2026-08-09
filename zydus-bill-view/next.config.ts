import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Write export output into `out` so GitHub Pages can serve it
  distDir: "out",
  // Generate a fully static export
  output: "export",
  // Serve the app from the repository subpath on GitHub Pages
  basePath: "/Zydus-Bill-View",
  assetPrefix: "/Zydus-Bill-View",
};

export default nextConfig;
