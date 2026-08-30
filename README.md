# Books to Scrape — Polite Scraper

## Target classification

### Target site

**Books to Scrape**  
https://books.toscrape.com/

Books to Scrape is a sandbox website created for practising web scraping.

### Why this site?

This site is appropriate for the assignment because it is specifically designed as a practice website for scraping.

### Scope

The scraper will only cover the **first 3 catalogue pages** of Books to Scrape.

This means the scraper will discover and process the books listed across those three catalogue pages only.

### Data collected

For each book, the scraper will collect:

- Title
- Product URL
- Price
- Availability
- Rating
- Description
- Source page
- Fetch timestamp

This is appropriate because these are publicly displayed book details provided by the sandbox site and are needed to demonstrate the scraping, extraction, normalization, and validation pipeline.

### robots.txt check

I requested:

`https://books.toscrape.com/robots.txt`

The server returned **HTTP 404 Not Found**, so **no robots file was found** at that location.
A missing robots.txt file was treated as a missing file, not as permission to scrape other websites.

Run command (after using npm install):
npm start

Below is a proof screenshot of the report: 
<img width="432" height="220" alt="image" src="https://github.com/user-attachments/assets/54015abc-ea9e-48bb-a543-41f5667158f3" />

Below is a proof screenshot of tests:
<img width="622" height="132" alt="image" src="https://github.com/user-attachments/assets/12f10b62-71ea-4c1d-8c15-1c1e5a596260" />

Outputs land in `output/books.json`, `output/errors.json`, `output/run-report.json`. Cached HTML lives in `cache/` (git-ignored) so re-running during development doesn't hit the site again.


## Politeness rules

- Identifies itself: `User-Agent: FlyRankInternshipA9/1.0 (https://github.com/7chapatti/PoliteScraper)` 
- 8s timeout per request.
- 600ms delay after every real (non-cached) network request.
- Checks status code before parsing; only `200` is treated as a real page.
- Retries once on timeout or `5xx`; never retries `404` or `403`.
- Reads from `cache/` on every subsequent run instead of re-hitting the site.

### Responsible-use statement

I will not reuse this code on another site without checking its rules and terms first.

## Record schema

```json
{
  "title": "string",
  "product_url": "string (absolute URL, canonical id)",
  "price_text": "string, e.g. £51.77",
  "price_gbp": "number",
  "availability_text": "string",
  "rating_text": "string | null",
  "description": "string | null",
  "source_page": "string (absolute URL)",
  "fetched_at": "ISO 8601 string"
}
```

## Why no browser was needed

The book data (title, price, availability, rating, description) is present directly in the server-rendered HTML — view-source on any catalogue or product page shows it as plain text, no JavaScript execution required. A headless browser would only add startup cost and memory for zero extra data.

## Ethics note

Use an official API when one exists instead of scraping. Never bypass logins, paywalls, CAPTCHAs, or explicit blocks. Collect only the fields you actually need, cache aggressively during development so the site is hit once, and identify yourself honestly so a site owner can find and contact you if needed.

## Limitation

It's slow on purpose because of the implemented delay. It wouldn't scale well with a larger number of books. 
