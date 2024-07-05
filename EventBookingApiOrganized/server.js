require('dotenv').config();

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const Razorpay = require('razorpay');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const { createCanvas } = require('canvas');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const fs = require('fs');


// const client = new OAuth2Client('YOUR_GOOGLE_CLIENT_ID');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());



app.use(express.static(path.join(__dirname)));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// mongoose.connect('mongodb://localhost:27017/combinedDB', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// }).then(() => {
//     console.log("Connected to MongoDB");
// }).catch(err => {
//     console.error("Error connecting to MongoDB:", err);
// });

mongoose.connect(process.env.MONGODB_ATLAS_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to MongoDB Atlas");
}).catch(err => {
    console.error("Error connecting to MongoDB Atlas:", err);
});

const ticketSchema = new mongoose.Schema({
    orderId: String,
    paymentId: String,
    signature: String,
    amount: Number,
    currency: String,
    status: String,
    concertName: String,
    created_at: { type: Date, default: Date.now }
});

const combinedSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    profilePicture: {
        data: Buffer,
        contentType: String
    },
    googleId: String,
    tickets: [ticketSchema]
});

// Define Event Schema
const eventSchema = new mongoose.Schema({
    title: String,
    description: String,
    time: String,
    venue: String,
    about: String,
    image: String,
    price: Number,
    date: String
});

const EventModel = mongoose.model('EventModel', eventSchema);

const CombinedModel = mongoose.model('CombinedModel', combinedSchema);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// function sendPaymentSummaryEmail(user, ticket) {
//     const mailOptions = {
//         from: process.env.EMAIL_USER,
//         to: user.email,
//         subject: 'Payment Summary for Your Ticket Booking',
//         text: `
//             Dear ${user.username},

//             Thank you for booking a ticket for the ${ticket.concertName} concert.

//             Here are your payment details:
//             - Order ID: ${ticket.orderId}
//             - Payment ID: ${ticket.paymentId}
//             - Amount: ${ticket.amount / 100} ${ticket.currency}
//             - Status: ${ticket.status}

//             We hope you enjoy the concert!

//             Best regards,
//             Your Concert Booking Team
//         `
//     };

//     transporter.sendMail(mailOptions, (error, info) => {
//         if (error) {
//             return console.log('Error sending email:', error);
//         }
//         console.log('Email sent:', info.response);
//     });
// }

// Endpoint to get event details by ID
app.get('/api/events/:id', async (req, res) => {
    try {
        const event = await EventModel.findById(req.params.id);
        if (event) {
            res.json(event);
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

function sendPaymentSummaryEmail(user, ticket) {
    const doc = new PDFDocument();
    const filename = `receipt_${ticket.orderId}.pdf`;
    const filePath = path.join(__dirname, filename);

    // Pipe the PDF into a file
    doc.pipe(fs.createWriteStream(filePath));

    // Add content to the PDF
    doc.fontSize(25).text('Payment Receipt', { align: 'center' });
    doc.moveDown();
    doc.fontSize(18).text(`Order ID: ${ticket.orderId}`);
    doc.fontSize(18).text(`Payment ID: ${ticket.paymentId}`);
    doc.fontSize(18).text(`Amount: ₹${ticket.amount}`);
    doc.fontSize(18).text(`Currency: ${ticket.currency}`);
    doc.fontSize(18).text(`Status: ${ticket.status}`);
    doc.fontSize(18).text(`Concert Name: ${ticket.concertName}`);
    doc.fontSize(18).text(`Username: ${user.username}`);
    doc.fontSize(18).text(`Email: ${user.email}`);
    doc.end();

    // Wait for the PDF to be fully written before sending the email
    doc.on('end', () => {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Payment Summary for Your Ticket Booking',
            text: `
                Dear ${user.username},

                Thank you for booking a ticket for the ${ticket.concertName} concert.

                Here are your payment details:
                - Order ID: ${ticket.orderId}
                - Payment ID: ${ticket.paymentId}
                - Amount: ₹${ticket.amount}
                - Status: ${ticket.status}

                We hope you enjoy the concert!

                Best regards,
                Your Concert Booking Team
            `,
            attachments: [
                {
                    filename: filename,
                    path: filePath
                }
            ]
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log('Error sending email:', error);
            }
            console.log('Email sent:', info.response);
            
            // Delete the PDF file after sending the email
            fs.unlinkSync(filePath);
        });
    });
}


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, async (token, tokenSecret, profile, done) => {
    try {
        let user = await CombinedModel.findOne({ googleId: profile.id });
        if (!user) {
            user = new CombinedModel({
                googleId: profile.id,
                username: profile.displayName,
                email: profile.emails[0].value,
            });
            await user.save();
        }
        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});


passport.deserializeUser(async (id, done) => {
    try {
        const user = await CombinedModel.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

app.get("/auth/google",
    passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login', 'email'] })
);

app.get("/auth/google/callback",
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        res.redirect(`/profile?userid=${req.user.id}`);
    }
);



app.get("/", (req, res) => {
    res.sendFile(__dirname + "/HTML/index.html");
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

        const newUser = new CombinedModel({
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
    res.sendFile(__dirname + "/HTML/login.html");
});

app.get('/profile', (req, res) => {
    res.sendFile(__dirname + "/HTML/profile.html");
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const existingUser = await CombinedModel.findOne({ email });
        if (!existingUser || existingUser.password !== password) {
            return res.status(400).send("Invalid email or password.");
        }

        res.status(200).send({ userid: existingUser._id, msg: "Login successful!" });
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).send("Error during login. Please try again later.");
    }
});


// app.get('/user/:id', async (req, res) => {
//     try {
//         const userId = req.params.id;
//         const user = await CombinedModel.findById(userId);
//         if (!user) {
//             return res.status(404).json({ error: "User not found." });
//         }
//         res.json({
//             profilePicture: {
//                 data: user.profilePicture.data.toString('base64'),
//                 contentType: user.profilePicture.contentType
//             }
//         });
//     } catch (error) {
//         console.error('Error fetching user data:', error);
//         res.status(500).json({ error: "Error fetching user data. Please try again later." });
//     }
// });

app.get('/user/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await CombinedModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        // Check if profile picture exists
        let profilePictureData = null;
        let profilePictureContentType = null;
        if (user.profilePicture && user.profilePicture.data && user.profilePicture.contentType) {
            profilePictureData = user.profilePicture.data.toString('base64');
            profilePictureContentType = user.profilePicture.contentType;
        }

        res.json({
            profilePicture: {
                data: profilePictureData,
                contentType: profilePictureContentType
            }
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: "Error fetching user data. Please try again later." });
    }
});


// app.get('/ticket-booking/:name/:userid', (req, res) => {
//     const userName = req.params.name;
//     const userId = req.params.userid;
    
//     console.log(userId);

//     if (userName === 'A.R.Rahman') {
//         res.sendFile(__dirname + "/script.html");
//     } else if (userName === 'Anirudh') {
//         res.sendFile(__dirname + "/anirudh.html");
//     } else {
//         res.status(404).send('Page not found');
//     }
// });

app.get('/dynamic', (req, res) => {
    res.sendFile(__dirname + "/HTML/dynamic.html");
});

const concertPages = {
    'A.R.Rahman': 'script.html',
    'Anirudh': 'anirudh.html',
    'Vijay Antony':'vijayantony.html',
    'Free Event': 'free_event.html'
};

app.get('/ticket-booking/:name/:userid', (req, res) => {
    const userName = req.params.name;
    const userId = req.params.userid;

    console.log(userId);

    const filePath = concertPages[userName];
    if (filePath) {
        res.sendFile(path.join(__dirname, filePath));
    } else {
        res.status(404).send('Page not found');
    }
});

app.post('/create-free-booking/:userid', async (req, res) => {
    const userId = req.params.userid;
    const { tickets, eventName } = req.body;

    try {
        const user = await CombinedModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        user.tickets.push({
            orderId: `free_${new Date().getTime()}`,
            amount: 0,
            currency: 'INR',
            status: 'booked',
            concertName: eventName
        });

        await user.save();

        res.json({ id: `free_${new Date().getTime()}` });
    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

app.post('/create-order/:userid', async (req, res) => {
    const userId = req.params.userid;
    const { amount, concertName } = req.body;
    console.log(amount,userId);
    const options = {
        amount: amount*100,
        currency: 'INR',
        receipt: 'order_rcptid_11',
        payment_capture: 1 
    };

    console.log(options);

    try {
        const response = await razorpay.orders.create(options);

        const user = await CombinedModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        user.tickets.push({
            orderId: response.id,
            amount: response.amount/100,
            currency: response.currency,
            status: 'created',
            concertName: concertName
        });

        await user.save();

        res.json(response);
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/verify-payment/:userid', async (req, res) => {
    const userId = req.params.userid;
    const { orderId, paymentId, signature, amount, currency, status } = req.body;

    const shasum = crypto.createHmac('sha256', razorpay.key_secret);
    shasum.update(`${orderId}|${paymentId}`);
    const digest = shasum.digest('hex');

    if (digest !== signature) {
        return res.status(400).json({ error: 'Invalid signature' });
    }

    try {
        const user = await CombinedModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const ticket = user.tickets.find(t => t.orderId === orderId);
        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found." });
        }

        ticket.paymentId = paymentId;
        ticket.signature = signature;
        ticket.status = status;
        ticket.amount = amount;
        ticket.currency = currency;

        await user.save();

        // Send email with payment summary
        sendPaymentSummaryEmail(user, ticket);

        res.json({ success: true, message: 'Payment verified and stored' });
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ error: 'Failed to save payment data' });
    }
});

app.get('/payment-details', (req, res) => {
    res.sendFile(path.join(__dirname, './HTML/payment-details.html'));
});

app.get('/download-receipt', async (req, res) => {
    const { orderId, paymentId, amount, currency, status, concertName, username, email } = req.query;

    const doc = new PDFDocument();
    let filename = `receipt_${orderId}.pdf`;

    filename = encodeURIComponent(filename);

    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');

    doc.fontSize(25).text('Payment Receipt', {
        align: 'center'
    });
    doc.moveDown();
    doc.fontSize(18).text(`Order ID: ${orderId}`);
    doc.fontSize(18).text(`Payment ID: ${paymentId}`);
    doc.fontSize(18).text(`Amount: ₹${amount}`);
    doc.fontSize(18).text(`Currency: ${currency}`);
    doc.fontSize(18).text(`Status: ${status}`);
    doc.fontSize(18).text(`Concert Name: ${concertName}`);
    doc.fontSize(18).text(`Username: ${username}`);
    doc.fontSize(18).text(`Email: ${email}`);
    doc.end();

    doc.pipe(res);
});

app.get('/download-receipt-jpg', async (req, res) => {
    const { orderId, paymentId, amount, currency, status, concertName, username, email } = req.query;

    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'black';
    ctx.font = 'bold 30px Arial';
    ctx.fillText('Payment Receipt', canvas.width / 2 - 100, 50);

    ctx.font = '20px Arial';
    ctx.fillText(`Order ID: ${orderId}`, 50, 100);
    ctx.fillText(`Payment ID: ${paymentId}`, 50, 150);
    ctx.fillText(`Amount: ₹${amount}`, 50, 200);
    ctx.fillText(`Currency: ${currency}`, 50, 250);
    ctx.fillText(`Status: ${status}`, 50, 300);
    ctx.fillText(`Concert Name: ${concertName}`, 50, 350);
    ctx.fillText(`Username: ${username}`, 50, 400);
    ctx.fillText(`Email: ${email}`, 50, 450);

    res.setHeader('Content-disposition', 'attachment; filename="receipt.jpg"');
    res.setHeader('Content-type', 'image/jpeg');

    canvas.createJPEGStream().pipe(res);
});


// Add this to serve bookings.html
app.get('/bookings', (req, res) => {
    res.sendFile(__dirname + "/HTML/bookings.html");
});

// Add this to fetch user bookings
app.get('/user/:id/bookings', async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await CombinedModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        // Include the username and email in each booking
        const bookingsWithUserDetails = user.tickets.map(ticket => ({
            ...ticket._doc,
            username: user.username,
            email: user.email
        }));

        res.json(bookingsWithUserDetails);
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({ error: "Error fetching user bookings. Please try again later." });
    }
});




app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
