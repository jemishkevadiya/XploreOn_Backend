const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');

router.put('/update/:email', UserController.updateUser);  
router.get('/bookings/:email', UserController.getUserBookings);  
router.get('/notifications/:email', UserController.getUserNotifications);
router.post('/notifications/mark-read', UserController.markNotificationAsRead);
router.post('/create', UserController.createUser);
router.get('/profile/:uid', UserController.getUserProfile);

module.exports = router;