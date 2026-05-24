import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs", "@discordjs/ws", "zlib-sync"],
  images: {
    unoptimized: true,
  },
}

export default nextConfig
