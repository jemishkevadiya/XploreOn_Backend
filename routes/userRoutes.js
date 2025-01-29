const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');

router.post('/create', UserController.createUser);
router.get('/profile/:email', UserController.getUserProfile);
router.put('/update/:email', UserController.updateUser);  
router.get('/bookings/:email', UserController.getUserBookings);  
router.get('/notifications/:email', UserController.getUserNotifications);
router.post('/notifications/mark-read', UserController.markNotificationAsRead);

module.exports = router;