const cheerio = require('cheerio');

function extractCataloguePage(html, pageUrl) {
  const $ = cheerio.load(html);
  const links = [];

  $('article.product_pod h3 a').each((_, el) => {
    const href = $(el).attr('href');
    if (href) links.push(new URL(href, pageUrl).toString());
  });

  const nextHref = $('li.next a').attr('href');
  const nextUrl = nextHref ? new URL(nextHref, pageUrl).toString() : null;

  return { links, nextUrl };
}

function extractBookDetail(html, productUrl, sourcePage) {
  const $ = cheerio.load(html);
  const main = $('div.product_main');

  const title = main.find('h1').text().trim();
  const priceText = main.find('p.price_color').first().text().trim();
  const availabilityText = main.find('p.availability').text().replace(/\s+/g, ' ').trim();

  const ratingClasses = (main.find('p.star-rating').attr('class') || '').split(/\s+/);
  const ratingText = ratingClasses.find((c) => c && c !== 'star-rating') || null;

  const descriptionEl = $('#product_description').next('p');
  const description = descriptionEl.length ? descriptionEl.text().trim() : null;

  return {
    title,
    product_url: productUrl,
    price_text: priceText,
    availability_text: availabilityText,
    rating_text: ratingText,
    description,
    source_page: sourcePage,
    fetched_at: new Date().toISOString()
  };
}

module.exports = { extractCataloguePage, extractBookDetail };
