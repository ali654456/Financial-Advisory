const nodemailer = require('nodemailer');

// Create a reusable transporter object
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


// Function to send an email
const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text
  };
  
  // Send the email
  await transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };