import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

// Open outbound markdown links in a new tab with safe rel attributes.
function rehypeExternalLinks() {
  const walk = (node) => {
    if (node.type === 'element' && node.tagName === 'a') {
      const href = node.properties && node.properties.href;
      if (typeof href === 'string' && /^https?:\/\//.test(href) && !href.includes('yesnobuttonapp.com')) {
        node.properties.target = '_blank';
        node.properties.rel = ['noopener', 'noreferrer'];
      }
    }
    if (node.children) node.children.forEach(walk);
  };
  return (tree) => walk(tree);
}

export default defineConfig({
  site: 'https://yesnobuttonapp.com',
  output: 'static',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'de', 'pt-br', 'it', 'nl'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith('/embed/'),
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', es: 'es', de: 'de', 'pt-br': 'pt-BR', it: 'it', nl: 'nl' },
      },
    }),
    mdx(),
  ],
  markdown: {
    rehypePlugins: [rehypeExternalLinks],
  },
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
