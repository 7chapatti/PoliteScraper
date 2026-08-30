const { fetchPage } = require('./fetcher');

const PAGE_1 = 'https://books.toscrape.com/catalogue/page-1.html';

async function main() {
  const stats = { pagesFetched: 0, cacheHits: 0 };
  const result = await fetchPage(PAGE_1, stats);
  if (!result.html) throw new Error(`Page 1 fetch failed: status ${result.status}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
