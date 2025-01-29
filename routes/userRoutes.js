const express = require('express');
const UserController = require('../controllers/UserController');
const router = express.Router();

router.post('/create', UserController.createUser);
router.get('/profile/:email', UserController.getUserProfile);
router.put('/update/:email', UserController.updateUser);
router.get('/bookings/:email', UserController.getUserBookings);
router.get('/notifications/:email', UserController.getUserNotifications);
router.post('/notifications/read', UserController.markNotificationAsRead);

module.exports = router;
