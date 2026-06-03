import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Imagen Docker mínima: empaqueta solo lo necesario para correr el servidor.
  output: "standalone",
};

export default nextConfig;
