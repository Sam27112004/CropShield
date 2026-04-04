import type { NextConfig } from "next";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "node:path";


dotenvConfig({ path: resolve(process.cwd(), "..", "..", ".env") });

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
