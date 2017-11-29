var Twit = require('twit');
var wordfilter = require('wordfilter');
var util = require('./lib/util.js');

// Pulling all my twitter account info from another file
var config = require('./jp/config.js');

// Making a Twit object for connection to the API
var T = new Twit(config);

var fs = require('fs');

var args = process.argv.slice(2);

var testing = false;

if (args[0] === 'testing') {
  testing = true;
}


var lines = fs.readFileSync('data/jp_curated.txt', 'utf8');
var tweets = lines.split(/\n/);


var howoften = 5;

var starts = ['At the end of the day,',
  'Well,',
  'I mean,',
  'You know,',
  'So, you know,',
  'In the firehouse', 'But in the firehouse',
  'One step at a time and'
];
var inserts = ['uh',
  'I mean',
  'you know', 'you know', 'you know',
  'just',
  'so',
  'so you know'
];
var ends = [', things like that',
  ' and things like that',
  ', simple as that',
  ', but it just is what it is',
  ' and what not'
];

// var tst = 'Watching learn English is like watching sentient crystals speak through Data calling us "ugly bags of mostly water". #STNG';
// LSTMTweet(150, 'blah', tst, 111);

// Once every N milliseconds
if (testing) {
  tweeter();
  setInterval(tweeter, 5000);
} else {
  tweeter();
  setInterval(tweeter, 60 * howoften * 1000);
}

function generateTweet(name) {
  var tweet = util.choice(tweets);
  var tokens = tweet.split(/([\s,.!?])/);
  var output = '';

  var start = false;
  if (Math.random() < 0.4) {
    output += util.choice(starts);
    output += ' ';
    start = true;
  }

  for (var i = 0; i < tokens.length - 1; i++) {
    if (start && i == 0 && tokens[i] !== 'I') {
      tokens[i] = tokens[i].toLowerCase();
    } else if (tokens[i] == ' ') {
      if (Math.random() < 0.15) {
        output += ', ';
        output += util.choice(inserts);
        output += ',';
      }
    } else if (i == tokens.length - 2) {
      if (Math.random() < 0.4) {
        output += util.choice(ends);
      }
    }
    output += tokens[i];
  }

  output = output.replace(/,+/, ',');


  return output;
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
  if (day == 4 && hours == 0 && minutes > (59 - howoften)) {
    starting = true;
  }
  if (day != 4) {
    live = false;
  }
  if (hours < 1 || hours > 1) {
    live = false;
  }

  // Live and Starting
  var tweet;
  if (live | testing) {
    // Tweet undefined if it goes the LSTM route
    tweet = generateTweet();
    // Make sure nothing offensive
    while (tweet && wordfilter.blacklisted(tweet)) {
      tweet = generateTweet();
    }
  }

  // Go ahead
  if ((live || testing) && tweet) {
    tweetIt(tweet);
  }


}



function tweetIt(tweet, replyid) {
  // truncate
  if (tweet.length > 280) {
    console.log('truncating');
    tweet = util.truncate(tweet, 280);
  }

  if (!wordfilter.blacklisted(tweet)) {
    var params = {};
    params.status = tweet;
    if (replyid) {
      params.in_reply_to_status_id = replyid;
    }

    if (!testing) {
      T.post('statuses/update', params, tweeted);
    } else {
      console.log("Testing: " + tweet)
    }
  } else {
    console.log("blacklisted: " + tweet);
  }
}



// When someone follows KenBot
// Setting up a user stream
var stream = T.stream('user');

// Replying!
stream.on('tweet', tweetEvent);

function tweetEvent(tweet) {

  var mentioned = false;
  var mentions = tweet.entities.user_mentions;
  for (var i = 0; i < mentions.length; i++) {
    if (mentions[i].screen_name.toLowerCase() == 'jpandthingsbot') {
      mentioned = true;
    }
  }

  // Who sent the tweet?
  var name = tweet.user.screen_name;

  // What is the text?
  var txt = tweet.text;
  // If we want the conversation thread
  var id = tweet.id_str;


  // Ok, if this was in reply to me
  // Tweets by me show up here too
  if (name.toLowerCase() !== 'jpandthingsbot' && mentioned && !/^RT/.test(txt)) {
    console.log(name, mentioned, txt);
    var replyText = '@' + name + ' ' + generateTweet();
    tweetIt(replyText, id);
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
