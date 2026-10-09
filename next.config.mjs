/** @type {import('next').NextConfig} */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig = {
  // Proof-of-payment uploads (max 8 MB) go through a server action.
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
    // Share-image routes read fonts/placeholders, and the upload route the watermark logo, from disk at runtime.
    outputFileTracingIncludes: {
      "/**": ["./assets/fonts/**/*", "./public/placeholders/**/*"],
      "/api/admin/upload": ["./lib/watermark/**"],
    },
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;
