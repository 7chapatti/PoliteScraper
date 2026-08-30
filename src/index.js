const fs = require('fs');
const path = require('path');

const { fetchPage } = require('./fetcher');
const { extractCataloguePage, extractBookDetail } = require('./extract');
const { normalizeRecord } = require('./normalize');
const { BookRecord } = require('./schema');

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const START_URL = 'https://books.toscrape.com/catalogue/page-1.html';
const MAX_CATALOGUE_PAGES = 3;

async function discoverBookUrls(stats) {
  const links = new Set();
  let pageUrl = START_URL;
  let pageCount = 0;

  while (pageUrl && pageCount < MAX_CATALOGUE_PAGES) {
    const result = await fetchPage(pageUrl, stats);
    pageCount++;

    if (!result.html) {
      console.error(`Failed catalogue page: ${pageUrl} (status ${result.status})`);
      stats.failedPages++;
      break;
    }

    const { links: pageLinks, nextUrl } = extractCataloguePage(result.html, pageUrl);
    pageLinks.forEach((l) => links.add(l));
    pageUrl = pageCount < MAX_CATALOGUE_PAGES ? nextUrl : null;
  }

  console.log(`catalogue_pages=${pageCount} discovered=${links.size} unique_urls=${links.size}`);
  return links;
}

async function scrapeBookDetails(urls, stats) {
  const validRecords = [];
  const errors = [];

  for (const url of urls) {
    const result = await fetchPage(url, stats);

    if (!result.html) {
      stats.failedPages++;
      errors.push({ url, reason: `fetch failed (status ${result.status})` });
      continue;
    }

    const raw = extractBookDetail(result.html, url, START_URL);
    const normalized = normalizeRecord(raw);
    const parsed = BookRecord.safeParse(normalized);

    if (!parsed.success) {
      errors.push({ url, reason: parsed.error.issues.map((i) => i.message).join('; ') });
      continue;
    }

    validRecords.push(parsed.data);
  }

  return { validRecords, errors };
}

function dedupeByUrl(records) {
  const byUrl = new Map();
  for (const rec of records) byUrl.set(rec.product_url, rec);
  return Array.from(byUrl.values());
}

async function main() {
  const startedAt = Date.now();
  const stats = { pagesFetched: 0, cacheHits: 0, failedPages: 0 };

  const bookUrls = await discoverBookUrls(stats);
  const urls = Array.from(bookUrls);

  if (process.env.INJECT_BROKEN_URL === '1') {
    urls.push('https://books.toscrape.com/catalogue/this-book-does-not-exist_9999/index.html');
  }

  const { validRecords, errors } = await scrapeBookDetails(urls, stats);
  const finalRecords = dedupeByUrl(validRecords);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'books.json'), JSON.stringify(finalRecords, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'errors.json'), JSON.stringify(errors, null, 2));

  const report = {
    started_at: new Date(startedAt).toISOString(),
    duration_ms: Date.now() - startedAt,
    pages_fetched: stats.pagesFetched,
    cache_hits: stats.cacheHits,
    valid_records: finalRecords.length,
    invalid_records: errors.length,
    failed_pages: stats.failedPages
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'run-report.json'), JSON.stringify(report, null, 2));

  console.log('Run report:', report);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
