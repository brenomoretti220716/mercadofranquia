import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";

const compat = new FlatCompat();

export default [
  {
    ignores: [
      "node_modules",
      ".next",
      "dist",
      "build",
      "*.config.*",
      "next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...compat.extends("@rocketseat/eslint-config/next"),
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];
