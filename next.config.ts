import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  experimental: {
    // @ts-ignore - property exists at runtime
    instrumentationHook: true,
  } as any,
};

export default nextConfig;
