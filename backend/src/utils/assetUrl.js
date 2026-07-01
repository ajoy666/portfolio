function assetUrl(filePath) {
  if (!filePath) {
    return null;
  }

  const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 8000}`;

  return `${appUrl}/storage/${filePath}`;
}

module.exports = assetUrl;