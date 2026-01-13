const nodeMailer = require ("nodemailer") 

const sendEmail = async ({ email, subject, message }) => {
    const transporter = nodeMailer.createTransport({
      host: process.env.SMTP_HOST,
      service: process.env.SMTP_SERVICE,
      port: process.env.SMTP_PORT,
        secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  
    const options = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject,
      html: message,
    };
    await transporter.sendMail(options);
  };
  
  module.exports = sendEmail;