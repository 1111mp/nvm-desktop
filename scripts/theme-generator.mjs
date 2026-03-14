import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { THEMES } from './theme.mjs';

const BASE_COLORS = [
  'neutral',
  'stone',
  'zinc',
  'mauve',
  'olive',
  'mist',
  'taupe',
];

const BASE_COLORS_FILE = join(process.cwd(), 'src/styles', 'base-color.css');
const THEMES_FILE = join(process.cwd(), 'src/styles', 'theme.css');

function log(...args) {
  console.log('[theme-generator]', ...args);
}

function buildCssRule(selector, cssVars) {
  const declarations = Object.entries(cssVars ?? {})
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `  --${key}: ${value};`)
    .join('\n');

  if (!declarations) {
    return `${selector} {}\n`;
  }

  return `${selector} {\n${declarations}\n}\n`;
}

async function generateBaseColorCSS() {
  log('Generating base color CSS...');

  const baseColorThemes = THEMES.filter((theme) =>
    BASE_COLORS.includes(theme.name),
  );

  log(`Found ${baseColorThemes.length} base color themes`);

  let content = '';
  baseColorThemes.forEach((theme) => {
    log(`Processing base color: ${theme.name}`);

    const lightCssVars = buildCssRule(
        `.color-${theme.name}`,
        theme.cssVars.light,
      ),
      darkCssVars = buildCssRule(
        `.dark .color-${theme.name}`,
        theme.cssVars.dark ?? theme.cssVars.light,
      );

    if (theme.name === 'neutral') {
      // default theme
      const defaultLightCssVars = buildCssRule(`:root`, theme.cssVars.light),
        defaultDarkCssVars = buildCssRule(
          '.dark',
          theme.cssVars.dark ?? theme.cssVars.light,
        );
      content += `${defaultLightCssVars}\n${defaultDarkCssVars}\n${lightCssVars}\n${darkCssVars}\n`;
    } else {
      content += `${lightCssVars}\n${darkCssVars}\n`;
    }
  });

  await writeFile(BASE_COLORS_FILE, content, 'utf-8');

  log(`Base color CSS written to: ${BASE_COLORS_FILE}`);
}

async function generateThemeCSS() {
  log('Generating theme CSS...');

  const themes = THEMES.filter((theme) => !BASE_COLORS.includes(theme.name));

  log(`Found ${themes.length} themes`);

  let content = '';
  themes.forEach((theme) => {
    log(`Processing theme: ${theme.name}`);

    const lightCssVars = buildCssRule(
      `.theme-${theme.name}`,
      theme.cssVars.light,
    );

    const darkCssVars = buildCssRule(
      `.dark .theme-${theme.name}`,
      theme.cssVars.dark ?? theme.cssVars.light,
    );

    content += `${lightCssVars}\n${darkCssVars}\n`;
  });

  await writeFile(THEMES_FILE, content, 'utf-8');

  log(`Theme CSS written to: ${THEMES_FILE}`);
}

async function run() {
  const start = performance.now();

  try {
    log('Starting theme CSS generation...\n');

    await generateBaseColorCSS();
    await generateThemeCSS();

    const end = performance.now();

    log('\nTheme generation completed successfully');
    log(`Total time: ${(end - start).toFixed(2)}ms`);
  } catch (error) {
    console.error('[theme-generator] Error:', error);
    process.exit(1);
  }
}

run();
