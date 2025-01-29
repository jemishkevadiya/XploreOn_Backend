// routes/authRoutes.js
const express = require('express');
const { requiresAuth } = require('express-openid-connect');
const AuthController = require('../controllers/AuthController');

const router = express.Router();

// Option A: Rely primarily on built-in route /login, but show how to do custom:
router.get('/login', AuthController.login);

// Optionally, custom logout route
router.get('/logout', AuthController.logout);

// Custom callback route (you can override express-openid-connect’s default if desired)
router.get('/callback', AuthController.callback);

// Protected route example: /auth/profile
router.get('/profile', requiresAuth(), AuthController.profile);

module.exports = router;
