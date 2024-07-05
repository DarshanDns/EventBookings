// server.js

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const Razorpay = require('razorpay');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// // Connect to MongoDB (update database names as needed)
// mongoose.connect('mongodb://localhost:27017/combinedDB', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// }).then(() => {
//     console.log("Connected to MongoDB");
// }).catch(err => {
//     console.error("Error connecting to MongoDB:", err);
// });

// // User schema
// const userSchema = new mongoose.Schema({
//     username: String,
//     email: String,
//     password: String,
//     profilePicture: {
//         data: Buffer, // Store image data as binary
//         contentType: String // Store content type of the image
//     }
// });

// // Payment schema
// const paymentSchema = new mongoose.Schema({
//     orderId: String,
//     paymentId: String,
//     signature: String,
//     amount: Number,
//     currency: String,
//     status: String,
//     created_at: { type: Date, default: Date.now }
// });

// const User = mongoose.model('User', userSchema);
// const Payment = mongoose.model('Payment', paymentSchema);

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/combinedDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to MongoDB");
}).catch(err => {
    console.error("Error connecting to MongoDB:", err);
});

// Unified User schema
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    profilePicture: {
        data: Buffer, // Store image data as binary
        contentType: String // Store content type of the image
    },
    bookings: [{
        orderId: String,
        paymentId: String,
        signature: String,
        amount: Number,
        currency: String,
        status: String,
        created_at: { type: Date, default: Date.now }
    }]
});

const User = mongoose.model('User', userSchema);

// Multer configuration for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: 'rzp_test_bcr3VPyl56DHa1',
    key_secret: 'Sqc04FP355GoilX1iAUdZ0Kb'
});

// Routes for user registration and login
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.post('/register', upload.single('profile-picture'), async (req, res) => {
    try {
        const { username, email, password } = req.body;

        let profilePictureData = null;
        let profilePictureContentType = null;
        if (req.file) {
            profilePictureData = req.file.buffer;
            profilePictureContentType = req.file.mimetype;
        }

        const newUser = new User({
            username,
            email,
            password,
            profilePicture: {
                data: profilePictureData, 
                contentType: profilePictureContentType 
            }
        });

        await newUser.save();
        res.status(201).send("User registered successfully!");
    } catch (err) {
        console.error("Error registering user:", err);
        res.status(500).send("Error registering user. Please try again later.");
    }
});

app.get("/login", (req, res) => {
    res.sendFile(__dirname + "/login.html");
});

app.get('/profile', (req, res) => {
    res.sendFile(__dirname + "/profile.html");
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (!existingUser || existingUser.password !== password) {
            return res.status(400).send("Invalid email or password.");
        }

        res.status(200).send({ userid: existingUser._id, msg: "Login successful!" });
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).send("Error during login. Please try again later.");
    }
});

app.get('/user/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }
        res.json({
            profilePicture: {
                data: user.profilePicture.data.toString('base64'),
                contentType: user.profilePicture.contentType
            }
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: "Error fetching user data. Please try again later." });
    }
});



// app.get('/ticket-booking', (req, res) => {
//     res.sendFile(__dirname + "/script.html");
// });

app.get('/ticket-booking/:userid', (req, res) => {
    const userId = req.params.userid;
    console.log(userId); 
    res.sendFile(__dirname + "/script.html");
});



// Routes for payment
app.post('/create-order', async (req, res) => {
    const options = {
        amount: req.body.amount,
        currency: 'INR',
        receipt: 'order_rcptid_11',
        payment_capture: 1 
    };

    try {
        const response = await razorpay.orders.create(options);
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/verify-payment', async (req, res) => {
    const { orderId, paymentId, signature, amount, currency, status } = req.body;

    const shasum = crypto.createHmac('sha256', razorpay.key_secret);
    shasum.update(`${orderId}|${paymentId}`);
    const digest = shasum.digest('hex');

    if (digest !== signature) {
        return res.status(400).json({ error: 'Invalid signature' });
    }

    const payment = new Payment({
        orderId,
        paymentId,
        signature,
        amount,
        currency,
        status
    });

    try {
        await payment.save();
        res.json({ success: true, message: 'Payment verified and stored' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save payment data' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
