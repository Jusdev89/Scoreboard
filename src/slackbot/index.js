const Bot = require('slackbots');
const players = require('../players');

class ScoreKeeper extends Bot {
  constructor(settings) {
    super(settings);

    this.settings = settings;
    this.settings.name = settings.name || 'scoreboard';
    this.db = settings.db;
  }

  run() {
    this.on('start', this._onStart);
    this.on('message', this._onMessage);
  }

  _onStart() {
    this.user = this.users.filter(user => (user.display_name === this.name))[0];
  }

  _onMessage(message) {
    const tallyScore = this._isChatMessage(message) &&
      this._isChannelConversation(message) &&
      !this._isScoreKeeper(message)

    if (tallyScore && this._isUsingScoreSommands(message, '@gotit')) {
      this._incrementCoacheScore(message);
    }

    if(tallyScore && this._isUsingScoreSommands(message, '@score')) {
      this._getAllScores(message)
    }
  };

  _isChatMessage(message) {
    return message.type === 'message' && Boolean(message.text);
  }

  _isChannelConversation(message) {
    return typeof message.channel === 'string' && message.channel[0] === 'C';
  }

  _isScoreKeeper(message) {
    return message.user === this.user.id;
  }

  _isUsingScoreSommands(message, command) {
    return message.text.toLowerCase().indexOf(command) > -1
  }

  _incrementCoacheScore(message) {
    const { user } = message

    if(players[user]) {
      this.db.get(players[user], (err, value) => {
        if(err) return this._incrementScore(players[user], 0, message);  

        const score = Number(value.toString('utf-8'));
        this._incrementScore(players[user], score, message);
      })
    }
  }

  _incrementScore(player, value, message) {
    this.db.put(player, ++value, err => {
      if(err) return console.log('PUT ERROR: ', err);
      this.replyToPlayer(player, message)
    });
  }

  replyToPlayer(player, message) {
    this.db.get(player, (err, value) => {
      if(err) return console.log('GET ERROR: ', err);
      const scoreMessage = `Nice you got ${value.toString('utf-8')} points!!!`

      this.postMessage(message.channel, scoreMessage, {as_user: true})
    })
  }

  _getAllScores(message) {
    const { db } = this

    for(let player in players) {
      db.get(players[player], (err, value) => (err || {}).notFound
        ? ''
        : this.postMessage(message.channel, `${players[player]}: ${value.toString('utf-8')} points`, {as_user: true})
      )
    }
  }
};

module.exports = ScoreKeeper;
