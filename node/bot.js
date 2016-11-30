// A2Z F16
// Daniel Shiffman
// http://shiffman.net/a2z
// https://github.com/shiffman/A2Z-F16

function tokenize(s) {
  return s.split(/([^A-Z0-9'%]+)/i);
}

function capitalize(before, after) {
  if (/^[A-Z]+$/.test(before)) {
    return after.toUpperCase();
  } else if (/^[a-z]+$/.test(before)) {
    return after.toLowerCase();
  } else if (/^[A-Z][a-z]*$/.test(before)) {
    var c = after.charAt(0).toUpperCase();
    return c + after.substring(1, after.length);
  }
  return after;

}


var wordfilter = require('wordfilter');

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

var txt = fs.readFileSync('data/rupert.txt', 'utf-8');

var Concordance = require('./concordance.js');
var MarkovGenerator = require('./markov.js');
var POS = require('./pos.js');

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

posdict = new POS();
for (var i = 0; i < lines.length; i++) {
  posdict.process(lines[i]);
}
posdict.clearNNP();


var testing = true;

// Start once
tweeter();

// Once every N milliseconds
if (testing) {
  setInterval(tweeter, 1000);
} else {
  setInterval(tweeter, 60 * 5 * 1000);
}

// Here is the bot!
function tweeter() {
  var live = true;
  var starting = false;
  var d = new Date();
  var day = d.getUTCDay();
  var hours = d.getUTCHours();
  var minutes = d.getUTCMinutes();



  // Only tweet UTC Thursdays 1am-4am
  // Announce tweeting somwhere in the 5 minutes until range
  console.log(day, hours, minutes);
  if (day == 4 && hours == 0 && minutes > 54) {
    starting = true;
  }
  if (day != 4) {
    live = false;
  }
  if (hours < 1 || hours > 4) {
    live = false;
  }

  var tweet;
  if (starting) {
    var index = Math.floor(Math.random() * livetweets.length)
    tweet = livetweets[index];
  } else if (live | testing) {
    tweet = generateTweet();
    // Make sure nothing offensive
    while (wordfilter.blacklisted(tweet)) {
      tweet = generateTweet();
    }
    console.log('Tweet: ' + tweet);

  }

  if (starting || live) {
    T.post('statuses/update', {
      status: tweet
    }, tweeted);
  }

}

function generateTweet() {
  var tweet;

  var r = Math.random();
  if (r < 0.25) {
    console.log('char markov');
    tweet = markov.generate();
    if (Math.random() < 0.5) {
      var hash = cfg.expandFrom('<HASHTAG>');
      tweet = tweet + ' ' + hash;
    }
  } else if (r < 0.5) {
    console.log('sentence markov');
    var result = rm.generateSentences(1);
    tweet = result[0];
    // Fixing hashtags
    tweet = tweet.replace(/#\s+(\w+)/, '#$1');
    if (Math.random() < 0.5) {
      var hash = cfg.expandFrom('<HASHTAG>');
      tweet = tweet + ' ' + hash;
    }
  } else if (r < 0.75) {
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
  } else {
    var output = [];
    var index = Math.floor(Math.random() * lines.length);
    var start = lines[index];
    console.log(start);

    var tokens = tokenize(start);

    for (var i = 0; i < tokens.length; i++) {
      var pos = rita.RiTa.getPosTags(tokens[i]);
      var p = pos[0];
      var options = posdict.dict[p];
      if (options) {
        var r = Math.random();
        var swap = false;

        // Proper Noun
        // console.log('pos: ' + p);
        if (p == 'nnp' && r < 0.8) {
          swap = true;
        } else if (r < 0.4) {
          swap = true;
        }

        if (swap) {
          var rindex = Math.floor(Math.random()*options.length)
          var replace = options[rindex];
          console.log(pos[0] + ' ' + tokens[i] + ' --> ' + replace);
          replace = capitalize(tokens[i], replace);
          output.push(replace);
        } else {
          output.push(tokens[i]);
        }
      } else {
        output.push(tokens[i]);
      }
    }
    tweet = output.join('');
  }

  // Need a better way to truncate
  if (tweet.length > 140) {
    tweet = tweet.substring(0, 140);
  }
  // Turn at mentions into hashtags?
  tweet = tweet.replace(/@/, '#');
  return tweet;
}



// When someone follows RupBot
// Setting up a user stream
var stream = T.stream('user');
// Anytime someone follows me
stream.on('follow', followed);

// Just looking at the event but I could tweet back!
function followed(event) {
  var name = event.source.name;
  var screenName = event.source.screen_name;

  if (screenName !== 'rupbot') {
    var tweet = generateTweet();
    tweet = '@' + screenName + ' ' + tweet;
    if (tweet.length > 140) {
      tweet = tweet.substring(0, 140);
    }

    T.post('statuses/update', {
      status: tweet
    }, tweeted);
  }
}

// Replying!
stream.on('tweet', tweetEvent);

function tweetEvent(tweet) {

  // If we wanted to write a file out
  // to look more closely at the data
  // var fs = require('fs');
  // var json = JSON.stringify(tweet,null,2);
  // fs.writeFile("tweet.json", json, output);

  // Who is this in reply to?
  var reply_to = tweet.in_reply_to_screen_name;
  // Who sent the tweet?
  var name = tweet.user.screen_name;
  // What is the text?
  var txt = tweet.text;
  // If we want the conversation thread
  var id = tweet.id_str;

  // Ok, if this was in reply to me
  // Tweets by me show up here too
  if (name !== 'rupbot' && reply_to === 'rupbot') {
    // Get rid of the @ mention
    txt = txt.replace(/@rupbot\s+/g, '');
    console.log('original tweet: ' + txt);
    generateReply(txt, name, id);

  }
}


function generateReply(txt, name, id) {
  var tokens = txt.split(/\W+/);
  console.log(tokens);
  var total = Math.floor(Math.random() * 2) + 1;
  var index = Math.floor(Math.random() * (tokens.length - 1));
  var primetext = tokens[index] + ' ' + tokens[index + 1];

  var spawn = require('child_process').spawn;

  var params = ['sample.lua', 'rnn/lm_lstm_epoch50.00_1.6765.t7_cpu.t7', '-length', '100'];
  params[4] = '-temperature';
  params[5] = Math.random() * 0.9 + 0.1;
  params[6] = '-primetext';
  params[7] = primetext;
  params[8] = '-seed';
  params[9] = Math.floor(Math.random() * 1000);
  console.log('temperature: ' + params[5]);
  console.log('prime text: ' + params[7]);

  var proc = spawn('th', params);
  proc.stdout.on('data', reply);
  proc.stderr.on('data', error);

  function error(data) {
    var results = data.toString();
  }

  function reply(data) {
    var results = data.toString().split(/\n+/);
    console.log(results);

    // Start a reply back to the sender
    var replyText = '@' + name + ' ' + results[0];

    if (replyText.length > 140) {
      replyText = replyText.substring(0, 140);
    }

    if (!wordfilter.blacklisted(replyText)) {

      // Post that tweet
      T.post('statuses/update', {
        status: replyText,
        in_reply_to_status_id: id
      }, tweeted);
    } else {
      console.log('blacklisted: ' + replyText);
    }
  }
}


// Callback for when the tweet is sent
function tweeted(err, data, response) {
  if (err) {
    console.log(err);
  } else {
    console.log('Success: ' + data.text);
    //console.log(response);
  }
}
