import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(__dirname, "..", "..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: monorepoRoot,
  // Gateway proxy is implemented in src/app/api/backend/[...path]/route.ts so Authorization is forwarded reliably.
};

export default nextConfig;
