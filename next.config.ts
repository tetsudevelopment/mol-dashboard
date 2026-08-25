import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit .next/standalone so the Docker runtime stage ships a minimal server
  // without a node_modules install. See docs/deployment.md.
  output: "standalone",
  // Sibling repos (../moltech-app, ../moltech_api) carry their own lockfiles,
  // so Next would otherwise infer the parent folder as the tracing root and
  // pull unrelated files into the standalone output.
  outputFileTracingRoot: path.resolve(import.meta.dirname),
};

export default nextConfig;
