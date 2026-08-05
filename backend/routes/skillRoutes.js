const express = require('express');
const router = express.Router();
const { createSkill, getSkills, getSkillById, updateSkill, deleteSkill } = require('../controllers/skillController');
const { protect } = require('../middleware/auth');
const { skillValidation } = require('../middleware/validation');

router.route('/')
  .post(protect, skillValidation, createSkill)
  .get(getSkills);

router.route('/:id')
  .get(getSkillById)
  .put(protect, skillValidation, updateSkill)
  .delete(protect, deleteSkill);

module.exports = router;
