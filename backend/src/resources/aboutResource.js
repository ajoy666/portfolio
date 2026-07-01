const assetUrl = require('../utils/assetUrl');

function aboutResource(about) {
  if (!about) {
    return null;
  }

  return {
    id: about.id,
    name: about.name,
    tagline: about.tagline,
    bio: about.bio,
    email: about.email,
    location: about.location,
    photo_url: about.photo ? assetUrl(about.photo) : null,
    updated_at: about.updated_at,
  };
}

module.exports = aboutResource;
