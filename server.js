const express = require('express');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
const url = process.env.MONGODB_URI;
const client = new MongoClient(url);
const mongoose = require('mongoose');
const mongoUri = process.env.MONGODB_URI;
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('mongoose connected'))
  .catch(err => console.error('mongoose connection error', err));
 
client.connect();
const bodyParser = require('body-parser');
const cors = require('cors');
//const eventRoutes = require('./routes/eventRoutes');
const userRoutes = require('./routes/userRoutes');
const { startCleanup } = require('./utils/cleanup');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
//app.use('/api/events', eventRoutes);
app.use('/', userRoutes);
//app.use('/api/events', eventRoutes);

//var api = require('./api.js');
//api.setApp( app, client );
//refactor all this later
app.post('/api/login', async (req, res) => { //works (tested in arc)
    try {
        // Expect { email, password } in body (project uses Email field on users)
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

        const db = client.db('COP4331Cards');
        // Note: passwords are stored unhashed in this project (not recommended)
        const user = await db.collection('users').findOne({ email: email, password: password });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        // Create a JWT for authenticated sessions
        const jwt = require('jsonwebtoken');
        const jwtSecret = process.env.JWT_SECRET || 'strongest_secret_evar';
        const payload = { userId: user._id.toString(), email: user.Email };
        const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });

		localStorage.setItem('token', token);

		await StoredToken.create({
			userId: user._id.toString(),
			token: token,
			expiry: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
		});

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

      
        //const userDoc = {
            //DisplayName: displayname,
        //    Email: email,
        //    Password: password,
            //Verified: false,
            //CreatedAt: new Date()
        //};
		const userDoc = new User({
			email: email,
			password: password
		});
        const savedUser = await userDoc.save();	
        //const userId = insertResult.insertedId; // ObjectId

        // create JWT verification token
        const jwtSecret = process.env.JWT_SECRET || 'even_secreter_secret';
        const token = jwt.sign(
            { email },
            jwtSecret,
            { expiresIn: '1d' } // 24 hours
        );
		//add link to verift page
        const verifyUrlBase = process.env.FRONTEND_VERIFY_URL || 'http://localhost:3000/verify?token=';
        const verifyUrl = verifyUrlBase + encodeURIComponent(token);
		//add gmail stmp server
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


// Start server
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
	// Start periodic cleanup of expired events. Interval can be set with
	// the CLEANUP_INTERVAL_MS environment variable (milliseconds).
	try {
		startCleanup();
	} catch (err) {
		console.error('Failed to start cleanup scheduler', err);
	}
});
