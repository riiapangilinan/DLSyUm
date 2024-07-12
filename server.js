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


const app = express();
const port = 3000;

const url = 'mongodb://localhost:27017';
const dbName = 'DLSyUm';
let db;

app.use(compression());
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    etag: false
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(morgan('combined'));

// Configure express-handlebars
const hbs = create({
    extname: '.handlebars',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts')
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

const imagesDir = path.join(__dirname, 'public', 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, imagesDir);
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

async function connectToDatabase() {
    try {
        const client = await MongoClient.connect(url, {
            serverSelectionTimeoutMS: 5000, // 5 seconds
        });
        db = client.db(dbName);
        console.log(`Connected to database ${dbName}`);
    } catch (err) {
        console.error('Failed to connect to the database. Error:', err);
        process.exit(1);
    }
}

connectToDatabase();

app.get('/', (req, res) => {
    res.render('index', { title: 'DLSyUm' });
});

app.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
});

app.get('/register', (req, res) => {
    res.render('register', { title: 'Register' });
});

app.get('/profile', (req, res) => {
    res.render('profile', { title: 'Profile' });
});

app.get('/createestablishment', (req, res) => {
    res.render('createestablishment', { title: 'Create Establishment' });
});

app.get('/edit-profile', (req, res) => {
    res.render('edit-profile', { title: 'Edit Profile' });
});

app.get('/forgotpass', (req, res) => {
    res.render('forgotpass', { title: 'Forgot Password' });
});

app.get('/establishment', (req, res) => {
    res.render('establishment', { title: 'Establishment' });
});


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
            image: image || '' 
        };

        try {
            const result = await db.collection('reviews').updateOne(
                { establishment_id: establishmentId },
                { $push: { reviews: newReview } },
                { upsert: true }
            );
            res.json({ success: true, message: 'Review submitted successfully' });
        } catch (err) {
            console.error('Error submitting review:', err);
            res.status(500).json({ error: 'Failed to submit review' });
        }
    });


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

        res.json({ success: true, message: 'Review updated successfully' });
    } catch (err) {
        console.error(`Error updating review for establishment ${establishmentId} and user ${username}:`, err);
        res.status(500).json({ error: 'Failed to update review' });
    }
});

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

        res.json({ success: true, message: 'Review deleted successfully' });
    } catch (err) {
        console.error(`Error deleting review for establishment ${establishmentId} and user ${username}:`, err);
        res.status(500).json({ error: 'Failed to delete review' });
    }
});

    
// Validate description
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


// Fetch all users (this route already exists in your code)
app.get('/api/users', async (req, res) => {
    try {
        const users = await db.collection('users').find().toArray();
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: err.message });
    }
});

// Handle password update
app.post('/api/update-password', async (req, res) => {
    const { username, description, password } = req.body;

    try {
        const user = await db.collection('users').findOne({ username, description });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const result = await db.collection('users').updateOne(
            { username, description },
            { $set: { password } }
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


app.post('/api/update-profile', upload.single('image'), async (req, res) => {
    const username = req.cookies.username;
    if (!username) {
        return res.status(400).json({ success: false, message: 'No user logged in' });
    }

    try {
        const { description } = req.body;
        let image;

        if (req.file) {
            image = `../images/${req.file.filename}`;
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

        const newUser = {
            _id: userId,
            username,
            password,
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

        const establishmentId = (await db.collection('establishments').countDocuments()) + 1;

        const newEstablishment = {
            _id: establishmentId,
            username,
            password,
            name,
            type,
            description,
            image: image, 
            rating: 0,
        };

        await db.collection('establishments').insertOne(newEstablishment);
        res.json({ success: true, message: 'Establishment registered successfully' });
    } catch (err) {
        console.error('Error registering establishment:', err);
        res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
    }
});

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

app.get('/api/restaurants', async (req, res) => {
    try {
        const restaurants = await db.collection('users').find({ isRestaurant: true }).toArray();
        res.json(restaurants);
    } catch (err) {
        console.error('Error fetching restaurants:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password, remember } = req.body;

    try {
        const user = await db.collection('users').findOne({ username, password });
        const establishment = await db.collection('establishments').findOne({ username, password });

        if (user || establishment) {
            res.cookie('username', username, { httpOnly: true, path: '/' });
            res.json({ success: true });
        } else {
            res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ success: false, message: 'An error occurred during login' });
    }
});



app.post('/api/logout', (req, res) => {
    res.clearCookie('username');
    res.json({ success: true, message: 'Logged out successfully' });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
