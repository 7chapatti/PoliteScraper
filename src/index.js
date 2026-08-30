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
  const sourcesByBookUrl = new Map();
  let pageUrl = START_URL;
  let pageCount = 0;
  while (pageUrl && pageCount < MAX_CATALOGUE_PAGES) {
    const sourcePage = pageUrl;
    const result = await fetchPage(sourcePage, stats);
    if (!result.html) { stats.failedPages += 1; break; }
    pageCount += 1;
    const { links, nextUrl } = extractCataloguePage(result.html, sourcePage);
    for (const link of links) sourcesByBookUrl.set(link, sourcePage);
    pageUrl = pageCount < MAX_CATALOGUE_PAGES ? nextUrl : null;
  }
  console.log(`catalogue_pages=${pageCount} discovered=${sourcesByBookUrl.size} unique_urls=${sourcesByBookUrl.size}`);
  return sourcesByBookUrl;
}

async function scrapeAndValidate(sourcesByBookUrl, stats) {
  const goodRecords = [];
  const errors = [];
  let invalidRecords = 0;
  for (const [productUrl, sourcePage] of sourcesByBookUrl) {
    const result = await fetchPage(productUrl, stats);
    if (!result.html) {
      stats.failedPages += 1;
      errors.push({ url: productUrl, reason: `fetch failed (status ${result.status})` });
      continue;
    }
    const parsed = BookRecord.safeParse(normalizeRecord(extractBookDetail(result.html, productUrl, sourcePage)));
    if (parsed.success) goodRecords.push(parsed.data);
    else {
      invalidRecords += 1;
      errors.push({ url: productUrl, reason: parsed.error.issues.map((issue) => issue.message).join('; ') });
    }
  }
  return { goodRecords, errors, invalidRecords };
}

function dedupeByUrl(records) {
  return Array.from(new Map(records.map((record) => [record.product_url, record])).values());
}

async function main() {
  const startedAt = Date.now();
  const stats = { pagesFetched: 0, cacheHits: 0, failedPages: 0 };
  const sourcesByBookUrl = await discoverBookUrls(stats);
  if (process.env.INJECT_BROKEN_URL === '1') {
    sourcesByBookUrl.set('https://books.toscrape.com/catalogue/this-book-does-not-exist_9999/index.html', START_URL);
  }

  const { goodRecords, errors, invalidRecords } = await scrapeAndValidate(sourcesByBookUrl, stats);
  const books = dedupeByUrl(goodRecords);
  const report = {
    started_at: new Date(startedAt).toISOString(),
    duration_ms: Date.now() - startedAt,
    pages_fetched: stats.pagesFetched,
    cache_hits: stats.cacheHits,
    valid_records: books.length,
    invalid_records: invalidRecords,
    failed_pages: stats.failedPages
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'books.json'), JSON.stringify(books, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'errors.json'), JSON.stringify(errors, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'run-report.json'), JSON.stringify(report, null, 2));
  console.log('Run report:', report);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
