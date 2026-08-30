function parsePriceGBP(priceText) {
  const match = String(priceText).match(/[\d.]+/);
  return match ? Number(match[0]) : NaN;
}

function normalizeRecord(raw) {
  return {
    ...raw,
    price_gbp: parsePriceGBP(raw.price_text)
  };
}

module.exports = { parsePriceGBP, normalizeRecord };
