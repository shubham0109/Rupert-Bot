var Twit = require('twit');
var wordfilter = require('wordfilter');
var config = require('./config.js');
var T = new Twit(config);


tweeter();

function tweeter() {
  tweetIt('This is a test of the emergency rupbot broadcasting system.');
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
  tweet = tweet.replace(/survivorsanjuandelsur/gi, 'SurvivorGameChangers')
  tweet = tweet.replace(/SurvivorMillennialsVsGenX/gi, 'SurvivorGameChangers');
  // No links!
  tweet = tweet.replace(/http.*?(\s|$)/gi, '');

  // tweet = tweet.replace(/survivor/g, 'hunted');
  // tweet = tweet.replace(/Survivor/g, 'Hunted');
  // tweet = tweet.replace(/SURVIVOR/g, 'HUNTED');
  // tweet = tweet.replace(/survivor/gi, 'Hunted');



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
    T.post('statuses/update', params, tweeted);
  } else {
    console.log("word blacklisted: " + tweet);
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
