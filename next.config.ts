import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/flights/:path*", destination: "/", permanent: false },
      { source: "/flight-hotel/:path*", destination: "/", permanent: false },
      { source: "/stays/:path*", destination: "/", permanent: false },
      { source: "/deals/:path*", destination: "/", permanent: false },
      { source: "/inspiration/:path*", destination: "/", permanent: false },
      { source: "/airlines/:path*", destination: "/", permanent: false },
      { source: "/account/:path*", destination: "/", permanent: false },
      { source: "/support/:path*", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
