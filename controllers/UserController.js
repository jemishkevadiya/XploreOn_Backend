const express = require('express');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const router = express.Router();

exports.createUser = async (req, res) => {
    const { firstname, lastname, email, password, role } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const newUser = new User({
            firstname,
            lastname,
            email,
            password,
            role,
        });

        await newUser.save();

        res.status(201).json({
            message: 'User created successfully',
            user: { firstname, lastname, email, role },
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user', error });
    }
};


exports.getUserProfile = async (req, res) => {
    try {
        const { email } = req.params;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user profile', error });
    }
};

exports.updateUser = async (req, res) => {
    const { email } = req.params;  
    const { firstname, lastname, password } = req.body;  
  
    try {
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
        user: { firstname: updatedUser.firstname, lastname: updatedUser.lastname, email: updatedUser.email},
      });
    } catch (error) {
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
