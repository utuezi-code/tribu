module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  plugins: ["@typescript-eslint", "react", "react-hooks"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  env: { es2021: true },
  settings: { react: { version: "detect" } },
  ignorePatterns: [".eslintrc.js", "babel.config.js", "metro.config.js"],
  rules: {
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    // Désactivé : les textes de l'app sont en français et utilisent
    // beaucoup d'apostrophes de contraction (l'événement, d'ajout, ...).
    "react/no-unescaped-entities": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-module-boundary-types": "off",
  },
};
