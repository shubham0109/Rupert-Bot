// A2Z F16
// Daniel Shiffman
// http://shiffman.net/a2z
// https://github.com/shiffman/A2Z-F16

var util = require('./lib/util.js');
var Concordance = require('./lib/concordance.js');
var MarkovGenerator = require('./lib/markov.js');
var POS = require('./lib/pos.js');
var CFG = require('./lib/cfg.js');
var corenlp = require("corenlp-js-interface");

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

var cfg = new CFG();
cfg.initGrammar();
cfg.addWords(wordcounts);

posdict = new POS();
for (var i = 0; i < lines.length; i++) {
  console.log(i + '/' + lines.length);
  posdict.process(lines[i]);
}
posdict.clearNNP();

var testing = false;

// Start once
tweeter();

// Once every N milliseconds
if (testing) {
  setInterval(tweeter, 5000);
} else {
  setInterval(tweeter, 60 * 5 * 1000);
}

// Here is the bot!
function tweeter() {

  // Live and Starting
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
  if (hours < 17 || hours > 18) {
    live = false;
  }
  // live = true;

  var tweet;
  if (starting) {
    var index = Math.floor(Math.random() * livetweets.length)
    tweet = livetweets[index];
  } else if (live | testing) {
    // Tweet undefined if it goes the LSTM route
    tweet = generateTweet();
    // Make sure nothing offensive
    while (tweet && wordfilter.blacklisted(tweet)) {
      tweet = generateTweet();
    }
  }

  // Go ahead
  if ((starting || live || testing) && tweet) {
    tweetIt(tweet);
  }


}

function generateTweet(name) {
  var tweet;

  var r = Math.random();

  if (r < 0) {
    console.log('char markov');
    tweet = markov.generate();
    if (Math.random() < 0.5) {
      var hash = cfg.expandFrom('<HASHTAG>');
      tweet = tweet + ' ' + hash;
    }
  } else if (r < 0) {
    console.log('sentence markov');
    var result = rm.generateSentences(1);
    tweet = result[0];
    // Fixing hashtags
    tweet = tweet.replace(/#\s+(\w+)/, '#$1');
    if (Math.random() < 0.5) {
      var hash = cfg.expandFrom('<HASHTAG>');
      tweet = tweet + ' ' + hash;
    }
  } else if (r < 0) {
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
  } else if (r < 1) {
    console.log('the falconer');
    var output = [];
    console.log(lines.length);
    var start = util.choice(lines);
    console.log('original: ' + start);

    // var tokens = util.tokenize(start);
    var result = corenlp(start, 9000, "ner,pos", "json");
    result = result.replace(/\n+/g, '');
    var nlp = JSON.parse(result);

    for (var k = 0; k < nlp.sentences.length; k++) {
      var tokens = nlp.sentences[k].tokens;
      for (var i = 0; i < tokens.length; i++) {
        var pos = tokens[i].pos;
        var word = tokens[i].originalText;
        if (tokens[i].ner != "O") {
          pos = tokens[i].ner;
        }
        if (/^#.*?/.test(word)) {
          pos = 'HASHTAG';
        }
        var options = posdict.dict[pos];
        if (options) {
          var r = Math.random();
          var swap = false;

          // Proper Noun
          // console.log('pos: ' + p);
          if (pos == 'PERSON' && r < 0.7) {
            swap = true;
          } else if (r < 0.3) {
            swap = true;
          }

          // Hack to deal with contraction problem right now
          if (pos == 'MD' || pos == 'RB' || pos == "''" ) {
            swap = false;
          }

          if (swap) {
            var replace = util.choice(options);
            replace = util.capitalize(word, replace);
            console.log(pos + ' ' + word + ' --> ' + replace);
            output.push(replace);
          } else {
            output.push(word);
          }
        } else {
          output.push(word);
        }
        output.push(tokens[i].after);
      }
    }
    tweet = output.join('');
    tweet = tweet.replace(/’/,"'");
    if (tweet.trim() == start.trim()) {
      console.log('duplicate');
      return generateTweet();
    }
  } else {
    console.log('LSTM!');
    LSTMTweet(150, name);
    return false;
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
    var tweet = generateTweet(screenName);
    if (tweet) {
      tweet = '@' + screenName + ' ' + tweet;
      tweetIt(tweet);
    }
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
    LSTMTweet(150, name, txt, id);

  }
}


function LSTMTweet(len, name, txt, id) {

  var spawn = require('child_process').spawn;

  var params = ['sample.lua', 'rnn/lm_lstm_epoch50.00_1.5083.t7_cpu.t7', '-length', len];
  params[4] = '-temperature';
  params[5] = Math.random() * 0.9 + 0.1;
  params[6] = '-seed';
  params[7] = Math.floor(Math.random() * 1000);
  if (!txt) {
    txt = util.choice(lines);
  }
  var tokens = txt.split(/[^A-Z'@]+/i);
  util.cleanAll(tokens);
  var total = Math.floor(Math.random() * 2) + 1;
  if (tokens.length < 2) {
    total = 1;
  }

  var primetext = 'Survivor';
  //console.log(total, tokens);
  if (total === 1 && tokens.length > 0) {
    primetext = util.choice(tokens);
  } else if (total === 2) {
    // Can't pick the very last one
    var index = Math.floor(Math.random() * (tokens.length - 1));
    primetext = tokens[index];
    primetext += (' ' + tokens[index + 1]);
  }

  params[8] = '-primetext';
  params[9] = primetext;
  console.log('temperature: ' + params[5]);
  console.log('prime text: ' + params[9]);

  var proc = spawn('th', params);
  proc.stdout.on('data', reply);
  proc.stderr.on('data', error);

  function error(data) {
    var results = data.toString();
  }

  function reply(data) {
    var results = data.toString().split(/\n+/);

    // Start a reply back to the sender
    var replyText;

    // hack to stop mistakes
    if (/Missing seed text/.test(results[0])) {
      console.log('missing seed text');
      return;
    }

    if (/----/.test(results[0])) {
      console.log('---------------- error');
      return;
    }


    results[0] = results[0].replace(/@/, '#');

    if (name) {
      replyText = '@' + name + ' ' + results[0];
    } else {
      replyText = results[0];
    }

    // Post that tweet
    tweetIt(replyText, id);
  }
}


function tweetIt(tweet, replyid) {
  var c = tweet.charAt(0);
  tweet = c.toUpperCase() + tweet.substring(1, tweet.length);

  // if it's an @ reply
  if (c === '@') {
    var tokens = tweet.split(/(\s+)/);
    var c = tokens[2].charAt(0);
    tokens[2] = c.toUpperCase() + tokens[2].substring(1, tokens[2].length);
    tweet = tokens.join('');
  }

  // Some hacks to make it more relevant to this season
  tweet = tweet.replace(/survivorsanjuandelsur/gi, 'SurvivorMillennialsVsGenX')

  // truncate
  if (tweet.length > 140) {
    console.log('truncating');
    tweet = util.truncate(tweet, 140);
  }

  if (!wordfilter.blacklisted(tweet)) {
    var params = {};
    params.status = tweet;
    if (replyid) {
      params.in_reply_to_status_id = replyid;
    }

    // Let's make it more millenialy

    if (!testing) {
      T.post('statuses/update', params, tweeted);
    } else {
      console.log("Testing: " + tweet)
    }
  } else {
    console.log("blacklisted: " + tweet);
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
