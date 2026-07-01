const express = require('express');
const getDb = require('../../config/db');
const skillCategoryResource = require('../../resources/skillCategoryResource');

const router = express.Router();

router.get('/', async (req, res) => {
  const db = await getDb();

  const categories = await db.all(`
    SELECT *
    FROM skill_categories
    ORDER BY "order" ASC, id ASC
  `);

  const skills = await db.all(`
    SELECT *
    FROM skills
    WHERE is_active = true
    ORDER BY "order" ASC, id ASC
  `);

  const categoriesWithSkills = categories.map((category) => ({
    ...category,
    skills: skills.filter((skill) => skill.skill_category_id === category.id),
  }));

  return res.json({
    data: categoriesWithSkills.map(skillCategoryResource),
  });
});

module.exports = router;
