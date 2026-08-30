const fs = require('fs');
const path = require('path');

const USER_AGENT = 'FlyRankInternshipA9/1.0 (https://github.com/7chapatti/PoliteScraper)';
const TIMEOUT_MS = 8000;
const DELAY_MS = 600;
const CACHE_DIR = path.join(__dirname, '..', 'cache');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cachePathFor(url) {
  const safe = url.replace(/[^a-z0-9]/gi, '_');
  return path.join(CACHE_DIR, `${safe}.html`);
}

async function politeFetchOnce(url, stats) {
  const cachePath = cachePathFor(url);

  if (fs.existsSync(cachePath)) {
    const html = fs.readFileSync(cachePath, 'utf-8');
    console.log(`CACHE HIT ${url} (${html.length} bytes)`);
    stats.cacheHits++;
    return { html, status: 200, fromCache: true };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  stats.pagesFetched++;

  let response;
  try {
    response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(timer);
    return { html: null, status: 0, fromCache: false, error: err.message };
  }
  clearTimeout(timer);

  if (response.status !== 200) {
    return { html: null, status: response.status, fromCache: false };
  }

  const html = await response.text();
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cachePath, html, 'utf-8');
  console.log(`FETCH ${url} -> ${response.status} (${html.length} bytes)`);

  await sleep(DELAY_MS); 
  return { html, status: response.status, fromCache: false };
}

async function fetchPage(url, stats) {
  let result = await politeFetchOnce(url, stats);

  const shouldRetry = !result.fromCache && (result.status === 0 || result.status >= 500);
  if (shouldRetry) {
    console.log(`RETRY ${url}`);
    await sleep(1000);
    result = await politeFetchOnce(url, stats);
  }
  return result;
}

module.exports = { fetchPage, sleep, USER_AGENT };

