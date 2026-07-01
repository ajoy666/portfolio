const multer = require('multer');
const path = require('path');
const { ensurePublicFolder } = require('../utils/storage');

function createStorage(folder) {
  return multer.diskStorage({
    destination(req, file, cb) {
      const destination = ensurePublicFolder(folder);
      cb(null, destination);
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      const safeBaseName = baseName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      cb(null, `${Date.now()}-${safeBaseName}${ext}`);
    },
  });
}

function fileFilter(allowedMimeTypes) {
  return (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      return cb(null, true);
    }

    return cb(new Error('Invalid file type'));
  };
}

const uploadAboutPhoto = multer({
  storage: createStorage('about'),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: fileFilter([
    'image/jpeg',
    'image/png',
    'image/webp',
  ]),
});

const uploadCv = multer({
  storage: createStorage('cv'),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: fileFilter([
    'application/pdf',
  ]),
});

const uploadProjectScreenshot = multer({
  storage: createStorage('projects'),
  limits: {
    fileSize: 3 * 1024 * 1024,
  },
  fileFilter: fileFilter([
    'image/jpeg',
    'image/png',
    'image/webp',
  ]),
});

const uploadSkillIcon = multer({
  storage: createStorage('skills'),
  limits: {
    fileSize: 1 * 1024 * 1024,
  },
  fileFilter: fileFilter([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
  ]),
});

module.exports = {
  uploadAboutPhoto,
  uploadCv,
  uploadProjectScreenshot,
  uploadSkillIcon,
};