const cheerio = require('cheerio');

function extractCataloguePage(html, pageUrl) {
  const $ = cheerio.load(html);
  const links = [];

  $('article.product_pod h3 a').each((_, element) => {
    const href = $(element).attr('href');
    if (href) links.push(new URL(href, pageUrl).toString());
  });

  const nextHref = $('li.next a').attr('href');
  return {
    links,
    nextUrl: nextHref ? new URL(nextHref, pageUrl).toString() : null
  };
}

module.exports = { extractCataloguePage };
