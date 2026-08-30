const { fetchPage } = require('./fetcher');
const { extractCataloguePage, extractBookDetail } = require('./extract');

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

async function scrapeRawDetails(sourcesByBookUrl, stats) {
  const rawRecords = [];
  for (const [productUrl, sourcePage] of sourcesByBookUrl) {
    const result = await fetchPage(productUrl, stats);
    if (!result.html) throw new Error(`Detail fetch failed: ${productUrl} (${result.status})`);
    rawRecords.push(extractBookDetail(result.html, productUrl, sourcePage));
  }
  console.log('raw_record=', JSON.stringify(rawRecords[0], null, 2));
  console.log(`detail_pages=${rawRecords.length}`);
  return rawRecords;
}

async function main() {
  const stats = { pagesFetched: 0, cacheHits: 0 };
  const sourcesByBookUrl = await discoverBookUrls(stats);
  await scrapeRawDetails(sourcesByBookUrl, stats);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
