// controllers/EmailController.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendConfirmationEmail = async (toEmail, paymentDetails) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: 'Booking Confirmation - XploreOn',
    text: `Your payment for ${paymentDetails.service} of amount $${(paymentDetails.amount / 100).toFixed(2)} has been received successfully. Your Payment ID is ${paymentDetails.paymentIntentId}. Thank you for choosing XploreOn!`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent to', toEmail);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = { sendConfirmationEmail };
