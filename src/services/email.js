const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendOTP = async (email, otp) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Fluxor News Login Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #333; text-align: center;">Welcome to Fluxor News</h2>
                    <p style="color: #666; font-size: 16px;">Here is your one-time verification code to log in:</p>
                    <div style="background-color: #f4f4f4; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #000;">${otp}</span>
                    </div>
                    <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

const sendNewsletter = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: Array.isArray(to) ? to.join(',') : to, // Nodemailer supports comma-separated list
            subject: subject,
            html: html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Newsletter sent: ' + info.response);
        return true;
    } catch (error) {
        console.error('Error sending newsletter:', error);
        return false;
    }
};

module.exports = { sendOTP, sendNewsletter };
