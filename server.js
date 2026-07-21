const path = require('path');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
  const wantsHtml = req.path.endsWith('.html');
  const isDirectoryPath =
    req.path === '/' || req.path.endsWith('/');

  if (wantsHtml || isDirectoryPath) {
    res.setHeader('Cache-Control', 'no-cache');
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
  console.log(`PatchPlay is running on http://localhost:${port}`);
});
