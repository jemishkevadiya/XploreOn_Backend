const express = require('express');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const router = express.Router();

exports.createUser = async (req, res) => {
    try {
        console.log("🔥 Received request data:", req.body); // Debugging log

        const { uid, firstname, lastname, email, photoURL } = req.body;

        if (!uid || !firstname || !lastname || !email) {
            console.log("❌ Missing required fields:", req.body);
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Check if user already exists
        let existingUser = await User.findOne({ uid });
        if (existingUser) {
            console.log("ℹ️ User already exists:", existingUser);
            return res.status(200).json({ message: "User already exists", user: existingUser });
        }

        // ✅ Automatically assign "user" role (MongoDB default)
        const newUser = new User({ uid, firstname, lastname, email, photoURL });
        await newUser.save();

        console.log("✅ User stored successfully:", newUser);
        res.status(201).json({ message: "User created successfully", user: newUser });

    } catch (error) {
        console.error("❌ Error creating user:", error); // Log detailed error
        res.status(500).json({ message: "Error creating user", error: error.message });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        console.log("🔥 Fetching user with UID:", req.params.uid); // Debugging log

        // ✅ Ensure you are searching by `uid`
        const user = await User.findOne({ uid: req.params.uid });

        if (!user) {
            console.log("❌ User not found for UID:", req.params.uid);
            return res.status(404).json({ message: "User not found" });
        }

        console.log("✅ User found:", user);
        res.json(user);
    } catch (error) {
        console.error("❌ Error fetching user profile:", error);
        res.status(500).json({ message: "Error fetching user profile", error: error.message });
    }
};


exports.updateUser = async (req, res) => {
    const { email } = req.params;
    const { firstname, lastname, newEmail, password } = req.body;

    try {
        console.log(`Updating user with email: ${email}`);
        console.log(`Request Body:`, req.body);

        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (newEmail && newEmail !== email) {
            const emailExists = await User.findOne({ email: newEmail });
            if (emailExists) {
                return res.status(400).json({ message: 'Email already in use by another user' });
            }
        }

        const updatedUser = await User.findOneAndUpdate(
            { email },
            {
                firstname: firstname || existingUser.firstname,
                lastname: lastname || existingUser.lastname,
                email: newEmail || email,
                password: password || existingUser.password,
            },
            { new: true }
        );

        res.status(200).json({
            message: 'User updated successfully',
            user: { firstname: updatedUser.firstname, lastname: updatedUser.lastname, email: updatedUser.email },
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user', error });
    }
};


exports.getUserBookings = async (req, res) => {
    try {
        const { email } = req.params;
        const bookings = await Booking.find({ userEmail: email });
        res.json({ bookings });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bookings', error });
    }
};


exports.getUserNotifications = async (req, res) => {
    try {
        const { email } = req.params;
        const notifications = await Notification.find({ userEmail: email });
        res.json({ notifications });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications', error });
    }
};

exports.markNotificationAsRead = async (req, res) => {
    const { notificationId } = req.body;
    try {
        await Notification.findByIdAndUpdate(notificationId, { read: true });
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating notification', error });
    }
};