const express = require('express');
const path = require('path');
const fs = require('fs');
const cvGenerator = require('../../utils/cvGenerator');

const router = express.Router();

// GET /cv/download  →  download the generated PDF
// GET /cv/preview   →  open inline in browser
router.get(['/', '/download', '/preview'], (req, res) => {
  if (!cvGenerator.exists()) {
    return res.status(404).json({ message: 'CV has not been generated yet.' });
  }

  const filePath = cvGenerator.getOutputPath();
  const isPreview = req.path === '/preview';

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    isPreview ? 'inline; filename="cv.pdf"' : 'attachment; filename="Azi_Fauzi_CV.pdf"'
  );

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

module.exports = router;
