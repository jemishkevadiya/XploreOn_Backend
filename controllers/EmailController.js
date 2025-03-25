const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendConfirmationEmail = async (toEmail, paymentDetails) => {
  const mailOptions = {
    from: `"XploreOn Team" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Booking Confirmation - XploreOn',
    html: `
      <h2>Booking Confirmation</h2>
      <p>Dear customer,</p>
      <p>Your payment for <strong>${paymentDetails.service}</strong> of <strong>$${(paymentDetails.amount / 100).toFixed(2)}</strong> has been received successfully.</p>
      <p>Your Payment ID: <strong>${paymentDetails.paymentIntentId}</strong></p>
      <p>Thank you for choosing <strong>XploreOn</strong>!</p>
      <br>
      <p>Best regards,<br>XploreOn Team</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(` Confirmation email sent to ${toEmail}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = { sendConfirmationEmail };
