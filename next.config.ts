import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseHost: string | undefined;
try {
  supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;
} catch {
  supabaseHost = undefined;
}

const nextConfig: NextConfig = {
  images: {
    // Pre-optimize in upload / prepare-images — avoid Vercel Image Opt quotas.
    unoptimized: true,
    remotePatterns: [
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      {
        protocol: "https" as const,
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
