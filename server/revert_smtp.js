const fs = require('fs');

let serverJs = fs.readFileSync('server.js', 'utf8');

// Replace imports
serverJs = serverJs.replace(
  /const \{ MailerSend, EmailParams, Sender, Recipient \} = require\('mailersend'\);\nconst speakeasy = require\('speakeasy'\);\nconst qrcode = require\('qrcode'\);/,
  "const nodemailer = require('nodemailer');"
);
// In case MailerSend only
serverJs = serverJs.replace(
  /const \{ MailerSend, EmailParams, Sender, Recipient \} = require\('mailersend'\);/,
  "const nodemailer = require('nodemailer');"
);

// Add Transporter where mailerSend was
serverJs = serverJs.replace(
  /const mailerSend = new MailerSend\(\{\n    apiKey: process.env.MAILERSEND_API_KEY \|\| 'your_mailersend_api_key',\n\}\);/,
  `const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});`
);

// Replace Login OTP Logic
const loginTarget = /if \(!user\.totp_secret \|\| !user\.is_totp_enabled\) \{[\s\S]*?res\.json\(\{ requires_totp: true, message: "Enter Google Authenticator Code" \}\);\n        \}/;
const loginSMTP = `const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60000); 

        await pool.query('UPDATE users SET otp = ?, otp_expiry = ? WHERE id = ?', [otp, expiry, user.id]);

        try {
            const mailOptions = {
                from: \`"CAM Admins" <\${process.env.SMTP_USER}>\`,
                to: email,
                subject: "Admin Login OTP",
                html: \`<h2>Your OTP is: <b>\${otp}</b></h2>\`
            };
            await transporter.sendMail(mailOptions);
            console.log(\`[OTP] Sent to \${email}.\`);
        } catch (mailErr) {
            console.log(\`[OTP] FALLBACK: User=\${email}, Code=\${otp}\`);
        }

        res.json({ message: "OTP sent" });`;
if (serverJs.match(loginTarget)) {
    serverJs = serverJs.replace(loginTarget, loginSMTP);
} else {
    // If mailersend OTP was there
    const mailersendLoginTarget = /const otp = Math\.floor[\s\S]*?res\.json\(\{ message: "OTP sent" \}\);/;
    serverJs = serverJs.replace(mailersendLoginTarget, loginSMTP);
}

// Replace Verify OTP Logic
const verifyTarget = /if \(!user\.totp_secret\) \{[\s\S]*?res\.json\(\{ message: "Success", token \}\);/;
const verifySMTP = `if (user.otp !== otp) return res.status(401).json({ error: "Invalid OTP" });
        if (new Date() > new Date(user.otp_expiry)) return res.status(401).json({ error: "OTP expired" });

        await pool.query('UPDATE users SET otp = NULL, otp_expiry = NULL WHERE id = ?', [user.id]);
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'super_secret', { expiresIn: '30m' });
        res.json({ message: "Success", token });`;

if (serverJs.match(verifyTarget)) {
    serverJs = serverJs.replace(verifyTarget, verifySMTP);
} else {
    // if mailersend OTP was there and we are just changing verification? verification didn't use mailersend directly, it was math, so verify is same.
    const verifyOriginal = /if \(user\.otp !== otp\)[\s\S]*?res\.json\(\{ message: "Success", token \}\);/;
    serverJs = serverJs.replace(verifyOriginal, verifySMTP);
}

// Replace Contact Form
const contactTarget = /const sentFrom = new Sender\(process\.env\.MAILERSEND_SENDER_EMAIL[\s\S]*?await mailerSend\.email\.send\(emailParams\);/;
const contactSMTP = `const mailOptions = {
            from: \`"CAM Holdings Website" <\${process.env.SMTP_USER}>\`,
            to: contactEmail,
            replyTo: \`\${fullName} <\${email}>\`,
            subject: subject ? \`Contact Form: \${subject}\` : \`New Contact Form Submission — CAM Holdings\`,
            html: htmlBody
        };
        await transporter.sendMail(mailOptions);`;
// Do it twice (Contact form + Request Information uses the exact same block structure)
while (serverJs.match(contactTarget)) {
    serverJs = serverJs.replace(contactTarget, function(match) {
        if(match.includes('propertyId')) {
            return `const mailOptions = {
            from: \`"CAM Holdings Website" <\${process.env.SMTP_USER}>\`,
            to: contactEmail,
            replyTo: \`\${name} <\${email}>\`,
            subject: \`Property Inquiry: \${propertyTitle || \`Property #\${propertyId}\`} — CAM Holdings\`,
            html: htmlBody
        };
        await transporter.sendMail(mailOptions);`;
        } else {
            return contactSMTP;
        }
    });
}

fs.writeFileSync('server.js', serverJs);
try { fs.writeFileSync('dist/server.js', serverJs); } catch(e) {}

// Revert login.html
let loginHtml = fs.readFileSync('login.html', 'utf8');

// Replace QR block
const qrBlock = /<div id="qrContainer"[^>]*>[\s\S]*?<\/div>\s*<label id="otpLabel"[^>]*>.*?<\/label>/i;
const originalLabel = \`<label style="text-align: center; margin-bottom: 1rem;">Enter the 6-digit OTP sent to your email.</label>\`;
loginHtml = loginHtml.replace(qrBlock, originalLabel);

// Replace JS logic
const jsLogicBlock = /if \(data\.requires_setup\) \{[\s\S]*?if \(data\.qr_code\) \{[\s\S]*?\}/i;
loginHtml = loginHtml.replace(jsLogicBlock, "");

fs.writeFileSync('login.html', loginHtml);
try { fs.writeFileSync('dist/login.html', loginHtml); } catch(e) {}

console.log("Files successfully reversed to NodeMailer SMTP!");
