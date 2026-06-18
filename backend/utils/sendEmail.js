const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail({ to, subject, html, text }) {
  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text,
    });

    console.log("Email sent:", data); 

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Resend error:", error);

    return {
      success: false,
      error,
    };
  }
}

module.exports = sendEmail;