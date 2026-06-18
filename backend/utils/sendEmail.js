const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((err, success) => {
  if (err) {
  } else {
  }
});

async function sendEmail({ to, subject, html, text }) {
  try {
    const info = await transporter.sendMail({
      from: `"HT - Shop" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text,
    });
    return { success: true, info };
  } catch (err) {
    return { success: false, error: err };
  }
}

module.exports = sendEmail;
