const assetUrl = require('../utils/assetUrl');

function skillResource(skill) {
  return {
    id: skill.id,
    skill_category_id: skill.skill_category_id,
    name: skill.name,
    icon: skill.icon,
    icon_url: skill.icon ? assetUrl(skill.icon) : null,
    level: skill.level,
    order: skill.order,
    is_active: Boolean(skill.is_active),
    created_at: skill.created_at,
    updated_at: skill.updated_at,
  };
}

module.exports = skillResource;