const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');

router.post('/signup', UserController.signup);
router.get('/:id', UserController.getUserProfile);
router.put('/:id', UserController.updateProfile);

module.exports = router;