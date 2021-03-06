var Twit = require('twit');
var wordfilter = require('wordfilter');

// Pulling all my twitter account info from another file
var config = require('./ken/config.js');

// Making a Twit object for connection to the API
var T = new Twit(config);

var fs = require('fs');

var testing = false;

// Start once
tweeter();

// Once every N milliseconds
if (testing) {
  setInterval(tweeter, 5000);
} else {
  setInterval(tweeter, 24 * 60 * 60 * 1000);
}

// Here is the bot!
function tweeter() {

  // Live and Starting
  var live = true;
  var starting = false;

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

function generateTweet(name) {
  var tweet = "Apparently.";
  return tweet;
}



// When someone follows KenBot
// Setting up a user stream
var stream = T.stream('user');
// Anytime someone follows me
stream.on('follow', followed);

// Just looking at the event but I could tweet back!
function followed(event) {
  var name = event.source.name;
  var screenName = event.source.screen_name;
  if (screenName.toLowerCase() !== 'apparentlyken') {
    var tweet = '@' + screenName + ' Apparently, you are following me.';
    tweetIt(tweet);
  }
}

// Replying!
stream.on('tweet', tweetEvent);

function tweetEvent(tweet) {

  // If we wanted to write a file out
  // to look more closely at the data
  // var fs = require('fs');
  // var json = JSON.stringify(tweet,null,2);
  // fs.writeFile("tweet" + new Date().toString() + ".json", json);

  // Who is this in reply to?
  // var reply_to = tweet.in_reply_to_screen_name;
  var mentioned = false;
  var mentions = tweet.entities.user_mentions;
  for (var i = 0; i < mentions.length; i++) {
    if (mentions[i].screen_name.toLowerCase() == 'apparentlyken') {
      mentioned = true;
    }
  }

  // Who sent the tweet?
  var name = tweet.user.screen_name;

  // What is the text?
  var txt = tweet.text;
  // If we want the conversation thread
  var id = tweet.id_str;

  console.log(name, mentioned, txt);

  if (name.toLowerCase() == 'kenofthejunglez' && !/^RT/.test(txt)) {
    console.log('Original ken: ' + txt);
    txt = txt.replace(/@/, '#');
    var ruperttweet = "Apparently, " + txt;
    tweetIt(ruperttweet);
    return;
  }



  // Ok, if this was in reply to me
  // Tweets by me show up here too
  if (name.toLowerCase() !== 'apparentlyken' && mentioned && !/^RT/.test(txt)) {
    // Get rid of the @ mention
    // txt = txt.replace(/@apparentlyken\s+/g, '');
    // console.log('original tweet: ' + txt);
    // LSTMTweet(150, name, txt, id);
    var replyText = '@' + name + ' Apparently.';
    tweetIt(replyText, id);
  }
}


function tweetIt(tweet, replyid) {
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
