import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Resolve "multiple lockfiles" warning in monorepo — anchor Turbopack
  // to the front-end directory instead of letting it walk up to the repo root.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
