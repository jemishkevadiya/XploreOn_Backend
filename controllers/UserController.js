// controllers/UserController.js

const User = require('../models/User');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

class UserController {
  /**
   * Create User - No local password storage
   * If you are fully moving to Auth0, you may want to remove this entirely
   * or limit it just to storing the profile data.
   */
  static async createUser(req, res) {
    const { firstname, lastname, email, role } = req.body;

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const newUser = new User({
        firstname,
        lastname,
        email,
        role,
      });

      await newUser.save();

      return res.status(201).json({
        message: 'User created successfully',
        user: { firstname, lastname, email, role },
      });
    } catch (error) {
      return res.status(500).json({ message: 'Error creating user', error });
    }
  }

  /**
   * Get User Profile
   */
  static async getUserProfile(req, res) {
    try {
      const { email } = req.params;
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found' });
      return res.json(user);
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching user profile', error });
    }
  }

  /**
   * Update User - No local password update
   */
  static async updateUser(req, res) {
    const { email } = req.params;
    const { firstname, lastname, newEmail } = req.body;

    try {
      console.log(`Updating user with email: ${email}`);
      console.log(`Request Body:`, req.body);

      const existingUser = await User.findOne({ email });
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if the newEmail is used by another user
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
        },
        { new: true }
      );

      return res.status(200).json({
        message: 'User updated successfully',
        user: {
          firstname: updatedUser.firstname,
          lastname: updatedUser.lastname,
          email: updatedUser.email,
        },
      });
    } catch (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ message: 'Error updating user', error });
    }
  }

  /**
   * Retrieve Bookings for User
   */
  static async getUserBookings(req, res) {
    try {
      const { email } = req.params;
      const bookings = await Booking.find({ userEmail: email });
      return res.json({ bookings });
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching bookings', error });
    }
  }

  /**
   * Retrieve Notifications for User
   */
  static async getUserNotifications(req, res) {
    try {
      const { email } = req.params;
      const notifications = await Notification.find({ userEmail: email });
      return res.json({ notifications });
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching notifications', error });
    }
  }

  /**
   * Mark Notification as Read
   */
  static async markNotificationAsRead(req, res) {
    const { notificationId } = req.body;
    try {
      await Notification.findByIdAndUpdate(notificationId, { read: true });
      return res.json({ message: 'Notification marked as read' });
    } catch (error) {
      return res.status(500).json({ message: 'Error updating notification', error });
    }
  }
}

module.exports = UserController;
