exports.setApp = function( app, client ) {
app.post('/api/login', async (req, res) => {
    try {
        // Expect { email, password } in body (project uses Email field on users)
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

        const db = client.db('COP4331Cards');
        // Note: passwords are stored unhashed in this project (not recommended)
        const user = await db.collection('Users').findOne({ Email: email, Password: password });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        // Create a JWT for authenticated sessions
        const jwt = require('jsonwebtoken');
        const jwtSecret = process.env.JWT_SECRET || 'strongest_secret_evar';
        const payload = { userId: user._id.toString(), email: user.Email };
        const token = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });

        return res.status(200).json({ ok: true, userId: user._id.toString(), name: user.DisplayName, token });
    } catch (err) {
        console.error('login error', err);
        return res.status(500).json({ error: 'Login failed' });
    }
});

// registration + email verification using jsonwebtoken and nodemailer
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// POST /api/register
// body: { displayname, email, password }
app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'email and password are required' });
        }

        const db = client.db('COP4331Cards');

        // prevent duplicate email
        const existing = await db.collection('Users').findOne({ Email: email });
        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // create user (note: no bcrypt used per request)
        const userDoc = {
            //DisplayName: displayname,
            Email: email,
            Password: password,
            Verified: false,
            CreatedAt: new Date()
        };

        const insertResult = await db.collection('Users').insertOne(userDoc);
        const userId = insertResult.insertedId; // ObjectId

        // create JWT verification token
        const jwtSecret = process.env.JWT_SECRET || 'replace_this_with_strong_secret';
        const token = jwt.sign(
            { userId: userId.toString(), email },
            jwtSecret,
            { expiresIn: '1d' } // 24 hours
        );

        const verifyUrlBase = process.env.FRONTEND_VERIFY_URL || 'http://localhost:3000/verify?token=';
        const verifyUrl = verifyUrlBase + encodeURIComponent(token);

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: email,
            subject: 'Verify your account',
            text: `Hello , please verify your account: ${verifyUrl}`,
            html: `<p>Hello ,</p><p>Please verify your account by clicking <a href="${verifyUrl}">this link</a>.</p>`
        };

        await transporter.sendMail(mailOptions);

        res.status(201).json({ ok: true, userId: userId.toString() });
    } catch (err) {
        console.error('register error', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /api/verify-token
// body: { token }
app.post('/api/verify-token', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: 'Missing token' });

        const jwtSecret = process.env.JWT_SECRET || 'replace_this_with_strong_secret';
        let payload;
        try {
            payload = jwt.verify(token, jwtSecret);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        const db = client.db('COP4331Cards');
        const userId = payload.userId;
        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid user id in token' });
        }

        const update = await db.collection('Users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { Verified: true } }
        );

        if (update.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ ok: true });
    } catch (err) {
        console.error('verify-token error', err);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// POST /api/request-password-reset
// body: { email }
app.post('/api/request-password-reset', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Missing email' });

        const db = client.db('COP4331Cards');
        const user = await db.collection('Users').findOne({ Email: email });

        // Always return 200 to avoid leaking whether email exists
        if (!user) {
            return res.status(200).json({ ok: true });
        }

        const jwtSecret = process.env.JWT_SECRET || 'replace_this_with_strong_secret';
        const token = jwt.sign(
            { userId: user._id.toString(), purpose: 'password_reset' },
            jwtSecret,
            { expiresIn: '1h' } // short expiry
        );

        const resetUrlBase = process.env.FRONTEND_RESET_URL || 'http://localhost:3000/reset-password?token=';
        const resetUrl = resetUrlBase + encodeURIComponent(token);

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: email,
            subject: 'Reset your password',
            text: `Hello , reset your password: ${resetUrl}`,
            html: `<p>Hello ,</p><p>Reset your password by clicking <a href="${resetUrl}">this link</a>. This link expires in 1 hour.</p>`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ ok: true });
    } catch (err) {
        console.error('request-password-reset error', err);
        res.status(500).json({ error: 'Failed to request password reset' });
    }
});

// POST /api/reset-password
// body: { token, newPassword }
app.post('/api/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) return res.status(400).json({ error: 'Missing token or newPassword' });

        const jwtSecret = process.env.JWT_SECRET || 'replace_this_with_strong_secret';
        let payload;
        try {
            payload = jwt.verify(token, jwtSecret);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        if (payload.purpose !== 'password_reset' || !payload.userId) {
            return res.status(400).json({ error: 'Invalid token' });
        }

        const userId = payload.userId;
        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid user id in token' });
        }

        const db = client.db('COP4331Cards');

        // Note: per project style no hashing used
        const update = await db.collection('Users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { Password: newPassword, PasswordResetAt: new Date() } }
        );

        if (update.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ ok: true });
    } catch (err) {
        console.error('reset-password error', err);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

}