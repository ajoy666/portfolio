const express = require('express');
const getDb = require('../../config/db');
const authMiddleware = require('../../middlewares/authMiddleware');
const aboutResource = require('../../resources/aboutResource');
const { uploadAboutPhoto } = require('../../middlewares/uploadMiddleware');
const { deletePublicFile } = require('../../utils/storage');
const cvGenerator = require('../../utils/cvGenerator');

const router = express.Router();

router.use(authMiddleware);

function now() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function getUploadedRelativePath(folder, file) {
  if (!file) return null;
  return `${folder}/${file.filename}`;
}

function handleUploadError(error, req, res, next) {
  if (!error) return next();
  return res.status(422).json({ message: error.message || 'Upload failed' });
}

// Trigger CV re-generation in background (non-blocking)
function triggerCvRegen() {
  cvGenerator
    .generate()
    .catch((err) => console.error('[cvGenerator] Background regen failed:', err));
}

async function handleUpdateAbout(req, res) {
  const db = await getDb();

  const { name, tagline = null, bio, email = null, location = null } = req.body;

  if (!name || !bio) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: {
        ...(!name ? { name: ['The name field is required.'] } : {}),
        ...(!bio ? { bio: ['The bio field is required.'] } : {}),
      },
    });
  }

  const existingAbout = await db.get(`
    SELECT * FROM abouts ORDER BY id ASC LIMIT 1
  `);

  const timestamp = now();
  const uploadedPhotoPath = getUploadedRelativePath('about', req.file);

  if (existingAbout) {
    if (uploadedPhotoPath && existingAbout.photo) {
      deletePublicFile(existingAbout.photo);
    }

    await db.run(
      `UPDATE abouts
       SET name = ?, tagline = ?, bio = ?, email = ?, location = ?,
           photo = COALESCE(?, photo), updated_at = ?
       WHERE id = ?`,
      [name, tagline, bio, email, location, uploadedPhotoPath, timestamp, existingAbout.id]
    );

    const updatedAbout = await db.get('SELECT * FROM abouts WHERE id = ?', [existingAbout.id]);

    // Re-generate CV in background since profile data changed
    triggerCvRegen();

    return res.json({ data: aboutResource(updatedAbout) });
  }

  const result = await db.run(
    `INSERT INTO abouts (name, tagline, bio, email, location, photo, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    [name, tagline, bio, email, location, uploadedPhotoPath, timestamp, timestamp]
  );

  const createdAbout = await db.get('SELECT * FROM abouts WHERE id = ?', [result.lastID]);

  // Re-generate CV in background
  triggerCvRegen();

  return res.status(201).json({ data: aboutResource(createdAbout) });
}

router.put(
  '/',
  (req, res, next) => {
    uploadAboutPhoto.single('photo')(req, res, (error) => {
      handleUploadError(error, req, res, next);
    });
  },
  handleUpdateAbout
);

// Support POST with _method=PUT for compatibility
router.post(
  '/',
  (req, res, next) => {
    uploadAboutPhoto.single('photo')(req, res, (error) => {
      handleUploadError(error, req, res, next);
    });
  },
  handleUpdateAbout
);

module.exports = router;
