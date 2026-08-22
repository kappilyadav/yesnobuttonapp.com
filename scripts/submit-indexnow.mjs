import { readFile } from 'node:fs/promises';

const host = 'yesnobuttonapp.com';
const key = '9cf6959b96b4f7f6fbc378588e7b3622';
const keyLocation = `https://${host}/${key}.txt`;
const endpoint = process.env.INDEXNOW_ENDPOINT || 'https://api.indexnow.org/indexnow';
const sitemapPath = new URL('../dist/sitemap-0.xml', import.meta.url);

const sitemap = await readFile(sitemapPath, 'utf8');
const urlList = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);

if (urlList.length === 0) {
  throw new Error(`No URLs found in ${sitemapPath.pathname}. Run npm run build first.`);
}

const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
  body: JSON.stringify({
    host,
    key,
    keyLocation,
    urlList,
  }),
});

if (!response.ok) {
  const body = await response.text();
  throw new Error(`IndexNow submission failed with ${response.status}: ${body}`);
}

console.log(`Submitted ${urlList.length} URLs to IndexNow via ${endpoint}`);
