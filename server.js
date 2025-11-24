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

var LocalStorage = require('node-localstorage').LocalStorage;
LocalStorage = new LocalStorage('./scratch'); //this will need to be addressed when deploying probably

var Mailgun = require('mailgun.js');
const mailgun = new Mailgun(FormData);

const mailgunClient = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY,
    url: 'https://api.mailgun.net/'
});
//models
const StoredToken = require('./models/storedToken');
const user = require('./models/user');
const Event = require('./models/event');

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
        //const db = client.db('COP4331Cards');
        // Note: passwords are stored unhashed in this project (not recommended)
        const LogUser = await user.findOne({ Email: email,  Password: password });
        if (LogUser == undefined) return res.status(401).json({ error: 'Invalid credentials' });
        console.log(LogUser.Verified);
        if(LogUser.Verified == false) return res.status(401).json({ error: 'Email not verified, please register again!' });

        // Create a JWT for authenticated sessions
        const jwt = require('jsonwebtoken');
        const jwtSecret = process.env.JWT_SECRET;
        //const payload = { userId: LogUser._id.toString(), email: LogUser.Email };
        const token = jwt.sign(
            { email },
            jwtSecret,
            { expiresIn: '1d' } // 24 hours
        );

		//LocalStorage.setItem('token', token);

		const st_token = new StoredToken({ //actually works now lul
            token: token,
			userId: await user.exists({Email : email}),
			expiry: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
		});
        const ifSaved = await StoredToken.exists({userId : st_token.userId});
        if(!ifSaved)
        {
            await st_token.save();
        }
        else
        {
            await StoredToken.findOneAndUpdate({userId : st_token.userId}, {$set:{token: st_token.token, expiry: new Date(Date.now() + 60 * 60 * 1000)}});
        }
        return res.status(200).json({ ok: true, userId: LogUser._id, name: LogUser.email, Token: token });
        console.log('login successful for user:', token);
    } catch (err) {
        console.error('login error', err);
        return res.status(500).json({ error: 'Login failed' });
    }
});

// registration + email verification using jsonwebtoken and nodemailer
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');




// POST /api/register
// body: { email, password }
app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'email and password are required' });
        }

        //const db = client.db('COP4331Cards');

        // prevent duplicate email
        const existing = await user.exists({Email : email}); //make this use mongoose at some point
        if (await user.exists({Email : email})) {
            console.log('existing user found:', existing);
            const userInQ = await user.findOne({Email: email});
            if(userInQ.Verified)
            {  
                return res.status(400).json({ error: 'Email already registered' });
            }
        }
		const userDoc = new user({
			Email: email,
			Password: password
		});
        const savedUser = await user.findOneAndUpdate(
            { Email: email },
            { $setOnInsert: userDoc }, 
            { upsert: true, new: true }
        ).exec();
        const genCode = (len = 6) => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjklmnpqrstuvwxyz0123456789'; // excludes I,O,i,o
            let out = '';
            for (let i = 0; i < len; i++) {
                out += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return out;
        };
        const verifyCode = genCode(6);
        // create JWT verification token
        const jwt = require('jsonwebtoken');
        const jwtSecret = process.env.JWT_SECRET;
        const token = jwt.sign(
            { email },
            jwtSecret,
            { expiresIn: '1d' } // 24 hours
        );

		//LocalStorage.setItem('token', token);

		const st_token = new StoredToken({ //actually works now lul
            token: token,
			userId: await user.exists({Email : email}),
			expiry: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
		});
        //LocalStorage.setItem('token', token);
        const token_succ = await st_token.save();
        if(!token_succ) return res.status(400).json({error: "could not save token"});
        const messageData = {
        from: process.env.MAILGUN_ADDRESS,
        to: email,
        subject: 'Register your account!',
        text: 'use this code ' + verifyCode.toString() + ' to verify your account'
        };
        mailgunClient.messages.create(process.env.MAILGUN_DOMAIN, messageData)
        .then(res => {
            console.log(res);
        })
        .catch(err => {
            console.error(err);
        });
        res.status(201).json({ ok: true, Token: token, verify: verifyCode });
    } catch (err) {
        console.error('register error', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/request-password-reset', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Missing email' });

        const f_user = await user.findOne({ Email: email });

        // Always return 200 to avoid leaking whether email exists
        if (!f_user) {
            return res.status(200).json({ ok: true });
        }
        const resetCode = (len = 6) => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjklmnpqrstuvwxyz0123456789'; // excludes I,O,i,o
            let out = '';
            for (let i = 0; i < len; i++) {
                out += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return out;
        };
        const code = resetCode(6);
        const messageData = {
        from: process.env.MAILGUN_ADDRESS,
        to: email,
        subject: 'Reset your password',
        text: 'use this code ' + code.toString() + ' to verify your account'
        };
        mailgunClient.messages.create(process.env.MAILGUN_DOMAIN, messageData)
        .then(res => {
            console.log(res);
        })
        .catch(err => {
            console.error(err);
        });
        //await transporter.sendMail(mailOptions);
        res.status(200).json({ ok: true, resetCode: code });
    } catch (err) {
        console.error('request-password-reset error', err);
        res.status(500).json({ error: 'Failed to request password reset' });
    }
});

// POST /api/reset-password
// body: { token, newPassword }
app.post('/api/reset-password', async (req, res) => {
    try {
        const { code, newPassword, email, serverCode } = req.body;
        if (!code || !newPassword) return res.status(400).json({ error: 'Missing reset code or newPassword' });

        //const serverCode = LocalStorage.getItem('resetCode');
        if (!serverCode || code !== serverCode) {
            return res.status(400).json({ error: 'Invalid or expired code' });
        }


        //const email = LocalStorage.getItem('resetUserEmail');
        if (!email) return res.status(400).json({ error: 'No email associated with reset request' });

        // Note: per project style no hashing used
        const update = await user.findOneAndUpdate(
            { Email: email },
            { $set: { Password: newPassword } }
        ).exec();
        if (!update) return res.status(404).json({ error: 'User not found' });

        res.status(200).json({ ok: true });
    } catch (err) {
        console.error('reset-password error', err);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});


/**
 * Simple verification comparison helper
 * Returns true only when both are 6-char strings and exactly equal (case-sensitive)
 */
function verifyCodes(serverCode, userCode) {
    if (typeof serverCode !== 'string' || typeof userCode !== 'string') return false;
    if (serverCode.length !== 6 || userCode.length !== 6) return false;
    return serverCode === userCode;
}

// POST /api/verify-code
// body: { serverCode, userCode }
// If codes match, find the user referenced by the JWT stored in server local storage
// and set their Verified flag to true.
app.post('/api/verify-code/:Email', async (req, res) => {
    try {
        const { userCode, verifyCode } = req.body;
        const { E_id } = req.params['Email'];
        console.log('verify-code called with userCode:', userCode);
        //const serverCode = LocalStorage.getItem('verifyCode');
        console.log('serverCode from local storage:', verifyCode);
        if (!verifyCode || !userCode) return res.status(400).json({ error: 'Missing serverCode or userCode' });

        if (!verifyCodes(verifyCode, userCode)) {
            return res.status(400).json({ error: 'Verification codes do not match' });
        }
        console.log('Finding user with email:', req.params['Email']);
        // Mark user as verified
        const updated = await user.findOneAndUpdate(
            { Email: req.params['Email'] },
            { $set: { Verified: true } }
        ).exec();
        if (!updated) return res.status(404).json({ error: 'User not found' });

        return res.status(200).json({ ok: true});
    } catch (err) {
        console.error('verify-code error', err);
        return res.status(500).json({ error: 'Verification failed' });
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
app.get('/api/events', async (req, res) => { //works (?) queries correctly
    try {
        console.log('get /api/events called');
        const db = client.db('COP4331Cards');
        const events = await db.collection('events').find({}).toArray();
        // return an array (could be empty)
        return res.status(200).json(Array.isArray(events) ? events : []);
    } catch (err) {
        console.error('get /api/events error', err);
        return res.status(500).json({ error: 'Failed to load events' });
    }
});

// GET /api/me
// Read token from server LocalStorage, look up StoredToken in MongoDB, check expiry,
// then return the associated user (without password).
app.post('/api/me', async (req, res) => {
    console.log('GET /api/me called');
  try {
    if(!req.body) return res.status(401).json({error: 'bad request'});
    const tk = req.body.Token;
    console.log(tk);
    if (!tk) return res.status(401).json({ error: 'Missing token' });

    const stored = await StoredToken.findOne({ token: tk }).exec();
    if (!stored) return res.status(401).json({ error: 'Token not found or expired' });

    if (stored.expiry && new Date(stored.expiry) < new Date()) {
      return res.status(401).json({ error: 'Token expired' });
    }
    //console.log('will find');
    const userId = stored.userId;
    if (!userId) return res.status(400).json({ error: 'Token has no user association' });
    //console.log('loadin: ', userId);

    const found = await user.findOne( {_id: userId });
    if (!found) return res.status(404).json({ error: 'User not found' });

    return res.status(200).json(found);
  } catch (err) {
    console.error('GET /api/me error', err);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});
