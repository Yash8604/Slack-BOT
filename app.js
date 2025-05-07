const express = require('express');
const bodyParser = require('body-parser');
const slackRoutes = require('./routes/slack');
require('dotenv').config();

const app = express();

// Slack sends data as x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/slack', slackRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
