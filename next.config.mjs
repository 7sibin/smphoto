/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Dev indikator stoji po difoltu u donjem lijevom uglu, tacno preko CTA-a
  // u rafting sekciji. Nema ga u produkcijskom buildu, ali smeta pri radu.
  devIndicators: { position: "bottom-right" },
};
export default nextConfig;
