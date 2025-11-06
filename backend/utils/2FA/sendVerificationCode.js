const generateEmailTemplate = require ("./generateEmailTemplate")
const sendEmail = require("./sendEmail");

async function sendVerificationCode(verificationMethod, verificationCode, name, email, phone, res) {
    try {
      if (verificationMethod === "email") {
        const message = generateEmailTemplate(verificationCode);
        await sendEmail({ email, subject: "Your Verification Code", message });
        return {
          success: true,
          message: `Verification email successfully sent to ${name}`
        };
      } else if (verificationMethod === "phone") {
        const verificationCodeWithSpace = verificationCode.toString().split("").join(" ");
        await client.calls.create({
          twiml: `<Response><Say>Your verification code is ${verificationCodeWithSpace}. Your verification code is ${verificationCodeWithSpace}.</Say></Response>`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone,
        });
        return {
          success: true,
          message: `OTP sent.`
        };
      }
      return {
        success: false,
        message: "Invalid verification method."
      };
    } catch (error) {
      console.error("Verification code sending error:", error);
      throw new Error("Verification code failed to send.");
    }
  }


  module.exports = sendVerificationCode;