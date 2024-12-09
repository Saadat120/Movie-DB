require('dotenv').config();
const express = require('express')
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient, ServerApiVersion } = require('mongodb')
const path = require('path');
const app = express();
const PORT = 3000;

// Load MongoDB URI from environment variables
const uri = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(bodyParser.json());
// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
let db;
let users;

async function connectToDB() {
  try {
    // Connect the client to the server
    await client.connect();
    db = await client.db('moviesDB');
    console.log("Connected to MongoDB!");
  } catch (err) {
    console.error("Database connection failed:", err);
  }
}
connectToDB();

// Fetch movies
app.get(`/movies`, async (req, res) => {
  try {
    const movies = await db.collection('movies').find().toArray();
    res.json(movies);
  } catch (err) {
    res.status(500).send("Error fetching movies.");
  }
});

// Fetch users
app.get(`/users`, async (req, res) => {
  try {
    const movies = await db.collection('users').find().toArray();
    res.json(movies);
  } catch (err) {
    res.status(500).send("Error fetching movies.");
  }
});

app.post(`/login`, async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the user exists
    const user = await db.collection('users').findOne({ username, password });

    if (user) {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).send("Error during login.");
  }
});

app.post(`/register`, async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the username already exists
    const existingUser = await db.collection('users').findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Username already exists." });
    }

    // Insert the new user
    const result = await db.collection('users').insertOne({ username, password });
    return res.status(201).json({ success: true, message: "Account created successfully!" });
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).json({ success: false, message: "An error occurred during registration." });
  }
});

app.post('/rate', async (req, res) => {
  const { title, username, rating, comment } = req.body;

  try {
    const result = await db.collection('movies').updateOne(
      { title },
      { $push: { ratings: { user: username, rating: parseInt(rating), comment } } },
      { upsert: false } // Ensure the movie must already exist (upsert: false)
    );

    if (result.modifiedCount > 0) {
      res.status(200).send("Rating added successfully.");
    } else {
      res.status(404).send("Movie not found.");
    }
  } catch (err) {
    console.error("Error adding rating:", err);
    res.status(500).send("Error adding rating.");
  }
});

app.delete("/deleteComment", async (req, res) => {
  const { title, username, comment } = req.body;

  try {
    // Use $pull to remove the comment
    const result = await db.collection("movies").updateOne(
      { title },
      { $pull: { ratings: { user: username, comment } } }
    );

    if (result.modifiedCount > 0) {
      res.status(200).json({ success: true, message: "Comment deleted successfully." });
    } else {
      res.status(404).json({ success: false, message: "Comment or movie not found." });
    }
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ success: false, message: "An error occurred." });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});