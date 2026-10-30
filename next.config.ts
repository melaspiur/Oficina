import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Sitio estatico: genera la carpeta "out" para subir por FTP.
  output: 'export',
  // Oficina vive en laspiur.com/oficina; la raiz tiene el index para elegir programa.
  basePath: '/oficina',
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
