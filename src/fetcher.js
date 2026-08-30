const fs = require('fs');
const path = require('path');

const USER_AGENT = 'FlyRankInternship-A9/1.0 (https://github.com/7chapatti/PoliteScraper)';
const TIMEOUT_MS = 8000;
const DELAY_MS = 600;
const CACHE_DIR = path.join(__dirname, '..', 'cache');
let lastNetworkRequestStartedAt = 0;

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

function cachePathFor(url) {
  if (url === 'https://books.toscrape.com/catalogue/page-1.html') return path.join(CACHE_DIR, 'catalogue-page-1.html');
  return path.join(CACHE_DIR, `${url.replace(/[^a-z0-9]/gi, '_')}.html`);
}

async function waitForRequestSlot() {
  const remaining = DELAY_MS - (Date.now() - lastNetworkRequestStartedAt);
  if (remaining > 0) await sleep(remaining);
  lastNetworkRequestStartedAt = Date.now();
}

async function politeFetchOnce(url, stats) {
  const cachePath = cachePathFor(url);
  if (fs.existsSync(cachePath)) {
    const html = fs.readFileSync(cachePath, 'utf8');
    stats.cacheHits += 1;
    console.log(`CACHE HIT ${url} (${html.length} bytes)`);
    return { html, status: 200, fromCache: true };
  }

  await waitForRequestSlot();
  stats.pagesFetched += 1;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: controller.signal });
    if (response.status !== 200) return { html: null, status: response.status, fromCache: false };
    const html = await response.text();
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(cachePath, html, 'utf8');
    console.log(`FETCH ${url} -> 200 (${html.length} bytes)`);
    return { html, status: 200, fromCache: false };
  } catch (error) {
    return { html: null, status: 0, fromCache: false, error: error.message };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchPage(url, stats) {
  let result = await politeFetchOnce(url, stats);
  if (!result.fromCache && (result.status === 0 || result.status >= 500)) {
    console.log(`RETRY ${url}`);
    await sleep(1000);
    result = await politeFetchOnce(url, stats);
  }
  return result;
}

module.exports = { fetchPage, sleep, USER_AGENT };
