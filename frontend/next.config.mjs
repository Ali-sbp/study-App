/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  basePath: "/study",
  env: {
    NEXT_PUBLIC_BASE_PATH: "/study",
  },
}

export default nextConfig
