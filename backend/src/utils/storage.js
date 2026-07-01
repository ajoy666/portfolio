const fs = require('fs');
const path = require('path');

function publicStoragePath(relativePath = '') {
  return path.join(process.cwd(), 'storage', 'app', 'public', relativePath);
}

function deletePublicFile(relativePath) {
  if (!relativePath) {
    return;
  }

  const fullPath = publicStoragePath(relativePath);

  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

function ensurePublicFolder(folder) {
  const fullPath = publicStoragePath(folder);

  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }

  return fullPath;
}

module.exports = {
  publicStoragePath,
  deletePublicFile,
  ensurePublicFolder,
};