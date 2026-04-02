import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: "/study",
  env: {
    // Expose basePath to client-side code (e.g. useChat api url)
    NEXT_PUBLIC_BASE_PATH: "/study",
  },
}

export default nextConfig
