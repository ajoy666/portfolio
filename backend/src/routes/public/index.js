const express = require('express');
const router = express.Router();

router.use('/about', require('./about.routes'));
router.use('/social-links', require('./socialLink.routes'));
router.use('/skills', require('./skill.routes'));
router.use('/projects', require('./project.routes'));
router.use('/contact', require('./contact.routes'));
router.use('/cv', require('./cv.routes'));

module.exports = router;
