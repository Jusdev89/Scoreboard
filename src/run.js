const db = require('./db');
const { SLACKBOT_TOKEN } = require('./config');
const ScoreKeeper = require('./slackbot');

const options = { 
  db, 
  token: SLACKBOT_TOKEN, 
};

const scoreKeeper = new ScoreKeeper(options);

scoreKeeper.run();