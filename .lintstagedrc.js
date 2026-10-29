export default {
  '**/*.{js,mjs,cjs,ts,jsx,tsx,md,html,css}': ['oxfmt --write'],
  // Script-only commits may contain no files after Oxlint applies its ignore rules.
  '**/*.{js,mjs,cjs,ts,jsx,tsx}': ['oxlint --no-error-on-unmatched-pattern'],
};
