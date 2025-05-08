import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      sourceType: "module",
      globals: {
        ...globals.node, // Adds Node.js globals like `process`, `__dirname`, etc.
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      prettier: prettierPlugin,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      // Optional: stricter type-checking rules from TypeScript ESLint
      // ...tseslint.configs.strictTypeChecked.rules,

      "prettier/prettier": "error", // Shows Prettier formatting issues as ESLint errors

      // Use TS-specific version of no-unused-vars
      "@typescript-eslint/no-unused-vars": "error",

      // Recommended: disable base no-unused-vars if using TS version
      "no-unused-vars": "off",

      // Optional: disable no-undef — TypeScript already handles this
      "no-undef": "off",

      "prefer-const": "error",
    },
  },
  prettierConfig, // Disables ESLint rules that conflict with Prettier
];
