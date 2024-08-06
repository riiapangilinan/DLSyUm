/***************************************************************************
    DLSyUm: A Restaurant Review Web Application.
    
    Acosta, Axel Toby               S19
    Cosue, Alexis Maureen           S19
    Pangilinan, Riia Lindsey        S19
    Punongbayan, Richard Daniel     S19
***************************************************************************/


/* Import required modules */
const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');
const path = require('path');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const fs = require('fs');
const compression = require('compression');
const morgan = require('morgan');
const { create } = require('express-handlebars');

const bcrypt = require('bcryptjs');
const saltRounds = 10;

/* Initialize the express application */
const app = express();
const port = 3000;

let client;

/* MongoDB connection URL and database name */
const url = 'mongodb+srv://DLSyUm-User:dlsyum@dlsyum.frgksot.mongodb.net/DLSyUm?retryWrites=true&w=majority&appName=DLSyUm';
const dbName = 'DLSyUm';
let db;

/* Middleware to compress responses */
app.use(compression());

/* Middleware to serve static files from the public directory */
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    etag: false
}));

/* Middleware to parse JSON request bodies */
app.use(bodyParser.json());

/* Middleware to parse cookies */
app.use(cookieParser());

/* Middleware to log HTTP requests */
app.use(morgan('combined'));

/* Configure express-handlebars template engine */
const hbs = create({
    extname: '.handlebars',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts')
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

/* Directory for storing uploaded images */
const imagesDir = path.join(__dirname, 'public', 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

/* Multer storage configuration for file uploads */
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, imagesDir);
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

/* Function to connect to the MongoDB database */
async function connectToDatabase() {
    try {
        client = await MongoClient.connect(url, {
            serverSelectionTimeoutMS: 5000,
        });
        db = client.db(dbName);
        console.log(`Connected to database ${dbName}`);
    } catch (err) {
        console.error('Failed to connect to the database. Error:', err);
        process.exit(1);
    }
}

/* Connect to the database */
connectToDatabase();

/* Import JSON files to MongoDB upon server launch: */
function transformData(data) {
    return data.map(item => {
        if (item._id && item._id.$oid) {
            item._id = ObjectId.createFromHexString(item._id.$oid);
        }
        return item;
    });
}

/* Import database JSON files to MongoDB */
async function importJSONToMongoDB() {
    const client = new MongoClient(url);
    try {
        await client.connect();
        const db = client.db(dbName);

        /* Define the JSON files and their corresponding  */
        const collections = [
            { file: 'DLSyUm.establishments.json', collection: 'establishments' },
            { file: 'DLSyUm.reviews.json', collection: 'reviews' },
            { file: 'DLSyUm.users.json', collection: 'users' }
        ];

        for (const { file, collection } of collections) {
            const filePath = path.join(__dirname, 'json', file); // Updated to include the 'json' directory
            const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const data = transformData(rawData);
            const dbCollection = db.collection(collection);

            /* Clear existing data (optional) */
            await dbCollection.deleteMany({});

            /* Insert data into MongoDB */
            await dbCollection.insertMany(data);
            console.log(`Data imported successfully into ${collection} collection`);
        }
    } catch (err) {
        console.error('Error importing data:', err);
    } finally {
        await client.close();
    }
}

/* Start the server and listen on the specified port */
app.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);

    await importJSONToMongoDB(); 
});




/* Route to render the home page */
app.get('/', (req, res) => {
    res.render('index', { title: 'DLSyUm' });
});

/* Route to render the login page */
app.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
});

/* Route to render the registration page */
app.get('/register', (req, res) => {
    res.render('register', { title: 'Register' });
});

/* Route to render the profile page */
app.get('/profile', (req, res) => {
    res.render('profile', { title: 'Profile' });
});

/* Route to render the create establishment page */
app.get('/createestablishment', (req, res) => {
    res.render('createestablishment', { title: 'Create Establishment' });
});

/* Route to render the edit profile page */
app.get('/edit-profile', (req, res) => {
    res.render('edit-profile', { title: 'Edit Profile' });
});

/* Route to render the forgot password page */
app.get('/forgotpass', (req, res) => {
    res.render('forgotpass', { title: 'Forgot Password' });
});

/* Route to render the establishment page */
app.get('/establishment', (req, res) => {
    res.render('establishment', { title: 'Establishment' });
});

/* Route to render the about page */
app.get('/about', (req, res) => {
    res.render('about', { title: 'About Us' });
});





/* API endpoint to fetch all establishments or by username */
app.get('/api/establishments', async (req, res) => {
    const { username } = req.query;
    let query = {};
    if (username) {
        query.username = username;
    }
    try {
        const establishments = await db.collection('establishments').find(query).toArray();
        res.json(establishments);
    } catch (err) {
        console.error('Error fetching establishments:', err);
        res.status(500).json({ error: err.message });
    }
});


/* API endpoint to fetch a specific establishment by ID */
app.get('/api/establishments/:id', async (req, res) => {
    const establishmentId = parseInt(req.params.id);
    if (isNaN(establishmentId)) {
        res.status(400).json({ error: 'Invalid establishment ID' });
        return;
    }

    try {
        const establishment = await db.collection('establishments').findOne({ _id: establishmentId });
        if (!establishment) {
            res.status(404).json({ error: 'Establishment not found' });
            return;
        }
        res.json(establishment);
    } catch (err) {
        console.error(`Error fetching establishment ${establishmentId}:`, err);
        res.status(500).json({ error: 'Failed to fetch establishment' });
    }
});


/* API route to handle reviews for an establishment */
app.route('/api/reviews/:id')
    .get(async (req, res) => {
        const establishmentId = parseInt(req.params.id);
        if (isNaN(establishmentId)) {
            res.status(400).json({ error: 'Invalid establishment ID' });
            return;
        }

        try {
            const reviews = await db.collection('reviews').find({ establishment_id: establishmentId }).toArray();
            if (!reviews) {
                res.status(404).json({ error: 'Reviews not found' });
                return;
            }
            res.json(reviews);
        } catch (err) {
            console.error(`Error fetching reviews for establishment ${establishmentId}:`, err);
            res.status(500).json({ error: 'Failed to fetch reviews' });
        }
    })
    .post(upload.single('image'), async (req, res) => {
        const establishmentId = parseInt(req.params.id);
        if (isNaN(establishmentId)) {
            res.status(400).json({ error: 'Invalid establishment ID' });
            return;
        }

        const username = req.cookies.username;
        if (!username) {
            res.status(401).json({ error: 'User not logged in' });
            return;
        }

        const { title, text, rating } = req.body;
        const image = req.file ? `/images/${req.file.filename}` : '';

        if (!title || !text || !rating) {
            res.status(400).json({ error: 'Please provide all required fields' });
            return;
        }

        const newReview = {
            user: username,
            title,
            rating: parseInt(rating),
            text: text,
            helpful: 0,
            unhelpful: 0,
            image: image || '',
            replies: [] 
        };

        try {
            const result = await db.collection('reviews').updateOne(
                { establishment_id: establishmentId },
                { $push: { reviews: newReview } },
                { upsert: true }
            );

            const reviews = await db.collection('reviews').findOne({ establishment_id: establishmentId });
            if (reviews && reviews.reviews.length > 0) {
                const averageRating = reviews.reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.reviews.length;
                const roundedAverageRating = parseFloat(averageRating.toFixed(2)); 

                await db.collection('establishments').updateOne(
                    { _id: establishmentId },
                    { $set: { rating: roundedAverageRating } }
                );
            }

            res.json({ success: true, message: 'Review submitted successfully' });
        } catch (err) {
            console.error('Error submitting review:', err);
            res.status(500).json({ error: 'Failed to submit review' });
        }
});


/* API endpoint to update a review by a specific user for an establishment */
app.put('/api/reviews/:id/:user', async (req, res) => {
    const establishmentId = parseInt(req.params.id);
    const username = req.params.user;
    const loggedInUsername = req.cookies.username;

    if (!loggedInUsername) {
        return res.status(401).json({ error: 'User not logged in' });
    }

    const { title, rating, text, image } = req.body;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be a number between 1 and 5' });
    }

    try {
        const result = await db.collection('reviews').updateOne(
            { establishment_id: establishmentId, "reviews.user": username },
            { $set: { "reviews.$.title": title, "reviews.$.rating": parseInt(rating), "reviews.$.text": text, "reviews.$.image": image } }
        );

        if (result.matchedCount === 0) {
            console.error(`Review not found or user not authorized: establishment_id=${establishmentId}, user=${username}`);
            return res.status(404).json({ error: 'Review not found or user not authorized' });
        }

        const reviews = await db.collection('reviews').findOne({ establishment_id: establishmentId });
        if (reviews && reviews.reviews.length > 0) {
            const averageRating = reviews.reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.reviews.length;
            const roundedAverageRating = parseFloat(averageRating.toFixed(2)); 

            await db.collection('establishments').updateOne(
                { _id: establishmentId },
                { $set: { rating: roundedAverageRating } }
            );
        }

        res.json({ success: true, message: 'Review updated successfully' });
    } catch (err) {
        console.error(`Error updating review for establishment ${establishmentId} and user ${username}:`, err);
        res.status(500).json({ error: 'Failed to update review' });
    }
});


/* API endpoint to delete a review by a specific user for an establishment */
app.delete('/api/reviews/:id/:user', async (req, res) => {
    const establishmentId = parseInt(req.params.id);
    const username = req.params.user;
    const loggedInUsername = req.cookies.username;
    const { title, text } = req.body;

    if (!loggedInUsername) {
        return res.status(401).json({ error: 'User not logged in' });
    }

    try {
        const result = await db.collection('reviews').updateOne(
            { establishment_id: establishmentId },
            { $pull: { reviews: { user: username, title: title, text: text } } }
        );

        if (result.modifiedCount === 0) {
            console.error(`Review not found or user not authorized: establishment_id=${establishmentId}, user=${username}`);
            return res.status(404).json({ error: 'Review not found or user not authorized' });
        }

        const reviews = await db.collection('reviews').findOne({ establishment_id: establishmentId });
        if (reviews && reviews.reviews.length > 0) {
            const averageRating = reviews.reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.reviews.length;
            const roundedAverageRating = parseFloat(averageRating.toFixed(2));

            await db.collection('establishments').updateOne(
                { _id: establishmentId },
                { $set: { rating: roundedAverageRating } }
            );
        } else {
            await db.collection('establishments').updateOne(
                { _id: establishmentId },
                { $set: { rating: null } }
            );
        }

        res.json({ success: true, message: 'Review deleted successfully' });
    } catch (err) {
        console.error(`Error deleting review for establishment ${establishmentId} and user ${username}:`, err);
        res.status(500).json({ error: 'Failed to delete review' });
    }
});


/* API endpoint to reply as establishment owner */
app.post('/api/reviews/:establishmentId/:username/reply', async (req, res) => {
    const { establishmentId, username } = req.params;
    const { title, text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Reply text is required' });
    }

    try {
        const result = await db.collection('reviews').updateOne(
            { establishment_id: parseInt(establishmentId), 'reviews.user': username, 'reviews.title': title },
            { $push: { 'reviews.$.replies': { text: text } } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error adding reply:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


/* API endpoint to increment the helpful count of a review */
app.post('/api/reviews/:establishmentId/:username/helpful', async (req, res) => {
    const establishmentId = parseInt(req.params.establishmentId);
    const username = req.params.username;

    if (isNaN(establishmentId)) {
        return res.status(400).json({ error: 'Invalid establishment ID' });
    }

    try {
        const result = await db.collection('reviews').updateOne(
            { establishment_id: establishmentId, 'reviews.user': username },
            { $inc: { 'reviews.$.helpful': 1 } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }

        res.json({ success: true, message: 'Helpful count updated' });
    } catch (err) {
        console.error('Error updating helpful count:', err);
        res.status(500).json({ error: 'Failed to update helpful count' });
    }
});


// API endpoint to decrement the helpful count of a review
app.delete('/api/reviews/:establishmentId/:username/helpful', async (req, res) => {
    const establishmentId = parseInt(req.params.establishmentId);
    const username = req.params.username;

    if (isNaN(establishmentId)) {
        return res.status(400).json({ error: 'Invalid establishment ID' });
    }

    try {
        const result = await db.collection('reviews').updateOne(
            { establishment_id: establishmentId, 'reviews.user': username },
            { $inc: { 'reviews.$.helpful': -1 } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }

        res.json({ success: true, message: 'Helpful count updated' });
    } catch (err) {
        console.error('Error updating helpful count:', err);
        res.status(500).json({ error: 'Failed to update helpful count' });
    }
});


/* API endpoint to decrement the unhelpful count of a review */
app.delete('/api/reviews/:establishmentId/:username/unhelpful', async (req, res) => {
    const establishmentId = parseInt(req.params.establishmentId);
    const username = req.params.username;

    if (isNaN(establishmentId)) {
        return res.status(400).json({ error: 'Invalid establishment ID' });
    }

    try {
        const result = await db.collection('reviews').updateOne(
            { establishment_id: establishmentId, 'reviews.user': username },
            { $inc: { 'reviews.$.unhelpful': -1 } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }

        res.json({ success: true, message: 'Unhelpful count updated' });
    } catch (err) {
        console.error('Error updating unhelpful count:', err);
        res.status(500).json({ error: 'Failed to update unhelpful count' });
    }
});


/* API endpoint to increment the unhelpful count of a review */
app.post('/api/reviews/:establishmentId/:username/unhelpful', async (req, res) => {
    const establishmentId = parseInt(req.params.establishmentId);
    const username = req.params.username;

    if (isNaN(establishmentId)) {
        return res.status(400).json({ error: 'Invalid establishment ID' });
    }

    try {
        const result = await db.collection('reviews').updateOne(
            { establishment_id: establishmentId, 'reviews.user': username },
            { $inc: { 'reviews.$.unhelpful': 1 } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }

        res.json({ success: true, message: 'Unhelpful count updated' });
    } catch (err) {
        console.error('Error updating unhelpful count:', err);
        res.status(500).json({ error: 'Failed to update unhelpful count' });
    }
});


/* API endpoint to validate user description */
app.get('/api/validate-description', async (req, res) => {
    const { username, description } = req.query;

    try {
        const user = await db.collection('users').findOne({ username, description });
        if (user) {
            res.json({ valid: true });
        } else {
            res.json({ valid: false });
        }
    } catch (err) {
        console.error('Error validating description:', err);
        res.status(500).json({ error: err.message });
    }
});


/* API endpoint to fetch all users */
app.get('/api/users', async (req, res) => {
    try {
        const users = await db.collection('users').find().toArray();
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: err.message });
    }
});


/* API endpoint to handle password update */
app.post('/api/update-password', async (req, res) => {
    const { username, description, password } = req.body;

    try {
        const user = await db.collection('users').findOne({ username, description });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const result = await db.collection('users').updateOne(
            { username, description },
            { $set: { password: hashedPassword } }
        );

        if (result.modifiedCount > 0) {
            res.json({ success: true, message: 'Password updated successfully' });
        } else {
            res.status(500).json({ success: false, message: 'Failed to update password' });
        }
    } catch (err) {
        console.error('Error updating password:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


/* API endpoint to fetch user profile along with reviews */
app.get('/api/user-profile', async (req, res) => {
    const username = req.query.username || req.cookies.username;

    if (!username) {
        return res.status(400).json({ error: 'No user specified or logged in' });
    }

    try {
        const user = await db.collection('users').findOne({ username });
        const establishment = await db.collection('establishments').findOne({ username });

        if (!user && !establishment) {
            return res.status(404).json({ error: 'User not found' });
        }

        const profile = user || establishment;
        const reviews = await db.collection('reviews').find({ "reviews.user": username }).toArray();

        res.json({ user: profile, reviews });
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).json({ error: err.message });
    }
});


/* API endpoint to update user profile */
app.post('/api/update-profile', upload.single('image'), async (req, res) => {
    const username = req.cookies.username;
    if (!username) {
        return res.status(400).json({ success: false, message: 'No user logged in' });
    }

    try {
        const { description } = req.body;
        let image;

        if (req.file) {
            image = `/images/${req.file.filename}`;
        }

        const updateData = { description };
        if (image) {
            updateData.image = image;
        }

        const userResult = await db.collection('users').updateOne(
            { username },
            { $set: updateData }
        );

        const establishmentResult = await db.collection('establishments').updateOne(
            { username },
            { $set: updateData }
        );

        if (userResult.modifiedCount > 0 || establishmentResult.modifiedCount > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


/* API endpoint to register a new user */
app.post('/api/registeruser', upload.single('image'), async (req, res) => {
    const { username, password, description } = req.body;
    let image;

    if (req.file) {
        image = `/images/${req.file.filename}`;
    } else if (req.body.image) {
        const base64Data = req.body.image.replace(/^data:image\/jpeg;base64,/, "");
        const filename = `${Date.now()}-profile.jpg`;
        fs.writeFileSync(path.join(imagesDir, filename), base64Data, 'base64');
        image = `/images/${filename}`;
    }

    try {
        const existingUser = await db.collection('users').findOne({ username });
        const existingEstablishment = await db.collection('establishments').findOne({ username });

        if (existingUser || existingEstablishment) {
            return res.status(400).json({ success: false, message: 'Username already exists.' });
        }

        const userId = (await db.collection('users').countDocuments()) + 1;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = {
            _id: userId,
            username,
            password: hashedPassword,
            image,
            description,
        };

        await db.collection('users').insertOne(newUser);
        res.json({ success: true, message: 'User registered successfully' });
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
    }
});


/* API endpoint to register a new establishment */
app.post('/api/registerestablishment', upload.single('image'), async (req, res) => {
    const { username, password, description, name, type } = req.body;
    let image;

    if (req.file) {
        image = `/images/${req.file.filename}`;
    }

    try {
        const existingUser = await db.collection('users').findOne({ username });
        const existingEstablishment = await db.collection('establishments').findOne({ username });

        if (existingUser || existingEstablishment) {
            return res.status(400).json({ success: false, message: 'Username already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const establishmentId = (await db.collection('establishments').countDocuments()) + 1;

        const newEstablishment = {
            _id: establishmentId,
            username,
            password: hashedPassword,
            name,
            type,
            description,
            image,
            rating: 0,
        };

        await db.collection('establishments').insertOne(newEstablishment);
        res.json({ success: true, message: 'Establishment registered successfully' });
    } catch (err) {
        console.error('Error registering establishment:', err);
        res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
    }
});


/* API endpoint to check if a username already exists */
app.get('/api/checkusername', async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ exists: false, message: 'Username is required' });
    }

    try {
        const existingUser = await db.collection('users').findOne({ username });
        const existingEstablishment = await db.collection('establishments').findOne({ username });

        if (existingUser || existingEstablishment) {
            return res.json({ exists: true });
        } else {
            return res.json({ exists: false });
        }
    } catch (err) {
        console.error('Error checking username:', err);
        res.status(500).json({ exists: true, message: 'An error occurred while checking the username. Please try again later.' });
    }
});


/* API endpoint to fetch all restaurants */
app.get('/api/restaurants', async (req, res) => {
    try {
        const restaurants = await db.collection('users').find({ isRestaurant: true }).toArray();
        res.json(restaurants);
    } catch (err) {
        console.error('Error fetching restaurants:', err);
        res.status(500).json({ error: err.message });
    }
});


/* API endpoint for login */
app.post('/api/login', async (req, res) => {
    const { username, password, remember } = req.body;

    try {
        const user = await db.collection('users').findOne({ username });
        if (user && await bcrypt.compare(password, user.password)) {
            res.cookie('username', username, { httpOnly: true, path: '/' });
            res.cookie('type', 'user', { httpOnly: true, path: '/' });
            return res.json({ success: true });
        }
        const establishment = await db.collection('establishments').findOne({ username });
        if (establishment && await bcrypt.compare(password, establishment.password)) {
            res.cookie('username', username, { httpOnly: true, path: '/' });
            res.cookie('type', 'establishment', { httpOnly: true, path: '/' }); 
            return res.json({ success: true });
        }

        res.status(401).json({ success: false, message: 'Invalid username or password' });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ success: false, message: 'An error occurred during login' });
    }
});


/* API endpoint for user logout */
app.post('/api/logout', (req, res) => {
    res.clearCookie('username');
    res.json({ success: true, message: 'Logged out successfully' });
});


/* Graceful shutdown handling */
function closeDatabaseConnection() {
    if (client) {
        client.close().then(() => {
            console.log('MongoDB connection closed');
        }).catch(err => {
            console.error('Error closing MongoDB connection:', err);
        });
    }
}

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing MongoDB connection');
    closeDatabaseConnection();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing MongoDB connection');
    closeDatabaseConnection();
    process.exit(0);
});

/* Close MongoDB connection upon server termination */
process.on('exit', closeDatabaseConnection);