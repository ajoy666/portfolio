const skillResource = require('./skillResource');

function skillCategoryResource(category) {
  return {
    id: category.id,
    name: category.name,
    order: category.order,
    skills: (category.skills || []).map(skillResource),
    created_at: category.created_at,
    updated_at: category.updated_at,
  };
}

module.exports = skillCategoryResource;