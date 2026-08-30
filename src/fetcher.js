const fs = require('fs');
const path = require('path');

const USER_AGENT = 'FlyRankInternship-A9/1.0 (https://github.com/7chapatti/PoliteScraper)';
const TIMEOUT_MS = 8000;
const DELAY_MS = 600;
const CACHE_DIR = path.join(__dirname, '..', 'cache');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cachePathFor(url) {
  if (url === 'https://books.toscrape.com/catalogue/page-1.html') {
    return path.join(CACHE_DIR, 'catalogue-page-1.html');
  }
  return path.join(CACHE_DIR, `${url.replace(/[^a-z0-9]/gi, '_')}.html`);
}

async function fetchPage(url, stats = { pagesFetched: 0, cacheHits: 0 }) {
  const cachePath = cachePathFor(url);
  if (fs.existsSync(cachePath)) {
    const html = fs.readFileSync(cachePath, 'utf8');
    stats.cacheHits += 1;
    console.log(`CACHE HIT ${url} (${html.length} bytes)`);
    return { html, status: 200, fromCache: true };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  stats.pagesFetched += 1;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal
    });
    if (response.status !== 200) return { html: null, status: response.status, fromCache: false };

    const html = await response.text();
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(cachePath, html, 'utf8');
    console.log(`FETCH ${url} -> 200 (${html.length} bytes)`);
    await sleep(DELAY_MS);
    return { html, status: 200, fromCache: false };
  } catch (error) {
    return { html: null, status: 0, fromCache: false, error: error.message };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { fetchPage, sleep, USER_AGENT };
```
