export default {
  '**/*.{js,mjs,cjs,ts,jsx,tsx,md,html,css}': [
    'prettier --write',
    'oxlint --type-aware',
  ],
};
