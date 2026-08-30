const cheerio = require('cheerio');

function extractCataloguePage(html, pageUrl) {
  const $ = cheerio.load(html);
  const links = [];
  $('article.product_pod h3 a').each((_, element) => {
    const href = $(element).attr('href');
    if (href) links.push(new URL(href, pageUrl).toString());
  });
  const nextHref = $('li.next a').attr('href');
  return { links, nextUrl: nextHref ? new URL(nextHref, pageUrl).toString() : null };
}

function extractBookDetail(html, productUrl, sourcePage) {
  const $ = cheerio.load(html);
  const main = $('div.product_main');
  const ratingClasses = (main.find('p.star-rating').attr('class') || '').split(/\s+/);
  const descriptionElement = $('#product_description').next('p');

  return {
    title: main.find('h1').text().trim(),
    product_url: productUrl,
    price_text: main.find('p.price_color').first().text().trim(),
    availability_text: main.find('p.availability').text().replace(/\s+/g, ' ').trim(),
    rating_text: ratingClasses.find((name) => name && name !== 'star-rating') || null,
    description: descriptionElement.length ? descriptionElement.text().trim() : null,
    source_page: sourcePage,
    fetched_at: new Date().toISOString()
  };
}

module.exports = { extractCataloguePage, extractBookDetail };
