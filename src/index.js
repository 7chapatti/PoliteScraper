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
    if (!result.html) throw new Error(`Catalogue fetch failed: ${sourcePage} (${result.status})`);
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
  for (const [productUrl, sourcePage] of sourcesByBookUrl) {
    const result = await fetchPage(productUrl, stats);
    if (!result.html) throw new Error(`Detail fetch failed: ${productUrl} (${result.status})`);
    const parsed = BookRecord.safeParse(normalizeRecord(extractBookDetail(result.html, productUrl, sourcePage)));
    if (parsed.success) goodRecords.push(parsed.data);
    else errors.push({ url: productUrl, reason: parsed.error.issues.map((issue) => issue.message).join('; ') });
  }
  return { goodRecords, errors };
}

function dedupeByUrl(records) {
  return Array.from(new Map(records.map((record) => [record.product_url, record])).values());
}

async function main() {
  const stats = { pagesFetched: 0, cacheHits: 0 };
  const sourcesByBookUrl = await discoverBookUrls(stats);
  const { goodRecords, errors } = await scrapeAndValidate(sourcesByBookUrl, stats);
  const books = dedupeByUrl(goodRecords);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'books.json'), JSON.stringify(books, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'errors.json'), JSON.stringify(errors, null, 2));
  console.log(`valid_records=${books.length} invalid_records=${errors.length}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
