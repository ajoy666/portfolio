const express = require('express');
const router = express.Router();

router.use('/auth', require('../auth.routes'));
router.use('/contacts', require('./contact.routes'));
router.use('/social-links', require('./socialLink.routes'));
router.use('/about', require('./about.routes'));
router.use('/skill-categories', require('./skillCategory.routes'));
router.use('/skills', require('./skill.routes'));
router.use('/experiences', require('./experience.routes'));
router.use('/projects', require('./project.routes'));
router.use('/cv', require('./cv.routes'));

module.exports = router;
