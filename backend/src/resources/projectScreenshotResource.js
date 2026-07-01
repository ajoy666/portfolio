const assetUrl = require('../utils/assetUrl');

function projectScreenshotResource(screenshot) {
  const url = screenshot.file_path ? assetUrl(screenshot.file_path) : null;
  return {
    id: screenshot.id,
    file_path: screenshot.file_path,
    original_name: screenshot.original_name,
    url,
    image_url: url,
    caption: screenshot.caption,
    is_thumbnail: Boolean(screenshot.is_thumbnail),
    order: screenshot.order,
    created_at: screenshot.created_at,
    updated_at: screenshot.updated_at,
  };
}

module.exports = projectScreenshotResource;