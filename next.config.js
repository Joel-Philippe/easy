/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration React
  reactStrictMode: true,
  
  // Configuration pour résoudre les problèmes de chemins
  experimental: {
    esmExternals: false,
  },
  
  // Configuration des images
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'images.unsplash.com',
      'via.placeholder.com',
      'images.pexels.com'
    ],
    unoptimized: true
  },
  
  // Configuration pour éviter les erreurs de build
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Configuration ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Configuration des redirections
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: false,
      },
    ];
  },
  
  // Configuration pour les API routes
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
  
  // 🔧 CORRECTION CRITIQUE : Configuration webpack pour éviter les erreurs Express/Node.js
  webpack: (config, { isServer }) => {
    // Ignorer les modules Node.js côté client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        // Modules Express problématiques
        express: false,
        destroy: false,
        etag: false,
        send: false,
      };
    }
    
    // Ignorer les warnings de modules manquants
    config.ignoreWarnings = [
      { module: /node_modules\/express/ },
      { module: /node_modules\/destroy/ },
      { module: /node_modules\/etag/ },
      { module: /node_modules\/send/ },
    ];
    
    return config;
  },
  
  // Configuration des variables d'environnement
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
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
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Optimisations de performance
  swcMinify: true,
  
  // Configuration pour éviter les erreurs de modules externes
  transpilePackages: ['lucide-react'],
};

module.exports = nextConfig;