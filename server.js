require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const sharp = require('sharp');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the root directory
app.use(express.static(__dirname));

// Clean URL Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'about.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'contact.html')));
app.get('/property', (req, res) => res.sendFile(path.join(__dirname, 'property.html')));

// Multer Storage Configuration (Memory to allow Sharp compression before disk)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB per file
});

// Database Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cam_real_estate',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()
    .then(conn => {
        console.log("Connected to MySQL successfully!");
        conn.release();
    })
    .catch(err => {
        console.error("Error connecting to MySQL:", err.message);
    });

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Access Denied." });

    jwt.verify(token, process.env.JWT_SECRET || 'super_secret', (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token." });
        req.user = user;
        next();
    });
}

// ----------------Config Endpoint----------------
app.get('/api/config', (req, res) => {
    res.json({ 
        whatsappNumber: process.env.WHATSAPP_NUMBER || '94778983618' 
    });
});

// ----------------Auth Endpoints----------------
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ error: "Invalid credentials" });

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json({ error: "Invalid credentials" });

        // Check if TOTP is already enabled
        if (!user.is_totp_enabled) {
            // Generate temporary secret for setup
            const secret = speakeasy.generateSecret({
                name: `CAM Holdings (${email})`
            });
            
            const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
            
            // Store temporary secret for verification (this will be confirmed in /verify)
            await pool.query('UPDATE users SET totp_secret = ? WHERE id = ?', [secret.base32, user.id]);

            return res.json({ 
                message: "TOTP setup required", 
                setupRequired: true,
                qrCode: qrCodeUrl,
                secret: secret.base32
            });
        }

        res.json({ message: "TOTP token required", setupRequired: false });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

app.post('/api/auth/verify', async (req, res) => {
    try {
        const { email, token } = req.body;
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ error: "User not found" });

        const user = users[0];
        if (!user.totp_secret) return res.status(400).json({ error: "TOTP not configured" });

        const verified = speakeasy.totp.verify({
            secret: user.totp_secret,
            encoding: 'base32',
            token: token
        });

        if (!verified) {
            return res.status(401).json({ error: "Invalid authentication code" });
        }

        // If this was the setup phase, mark as enabled
        if (!user.is_totp_enabled) {
            await pool.query('UPDATE users SET is_totp_enabled = 1 WHERE id = ?', [user.id]);
        }

        const jwtToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'super_secret', { expiresIn: '30m' });
        res.json({ message: "Success", token: jwtToken });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Verification failed" });
    }
});

app.post('/api/auth/register', authenticateToken, async (req, res) => {
    try {
        const { email, password } = req.body;
        const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ error: "User exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await pool.query('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, hashedPassword]);
        res.status(201).json({ message: "Admin created" });
    } catch (err) {
        res.status(500).json({ error: "Failed" });
    }
});

// ----------------Apartment Endpoints----------------
app.get('/api/apartments', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT a.*, 
            (SELECT GROUP_CONCAT(image_url) FROM apartment_images ai WHERE ai.apartment_id = a.id) as gallery_images
            FROM apartments a ORDER BY a.created_at DESC
        `);
        // Parse gallery string into array
        const formatted = rows.map(r => ({
            ...r,
            gallery: r.gallery_images ? r.gallery_images.split(',') : []
        }));
        res.json(formatted);
    } catch (err) {
        console.error("GET /api/apartments error:", err);
        res.status(500).json({ error: "Failed to fetch" });
    }
});

app.get('/api/apartments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(`
            SELECT a.*, 
            (SELECT GROUP_CONCAT(image_url) FROM apartment_images ai WHERE ai.apartment_id = a.id) as gallery_images
            FROM apartments a WHERE a.id = ?
        `, [id]);
        
        if (rows.length === 0) return res.status(404).json({ error: "Apartment not found" });
        
        const apt = rows[0];
        apt.gallery = apt.gallery_images ? apt.gallery_images.split(',') : [];
        res.json(apt);
    } catch (err) {
        console.error("GET /api/apartments/:id error:", err);
        res.status(500).json({ error: "Failed to fetch apartment" });
    }
});

app.post('/api/apartments', authenticateToken, upload.array('images', 5), async (req, res) => {
    try {
        const data = req.body;
        let mainImage = null;
        let galleryImages = [];

        // Image compression via sharp
        if (req.files && req.files.length > 0) {
            const uploadDir = path.join(__dirname, 'cam-holdings-pvt-ltd', 'public', 'uploads');
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

            for (let i = 0; i < req.files.length; i++) {
                const filename = `apt_${Date.now()}_${i}.webp`;
                const filepath = path.join(uploadDir, filename);

                await sharp(req.files[i].buffer)
                    .rotate()
                    .resize({ width: 1400, withoutEnlargement: true })
                    .webp({ quality: 75 })
                    .toFile(filepath);

                const relativePath = '/uploads/' + filename;
                if (i === 0) mainImage = relativePath;
                else galleryImages.push(relativePath);
            }
        }

        const query = `
            INSERT INTO apartments 
            (title, description, detailed_description, neighborhood_info, price, location, image_url, bedrooms, bathrooms, area_sqft, property_type, status, availability_status, complex_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            data.title, data.description, data.detailed_description||'', data.neighborhood_info||'', data.price, data.location, mainImage,
            data.bedrooms||0, data.bathrooms||0, data.area_sqft||0, data.property_type||'Apartment', data.status||'For Sale',
            data.availability_status||'Available', data.complex_name||''
        ];

        const [result] = await pool.execute(query, values);
        const apartmentId = result.insertId;

        if (galleryImages.length > 0) {
            const imgVals = galleryImages.map(img => `(${apartmentId}, '${img}')`).join(',');
            await pool.query(`INSERT INTO apartment_images (apartment_id, image_url) VALUES ${imgVals}`);
        }

        res.status(201).json({ message: "Apartment added" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to add apartment" });
    }
});

app.put('/api/apartments/:id', authenticateToken, upload.array('images', 5), async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        
        // Handling image overwrite if new images are uploaded
        if (req.files && req.files.length > 0) {
            const uploadDir = path.join(__dirname, 'cam-holdings-pvt-ltd', 'public', 'uploads');
            let mainImage = null;
            let galleryImages = [];

            for (let i = 0; i < req.files.length; i++) {
                const filename = `apt_${Date.now()}_${i}.webp`;
                const filepath = path.join(uploadDir, filename);

                await sharp(req.files[i].buffer)
                    .rotate()
                    .resize({ width: 1400, withoutEnlargement: true })
                    .webp({ quality: 75 })
                    .toFile(filepath);

                const relativePath = '/uploads/' + filename;
                if (i === 0) mainImage = relativePath;
                else galleryImages.push(relativePath);
            }

            // Unlink physically previous images
            const [oldMain] = await pool.query('SELECT image_url FROM apartments WHERE id = ?', [id]);
            const [oldGallery] = await pool.query('SELECT image_url FROM apartment_images WHERE apartment_id = ?', [id]);
            [...(oldMain[0] && oldMain[0].image_url ? [oldMain[0].image_url] : []), ...oldGallery.map(g => g.image_url)].forEach(img => {
                const p = path.join(__dirname, img);
                if (fs.existsSync(p)) fs.unlinkSync(p);
            });

            // DB Updates for images
            await pool.query('UPDATE apartments SET image_url=? WHERE id=?', [mainImage, id]);
            await pool.query('DELETE FROM apartment_images WHERE apartment_id=?', [id]);
            if (galleryImages.length > 0) {
                const imgVals = galleryImages.map(img => `(${id}, '${img}')`).join(',');
                await pool.query(`INSERT INTO apartment_images (apartment_id, image_url) VALUES ${imgVals}`);
            }
        }

        const query = `
            UPDATE apartments SET 
            title=?, description=?, detailed_description=?, neighborhood_info=?, price=?, location=?, bedrooms=?, bathrooms=?, area_sqft=?, property_type=?, status=?, availability_status=?, complex_name=?
            WHERE id=?
        `;
        const values = [
            data.title, data.description, data.detailed_description||'', data.neighborhood_info||'', data.price, data.location, data.bedrooms||0, data.bathrooms||0, data.area_sqft||0, data.property_type||'Apartment', data.status||'For Sale', data.availability_status||'Available', data.complex_name||'', id
        ];

        await pool.execute(query, values);
        res.json({ message: "Updated" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Update failed" });
    }
});

app.delete('/api/apartments/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        // Unlink images physically
        const [oldMain] = await pool.query('SELECT image_url FROM apartments WHERE id = ?', [id]);
        const [oldGallery] = await pool.query('SELECT image_url FROM apartment_images WHERE apartment_id = ?', [id]);
        const imgs = [];
        if (oldMain[0] && oldMain[0].image_url) imgs.push(oldMain[0].image_url);
        oldGallery.forEach(g => imgs.push(g.image_url));

        imgs.forEach(img => {
            const p = path.join(__dirname, img);
            if (fs.existsSync(p)) fs.unlinkSync(p);
        });

        // MySQL ON DELETE CASCADE will delete apartment_images automatically
        await pool.query('DELETE FROM apartments WHERE id = ?', [id]);
        res.json({ message: "Deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete" });
    }
});

// ----------------Email Template Builder----------------
function getLogoBase64() {
    try {
        const logoPath = path.join(__dirname, 'assets', 'img', 'logo', 'logo3.png');
        return fs.readFileSync(logoPath).toString('base64');
    } catch (e) {
        return null;
    }
}

function buildEmailTemplate({ title, subtitle, badgeLabel, badgeColor, rows, footerNote }) {
    const logoB64 = getLogoBase64();
    const logoTag = logoB64
        ? `<img src="data:image/png;base64,${logoB64}" alt="CAM Holdings" style="height:54px; max-width:200px; object-fit:contain;" />`
        : `<span style="font-size:22px; font-weight:800; color:#c9a84c; letter-spacing:1px;">CAM Holdings</span>`;

    const badge = badgeLabel
        ? `<span style="display:inline-block; background:${badgeColor || '#c9a84c'}; color:#1a1a1a; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; padding:4px 14px; border-radius:30px; margin-bottom:18px;">${badgeLabel}</span>`
        : '';

    const rowsHtml = rows.map(r => `
        <tr>
            <td style="padding:10px 0; border-bottom:1px solid #f0e6c8; width:38%; vertical-align:top;">
                <span style="font-size:12px; font-weight:700; color:#a08030; text-transform:uppercase; letter-spacing:0.8px;">${r.label}</span>
            </td>
            <td style="padding:10px 0 10px 16px; border-bottom:1px solid #f0e6c8; vertical-align:top;">
                <span style="font-size:14px; color:#2d2d2d; line-height:1.6;">${r.value}</span>
            </td>
        </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f0e8; font-family:'Segoe UI', Arial, sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 30px rgba(0,0,0,0.10);">

          <!-- Header Gold Bar -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%); padding: 0; height:6px; font-size:0;">&nbsp;</td>
          </tr>

          <!-- Logo Bar -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #252525 100%); padding:28px 40px; text-align:center;">
              ${logoTag}
              <div style="margin-top:10px; font-size:11px; color:#c9a84c; letter-spacing:3px; text-transform:uppercase; font-weight:600;">Crown Asia Majestic Holdings (Pvt) Ltd</div>
            </td>
          </tr>

          <!-- Gold Accent Line -->
          <tr>
            <td style="background: linear-gradient(90deg, #c9a84c 0%, #f0d070 50%, #c9a84c 100%); height:4px; font-size:0;">&nbsp;</td>
          </tr>

          <!-- Hero Section -->
          <tr>
            <td style="padding:40px 40px 24px 40px; text-align:center; background:#fffdf8;">
              ${badge}
              <h1 style="margin:0 0 10px 0; font-size:26px; font-weight:800; color:#1a1a1a; line-height:1.3;">${title}</h1>
              ${subtitle ? `<p style="margin:0; font-size:15px; color:#666; line-height:1.6;">${subtitle}</p>` : ''}
            </td>
          </tr>

          <!-- Divider with Icon -->
          <tr>
            <td style="padding:0 40px;">
              <div style="display:flex; align-items:center; margin:4px 0 24px 0;">
                <div style="flex:1; height:1px; background:linear-gradient(90deg, transparent, #c9a84c66);"></div>
                <div style="width:8px; height:8px; background:#c9a84c; border-radius:50%; margin:0 12px;"></div>
                <div style="flex:1; height:1px; background:linear-gradient(90deg, #c9a84c66, transparent);"></div>
              </div>
            </td>
          </tr>

          <!-- Details Card -->
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <div style="background:#fffbf2; border:1px solid #e8d99a; border-radius:12px; padding:24px 28px; border-left:4px solid #c9a84c;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${rowsHtml}
                </table>
              </div>
            </td>
          </tr>

          <!-- Footer Note -->
          ${footerNote ? `
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <div style="background:#1a1a1a; border-radius:10px; padding:18px 24px; text-align:center;">
                <p style="margin:0; font-size:13px; color:#c9a84c; line-height:1.6;">${footerNote}</p>
              </div>
            </td>
          </tr>` : ''}

          <!-- Gold Bottom Bar -->
          <tr>
            <td style="background: linear-gradient(90deg, #c9a84c 0%, #f0d070 50%, #c9a84c 100%); height:4px; font-size:0;">&nbsp;</td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1a1a1a; padding:28px 40px; text-align:center;">
              <p style="margin:0 0 8px 0; font-size:13px; color:#c9a84c; font-weight:600; letter-spacing:1px; text-transform:uppercase;">CAM Holdings Real Estate</p>
              <p style="margin:0 0 6px 0; font-size:12px; color:#888;">52/1 Battaramulla, Colombo, Sri Lanka</p>
              <p style="margin:0 0 12px 0; font-size:12px; color:#888;">
                <a href="tel:0775407847" style="color:#c9a84c; text-decoration:none;">077 540 7847</a>
                &nbsp;•&nbsp;
                <a href="mailto:properties@camholdings.lk" style="color:#c9a84c; text-decoration:none;">properties@camholdings.lk</a>
              </p>
              <p style="margin:0; font-size:11px; color:#555;">© ${new Date().getFullYear()} CAM Holdings. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ----------------Contact Form Endpoint----------------
app.post('/api/contact', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, subject, message } = req.body;
        if (!firstName || !email) return res.status(400).json({ error: "Name and email are required." });

        const contactEmail = process.env.CONTACT_EMAIL || process.env.SMTP_USER;
        const fullName = `${firstName} ${lastName || ''}`.trim();

        const htmlBody = buildEmailTemplate({
            title: 'New Contact Inquiry',
            subtitle: 'Someone has submitted the contact form on the CAM Holdings website.',
            badgeLabel: 'Contact Form',
            badgeColor: '#c9a84c',
            rows: [
                { label: 'Full Name',  value: fullName },
                { label: 'Email',      value: `<a href="mailto:${email}" style="color:#c9a84c;">${email}</a>` },
                { label: 'Phone',      value: phone || '<em style="color:#aaa;">Not provided</em>' },
                { label: 'Subject',    value: subject || '<em style="color:#aaa;">Not provided</em>' },
                { label: 'Message',    value: (message || '<em style="color:#aaa;">No message</em>').replace(/\n/g, '<br>') },
            ],
            footerNote: 'Reply directly to this email to respond to the inquiry. The sender\'s email has been set as the reply-to address.'
        });

        await transporter.sendMail({
            from: `"CAM Holdings Website" <${process.env.SMTP_USER}>`,
            to: contactEmail,
            replyTo: email,
            subject: subject ? `Contact Form: ${subject}` : `New Contact Form Submission — CAM Holdings`,
            html: htmlBody
        });

        console.log(`[Contact] Email sent from ${email} to ${contactEmail}`);
        res.json({ message: "Message sent successfully." });
    } catch (err) {
        console.error("[Contact] Error:", err.message);
        res.status(500).json({ error: "Failed to send message." });
    }
});

// ----------------Property Request Information Endpoint----------------
app.post('/api/request-information', async (req, res) => {
    try {
        const { name, email, phone, propertyId, propertyTitle } = req.body;
        if (!name || !email) return res.status(400).json({ error: "Name and email are required." });

        const contactEmail = process.env.CONTACT_EMAIL || process.env.SMTP_USER;

        const htmlBody = buildEmailTemplate({
            title: 'Property Information Request',
            subtitle: 'A visitor has requested more details or a private showing for a property.',
            badgeLabel: 'Property Inquiry',
            badgeColor: '#d4a017',
            rows: [
                { label: 'Property',   value: `<strong>${propertyTitle || 'N/A'}</strong> <span style="color:#aaa; font-size:12px;">(ID: ${propertyId || 'N/A'})</span>` },
                { label: 'Name',       value: name },
                { label: 'Email',      value: `<a href="mailto:${email}" style="color:#c9a84c;">${email}</a>` },
                { label: 'Phone',      value: phone || '<em style="color:#aaa;">Not provided</em>' },
                { label: 'Request',    value: 'This visitor is requesting more information or to schedule a private showing.' },
            ],
            footerNote: 'Reply directly to this email to follow up with the interested buyer. The sender\'s email has been set as the reply-to address.'
        });

        await transporter.sendMail({
            from: `"CAM Holdings Website" <${process.env.SMTP_USER}>`,
            to: contactEmail,
            replyTo: email,
            subject: `Property Inquiry: ${propertyTitle || `Property #${propertyId}`} — CAM Holdings`,
            html: htmlBody
        });

        console.log(`[RequestInfo] Email sent for property ${propertyId} from ${email} to ${contactEmail}`);
        res.json({ message: "Request sent successfully." });
    } catch (err) {
        console.error("[RequestInfo] Error:", err.message);
        res.status(500).json({ error: "Failed to send request." });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

