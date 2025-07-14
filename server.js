const express = require('express');
const path = require('path');
const { scrapeCompanies } = require('./scraper');

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.render('index', { results: null, error: null });
});

app.post('/scrape', async (req, res) => {
  const { urls } = req.body;
  const urlList = urls.split('\n').map(u => u.trim()).filter(u => u);

  try {
    const results = await scrapeCompanies(urlList);
    res.render('index', { results, error: null });
  } catch (error) {
    res.render('index', { results: null, error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
