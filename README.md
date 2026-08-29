# Books to Scrape — Polite Scraper

## Target classification

### Target site

**Books to Scrape**  
https://books.toscrape.com/

Books to Scrape is a sandbox website created for practising web scraping.

### Why this site?

This site is appropriate for the assignment because it is specifically designed as a practice/sandbox website for scraping.

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

### Responsible-use statement

I will not reuse this code on another site without checking its rules and terms first.
