const functions = require("firebase-functions");
const nodemailer = require("nodemailer");

// Create transporter with your email service credentials
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your preferred email service
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.app_password,
  },
});

exports.sendDietPlanEmail = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be logged in to send email."
    );
  }

  try {
    const mailOptions = {
      from: `"Diet Planning Assistant" <${functions.config().email.user}>`,
      to: data.to,
      subject: data.subject,
      html: data.html,
    };

    await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: "Email sent successfully",
    };
  } catch (error) {
    console.error("Email sending error:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Error sending email: " + error.message
    );
  }
});
