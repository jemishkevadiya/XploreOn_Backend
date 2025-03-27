const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController");
const admin = require("firebase-admin");
const Booking = require("../models/Booking");
const mongoose = require("mongoose");

router.use((req, res, next) => {
  console.log("Route hit:", req.method, req.path);
  next();
});

const authenticate = async (req, res, next) => {
  const token = req.headers.authtoken;
  if (!token) return res.status(401).json({ message: "No token" });
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log("Logged in user:", decodedToken.uid);
    req.user = decodedToken;
    next();
  } catch (e) {
    console.log("Bad token:", e.message);
    res.status(401).json({ message: "Bad token" });
  }
};

router.put("/update/:email", UserController.updateUser);
router.get("/user/:userId", authenticate, UserController.getUserBookings);
router.get("/notifications/:email", UserController.getUserNotifications);
router.post("/notifications/mark-read", UserController.markNotificationAsRead);
router.post("/create", UserController.createUser);
router.get("/profile/:uid", UserController.getUserProfile);

router.delete("/cancel/:bookingId", authenticate, async (req, res) => {
  const { bookingId } = req.params;
  console.log("Trying to cancel booking:", bookingId);
  try {
    const objectId = new mongoose.Types.ObjectId(bookingId);
    const booking = await Booking.findById(objectId);
    console.log("Booking found:", booking);
    if (!booking) {
      console.log("No booking with that ID!");
      return res.status(404).json({ message: "Booking not found" });
    }
    const refundAmount = booking.totalAmount || 0;
    const deleteResult = await Booking.deleteOne({ _id: objectId });
    console.log("Delete result:", deleteResult);
    if (deleteResult.deletedCount === 0) {
      console.log("Nothing deleted!");
      return res.status(500).json({ message: "Failed to delete booking" });
    }
    console.log("Booking deleted!");
    res.json({
      message: `Booking cancelled, $${refundAmount} refunded to your payment method`
    });
  } catch (e) {
    console.log("Cancel crashed:", e.message);
    res.status(500).json({ message:  "Crashed" + e.message });
  }
});

module.exports = router;