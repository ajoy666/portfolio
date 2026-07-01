function socialLinkResource(socialLink) {
  return {
    id: socialLink.id,
    platform: socialLink.platform,
    label: socialLink.label,
    url: socialLink.url,
    icon: socialLink.icon,
    order: socialLink.order,
    is_active: Boolean(socialLink.is_active),
    created_at: socialLink.created_at,
    updated_at: socialLink.updated_at,
  };
}

module.exports = socialLinkResource;