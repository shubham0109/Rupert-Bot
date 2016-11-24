// A2Z F16
// Daniel Shiffman
// http://shiffman.net/a2z
// https://github.com/shiffman/A2Z-F16

var livetweets = [
  'It\'s almost time for tonight\'s episode of #Survivor. Will you be around to live tweet with me? #survivor',
  'Each Wednesday night I live tweet Survivor! Watch along with me!'
];

// Using the Twit node package
// https://github.com/ttezel/twit
var Twit = require('twit');
var rita = require('rita');

// Pulling all my twitter account info from another file
var config = require('./config.js');

// Making a Twit object for connection to the API
var T = new Twit(config);


var fs = require('fs');

var txt = fs.readFileSync('rupert.txt', 'utf-8');

var Concordance = require('./concordance.js');
var MarkovGenerator = require('./markov.js');

var wordcounts = new Concordance();
wordcounts.process(txt);
var keys = wordcounts.getKeys();

var rm = new rita.RiMarkov(2);
rm.loadText(txt);

var markov = new MarkovGenerator(5, 140);
var lines = txt.split('\n');
for (var i = 0; i < lines.length; i++) {
  markov.feed(lines[i]);
}

var CFG = require('./cfg');
var cfg = new CFG();
cfg.initGrammar();
cfg.addWords(wordcounts);

// Start once
tweeter();

// Once every N milliseconds
setInterval(tweeter, 60 * 5 * 1000);

// Here is the bot!
function tweeter() {
  var live = true;
  var starting = false;
  var d = new Date();
  var day = d.getUTCDay();
  var hours = d.getUTCHours();
  var minutes = d.getUTCMinutes();

  // Only tweet UTC Thursdays 1am-5am
  // Announce tweeting somwhere in the 5 minutes until range
  console.log(day,hours,minutes);
  if (day == 4 && hours == 0 && minutes > 54) {
    starting = true;
  }
  if (day != 4) {
    live = false;
  }
  if (hours < 1 || hours > 6) {
    live = false;
  }

  var tweet;
  if (starting) {
    var index = Math.floor(Math.random() * livetweets.length)
    tweet = livetweets[index];
  } else if (live) {
    tweet = generateTweet();
  }

  if (starting || live) {
    T.post('statuses/update', {
      status: tweet
    }, tweeted);
  }

  // Callback for when the tweet is sent
  function tweeted(err, data, response) {
    if (err) {
      console.log(err);
    } else {
      console.log('Success: ' + data.text);
      //console.log(response);
    }
  };

}

function generateTweet() {
  var tweet;

  var r = Math.random();
  if (r < 0.33) {
    console.log('char markov');
    tweet = markov.generate();
    if (random(1) < 0.5) {
      var hash = rg.expandFrom('<HASHTAG>');
      tweet = tweet + ' ' + hash;
    }
  } else if (r < 0.66) {
    console.log('sentence markov');
    var result = rm.generateSentences(1);
    tweet = result[0];
    // Fixing hashtags
    tweet = tweet.replace(/#\s+(\w+)/, '#$1');
    if (random(1) < 0.5) {
      var hash = rg.expandFrom('<HASHTAG>');
      tweet = tweet + ' ' + hash;
    }
  } else {
    console.log('cfg');
    var result = cfg.expand();
    var output = [];
    var sentences = result.split(/([.?!]\s+)/);
    for (var i = 0; i < sentences.length; i++) {
      var words = sentences[i].split(/(\s+)/);
      for (var j = 0; j < words.length; j++) {
        var word = words[j];
        if (j == 0) {
          var c = word.charAt(0);
          word = c.toUpperCase() + word.substring(1, word.length);
        } else {
          var pos = rita.RiTa.getPosTags(word);
          if (word.length > 1 && !/^[A-Z]+$/.test(word) && !/nnp/.test(pos[0])) {
            word = word.toLowerCase();
          }
        }
        output.push(word);
      }
    }
    tweet = output.join('');
  }

  if (tweet.length > 140) {
    tweet = tweet.substring(0, 140);
  }
  tweet = tweet.replace(/@/, '');
  return tweet;
}
