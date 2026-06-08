const express = require('express');
const { body } = require('express-validator');
const {
  submitContact,
  getMessages,
  markAsRead,
} = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const contactValidation = [
  body('name').trim().notEmpty(),
  body('email').isEmail(),
  body('phone').notEmpty(),
  body('subject').trim().notEmpty(),
  body('message').trim().notEmpty(),
];

router.post('/', contactValidation, submitContact);
router.get('/', protect, authorize('admin'), getMessages);
router.put('/:id/read', protect, authorize('admin'), markAsRead);

module.exports = router;
