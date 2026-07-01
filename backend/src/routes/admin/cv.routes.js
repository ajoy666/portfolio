const express = require('express');
const authMiddleware = require('../../middlewares/authMiddleware');
const cvGenerator = require('../../utils/cvGenerator');

const router = express.Router();

router.use(authMiddleware);

// GET /admin/cv/status
// Returns metadata of the last generated CV (or null if never generated)
router.get('/status', (req, res) => {
  const meta = cvGenerator.getMeta();
  return res.json({
    exists: cvGenerator.exists(),
    meta: meta ?? null,
  });
});

// POST /admin/cv/generate
// Manually trigger CV re-generation
router.post('/generate', async (req, res) => {
  try {
    const meta = await cvGenerator.generate();
    return res.json({
      message: 'CV generated successfully.',
      meta,
    });
  } catch (err) {
    console.error('[cvGenerator] Error:', err);
    return res.status(500).json({
      message: 'Failed to generate CV.',
      error: err.message,
    });
  }
});

module.exports = router;
