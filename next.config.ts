import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* Existing config options */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  /* ONNX Runtime Web configuration */
  webpack: (config, { isServer }) => {
    // Add fallback for node modules that don't work in the browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    // Configure for ONNX Runtime Web
    if (!isServer) {
      // Ensure ONNX Runtime Web can be resolved
      config.resolve.alias = {
        ...config.resolve.alias,
        'onnxruntime-web': require.resolve('onnxruntime-web'),
      };
      
      // Handle WASM files properly
      config.module.rules.push({
        test: /\.wasm$/,
        type: 'asset/resource',
      });
    }

    return config;
  },
  
  // Ensure static files are served with correct headers
  async headers() {
    return [
      {
        source: '/:path*.wasm',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/wasm',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.mjs',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
        ],
      },
    ];
  },
  
  // Server external packages (moved from experimental)
  serverExternalPackages: ['sharp', 'onnxruntime-node'],
};

export default nextConfig;