import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://yesnobuttonapp.com',
  output: 'static',
  integrations: [
    sitemap(),
    mdx(),
  ],
  compressHTML: true,
  build: {
    assets: '_assets',
    inlineStylesheets: 'always',
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      cssMinify: true,
    },
  },
});
