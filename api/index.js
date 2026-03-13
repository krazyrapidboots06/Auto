// api/index.js
const express = require('express');
const faker = require('faker');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/generate-fb-account', async (req, res) => {
  // Automatically generate a Facebook account
  const email = faker.internet.email();
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();
  const password = 'Password123!'; // You can also generate random passwords if needed
  const userId = uuidv4();  // Generate a unique user ID

  try {
    // Simulating Facebook registration success
    setTimeout(() => {
      res.json({
        status: 'success',
        message: `Account created for ${firstName} ${lastName} with email ${email}`,
        userId,
      });
    }, 2000);  // Simulate a delay for account creation
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate account' });
  }
});

// Default route to serve frontend
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/../public/index.html');
});

// Start the server
app.listen(3000, () => {
  console.log('Backend running on http://localhost:3000');
});