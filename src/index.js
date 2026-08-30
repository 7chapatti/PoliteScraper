const { fetchPage } = require('./fetcher');
const { extractCataloguePage } = require('./extract');

const START_URL = 'https://books.toscrape.com/catalogue/page-1.html';
const MAX_CATALOGUE_PAGES = 3;

async function discoverBookUrls(stats) {
  const sourcesByBookUrl = new Map();
  let pageUrl = START_URL;
  let pageCount = 0;

  while (pageUrl && pageCount < MAX_CATALOGUE_PAGES) {
    const currentCataloguePage = pageUrl;
    const result = await fetchPage(currentCataloguePage, stats);
    if (!result.html) throw new Error(`Catalogue fetch failed: ${currentCataloguePage} (${result.status})`);

    pageCount += 1;
    const { links, nextUrl } = extractCataloguePage(result.html, currentCataloguePage);
    for (const link of links) sourcesByBookUrl.set(link, currentCataloguePage);
    pageUrl = pageCount < MAX_CATALOGUE_PAGES ? nextUrl : null;
  }

  console.log(`catalogue_pages=${pageCount} discovered=${sourcesByBookUrl.size} unique_urls=${sourcesByBookUrl.size}`);
  return sourcesByBookUrl;
}

async function main() {
  const stats = { pagesFetched: 0, cacheHits: 0 };
  await discoverBookUrls(stats);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
