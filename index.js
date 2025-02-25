const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const path = require('path');
const app = express();
const cors = require('cors');
require('dotenv').config();

app.use(cors());
app.use(
  express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
      if (path.extname(filePath) === '.css') {
        res.setHeader('Content-Type', 'text/css');
      }
    },
  })
);
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.use(bodyParser.urlencoded({ extended: true }));

const users = [];

// Utility function to format dates
const formatDate = (date) => moment(date, 'ddd MMM DD YYYY').format('ddd MMM DD YYYY');

// Create a new user
app.post('/api/users', (req, res) => {
  const { username } = req.body;

  const newUser = { username, _id: (users.length + 1).toString() };
  newUser.exercises = []; // Initialize exercises array
  users.push(newUser);
  res.json(newUser);
});

// Get a list of all users
app.get('/api/users', (req, res) => {
  res.json(users);
});

// Add an exercise for a user
app.post('/api/users/:_id/exercises', (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  const user = users.find((u) => u._id === _id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const formattedDate = moment(date, 'YYYY-MM-DD', true).isValid()
    ? moment(date, 'YYYY-MM-DD').format('ddd MMM DD YYYY')
    : moment().format('ddd MMM DD YYYY');

  const exercise = {
    description,
    duration: parseInt(duration),
    date: formattedDate, // Use the formatted date here
  };

  user.exercises.push(exercise);

  res.json({
    _id: user._id,
    username: user.username,
    ...exercise,
  });
});

// Get a full exercise log for a user
app.get('/api/users/:_id/logs', (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;
  const user = users.find((u) => u._id === _id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  let logs = user.exercises || [];

  if (from || to) {
    const fromDate = from ? moment(from, 'YYYY-MM-DD') : moment(0);
    const toDate = to ? moment(to, 'YYYY-MM-DD') : moment();

    logs = logs.filter((log) =>
      moment(log.date, 'ddd MMM DD YYYY', true).isValid() &&
      moment(log.date, 'ddd MMM DD YYYY').isBetween(fromDate, toDate, null, '[]')
    );
  }

  if (limit) {
    logs = logs.slice(0, parseInt(limit));
  }

  // Format the date property using the utility function
  logs = logs.map((log) => ({
    description: log.description,
    duration: log.duration,
    date: moment(log.date, 'ddd MMM DD YYYY').format('ddd MMM DD YYYY'), // Use moment for formatting
  }));

  res.json({
    _id: user._id,
    username: user.username,
    count: logs.length,
    log: logs,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
