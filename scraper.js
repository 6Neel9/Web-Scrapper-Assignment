const axios = require('axios');
const cheerio = require('cheerio');

function extractEmailsFromHTML(html) {
  const emails = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  return emails ? [...new Set(emails)] : [];
}

function extractPhonesFromHTML(html) {
  const phones = html.match(/(?:\+?\d{1,2}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/g);
  return phones ? [...new Set(phones)] : [];
}

async function findContactPage($, baseUrl) {
  const keywords = ['contact', 'support', 'help', 'get-in-touch'];
  const links = [];

  $('a').each((i, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().toLowerCase();

    if (keywords.some(k => href.toLowerCase().includes(k) || text.includes(k))) {
      let fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).href;
      links.push(fullUrl);
    }
  });

  return links[0] || null;
}

async function scrapeCompanies(urls) {
  const results = [];

  for (const url of urls) {
    try {
      const res = await axios.get(url);
      const $ = cheerio.load(res.data);
      const html = res.data;

      const title = $('title').text() || 'N/A';
      const emails = extractEmailsFromHTML(html);
      const phones = extractPhonesFromHTML(html);

      let contactUrl = await findContactPage($, url);
      let contactEmails = [], contactPhones = [];

      if (contactUrl) {
        try {
          const contactRes = await axios.get(contactUrl);
          const contactHtml = contactRes.data;
          contactEmails = extractEmailsFromHTML(contactHtml);
          contactPhones = extractPhonesFromHTML(contactHtml);
        } catch (err) {
          console.warn(`Failed to fetch contact page: ${contactUrl}`);
        }
      }

      results.push({
        company: title,
        url,
        contactPage: contactUrl || 'Not found',
        emails: [...new Set([...emails, ...contactEmails])],
        phones: [...new Set([...phones, ...contactPhones])]
      });

    } catch (err) {
      results.push({
        company: 'Error fetching page',
        url,
        contactPage: 'N/A',
        emails: [],
        phones: [],
        error: err.message
      });
    }
  }

  return results;
}

module.exports = { scrapeCompanies };
