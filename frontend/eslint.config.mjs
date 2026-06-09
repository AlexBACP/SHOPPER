import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Texto en español con comillas/apóstrofes — regla ruidosa, sin valor real.
      "react/no-unescaped-entities": "off",
      // Respuestas dinámicas de la API se tipan como `any` en varios dashboards.
      // Lo dejamos como aviso (deuda técnica visible) en lugar de error bloqueante.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;
