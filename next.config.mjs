/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compress responses with gzip
  compress: true,

  // Optimize images served through next/image
  images: {
    formats: ['image/webp'],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/auth/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',  // Google OAuth avatars
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
    ],
  },

  // Strict mode catches bugs and reduces re-renders in development
  reactStrictMode: true,

  // Optimize package imports to tree-shake unused icons
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // Security headers applied to all routes
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    
    const securityHeaders = [
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(self), microphone=(), geolocation=(self)',
      },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: blob: https://*.googleusercontent.com https://*.supabase.co",
          "connect-src 'self' https://*.googleapis.com https://*.supabase.co",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; '),
      },
    ];

    if (isProd) {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      });
    }

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
