/** @type {import('next').NextConfig} */
const nextConfig = {
    // Thêm cấu hình images vào đây
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'img.vietqr.io',
                port: '',
                pathname: '/image/**',
            },
        ],
    },
};

export default nextConfig;