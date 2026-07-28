export default {
  '**/*.{js,mjs,cjs,ts,jsx,tsx,md,html,css}': ['oxfmt --write'],
  '**/*.{js,mjs,cjs,ts,jsx,tsx}': ['oxlint'],
};
