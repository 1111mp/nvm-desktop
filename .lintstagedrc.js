export default {
  '**/*.{js,mjs,cjs,ts,jsx,tsx,md,html,css}': [
    'oxfmt --write',
    'oxlint --type-aware',
  ],
};
