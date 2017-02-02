// A2Z F16
// Daniel Shiffman
// http://shiffman.net/a2z
// https://github.com/shiffman/A2Z-F16

// Run
// java -mx4g -cp "*" edu.stanford.nlp.pipeline.StanfordCoreNLPServer

var util = require('./lib/util.js');
var Concordance = require('./lib/concordance.js');
var MarkovGenerator = require('./lib/markov.js');
var POS = require('./lib/pos.js');
var CFG = require('./lib/cfg.js');
var corenlp = require("corenlp-js-interface");

var wordfilter = require('wordfilter');

// var livetweets = [
//   'It\'s almost time for tonight\'s episode of #Survivor. Will you be around to live tweet with me? #survivor',
//   'Each Wednesday night I live tweet Survivor! Watch along with me!'
// ];

var livetweets = [
  'It\'s almost time for tonight\'s episode of #Hunted. Will you be around to live tweet with me? #Hunted',
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

// OFF SEASON NOW!
// posdict.clearNNP();

// HUNTED!
posdict.clearNNPHunted();

var testing = false;

// Testing reply picking algorithm
// LSTMTweet(150, 'test','This is @test and #testing but my name is Dan.','12345');

// Start once
tweeter();

// var tst = 'Watching learn English is like watching sentient crystals speak through Data calling us "ugly bags of mostly water". #STNG';
// LSTMTweet(150, 'blah', tst, 111);

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
  if (hours < 1 || hours > 4) {
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

  if (r < 0.05) {
    console.log('char markov');
    tweet = markov.generate();
    if (Math.random() < 0.5) {
      var hash = cfg.expandFrom('<HASHTAG>');
      tweet = tweet + ' ' + hash;
    }
  } else if (r < 0.1) {
    console.log('sentence markov');
    var result = rm.generateSentences(1);
    tweet = result[0];
    // Fixing hashtags
    tweet = tweet.replace(/#\s+(\w+)/, '#$1');
    if (Math.random() < 0.5) {
      var hash = cfg.expandFrom('<HASHTAG>');
      tweet = tweet + ' ' + hash;
    }
  } else if (r < 0.15) {
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
  } else if (r < 0.95) {
    console.log('the falconer');
    console.log(lines.length);
    var start = util.choice(lines);

    // Protect against empty tweets
    while (start.length < 1) {
      start = util.choice(lines);
    }

    tweet = falconer(start);
  } else {
    console.log('LSTM!');
    LSTMTweet(150, name);
    return false;
  }

  // Turn at mentions into hashtags?
  if (!tweet) {
    return false;
  }
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
  // fs.writeFile("tweet" + new Date().toString() + ".json", json);

  // Who is this in reply to?
  // var reply_to = tweet.in_reply_to_screen_name;
  var mentioned = false;
  var mentions = tweet.entities.user_mentions;
  for (var i = 0; i < mentions.length; i++) {
    if (mentions[i].screen_name == 'rupbot') {
      mentioned = true;
    }
  }

  // Who sent the tweet?
  var name = tweet.user.screen_name;
  console.log(name);

  // What is the text?
  var txt = tweet.text;
  // If we want the conversation thread
  var id = tweet.id_str;

  //if (name.toLowerCase() == 'rupertboneham') {
  if (name.toLowerCase() == 'rupertboneham' && !/^RT/.test(txt)) {
    console.log('Original rupert: ' + txt);
    var ruperttweet = falconer(txt, 0.1);
    if (ruperttweet === undefined) {
      console.log('rupert tweet fail');
      return;
    }
    console.log('New Rupert: ' + ruperttweet);
    tweetIt(ruperttweet);
    return;
  }


  // Ok, if this was in reply to me
  // Tweets by me show up here too
  if (name !== 'rupbot' && mentioned && !/^RT/.test(txt)) {
    // Get rid of the @ mention
    txt = txt.replace(/@rupbot\s+/g, '');
    console.log('original tweet: ' + txt);
    LSTMTweet(150, name, txt, id);
  }
}


function LSTMTweet(len, name, txt, id) {

  var spawn = require('child_process').spawn;

  var params = ['sample.lua', 'rnn/lm_lstm_epoch50.00_1.5315.t7_cpu.t7', '-length', len];
  params[4] = '-temperature';
  params[5] = Math.random() * 0.8 + 0.1;
  params[6] = '-seed';
  params[7] = Math.floor(Math.random() * 1000);
  if (!txt) {
    txt = util.choice(lines);
  }

  // Remove any URLS
  txt = txt.replace(/http.*?(\s|$)/g, '');

  // Try some NLP
  var result = corenlp(txt, 9000, "ner,pos", "json");
  result = result.replace(/\n+/g, '');
  var nlp = JSON.parse(result);


  var options = [];
  for (var k = 0; k < nlp.sentences.length; k++) {
    var tokens = nlp.sentences[k].tokens;
    for (var i = 0; i < tokens.length; i++) {
      var pos = tokens[i].pos;
      var ner = tokens[i].ner;
      var word = tokens[i].originalText;
      if (ner == "PERSON") {
        for (var again = 0; again < 5; again++) options.push(word);
      } else if (/^[#@].*?/.test(word)) {
        // do nothing
      } else if (ner != "O" || pos == 'NN' || pos == 'NNS') {
        options.push(word);
      }
    }
  }
  console.log(options);


  var tokens = txt.split(/[^A-Z'@]+/i);
  util.cleanAll(tokens);
  var total = Math.floor(Math.random() * 2) + 1;
  if (tokens.length < 2) {
    total = 1;
  }

  var primetext = 'Survivor';
  //console.log(total, tokens);
  if (options.length > 0) {
    if (total === 1) {
      primetext = util.choice(options);
    } else {
      var pickone = util.choice(options);
      for (var find = 0; find < tokens.length; find++) {
        if (tokens[find] == pickone && find < tokens.length - 1) {
          primetext = pickone + ' ' + tokens[find + 1];
        } else if (tokens[find] == pickone) {
          primetext = tokens[find - 1] + ' ' + pickone;
        }
      }
    }
  } else {
    var start = util.randomInt(tokens.length);
    var end = util.randomInt(tokens.length);
    if (end < start) {
      var temp = start;
      start = end;
      end = start;
    }
    tokens = tokens.slice(start, end + 1);
    primetext = tokens.join(' ');
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
  // tweet = tweet.replace(/survivorsanjuandelsur/gi, 'SurvivorMillennialsVsGenX')

  tweet = tweet.replace(/survivor/g, 'hunted');
  tweet = tweet.replace(/Survivor/g, 'Hunted');
  tweet = tweet.replace(/SURVIVOR/g, 'HUNTED');
  tweet = tweet.replace(/survivor/gi, 'Hunted');



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

function falconer(start, prob) {
  if (!prob) {
    prob = 0;
  }
  console.log('original: ' + start);
  var output = [];

  // var tokens = util.tokenize(start);
  var result = corenlp(start, 9000, "ner,pos", "json");
  result = result.replace(/\n+/g, '');
  var nlp = JSON.parse(result);

  var allgood = false;
  var protection = 0;

  while (!allgood && protection < 100) {

    output = [];

    for (var k = 0; k < nlp.sentences.length; k++) {
      var tokens = nlp.sentences[k].tokens;
      for (var i = 0; i < tokens.length; i++) {
        var at = false;
        var ner = false;
        var pos = tokens[i].pos;
        var word = tokens[i].originalText;
        if (tokens[i].ner != "O") {
          pos = tokens[i].ner;
          ner = true;
        }
        if (/^#.*?/.test(word)) {
          pos = 'HASHTAG';
        }
        if (/^@.*?/.test(word)) {
          pos = 'PERSON';
          ner = true;
          at = true;
        }
        var options = posdict.dict[pos];
        if (options) {
          var r = Math.random();
          var swap = false;

          // Proper Noun
          // console.log('pos: ' + p);
          if (at) {
            swap = true;
            allgood = true;
          } else if ((r < 0.9) && pos == 'PERSON') {
            swap = true;
            allgood = true;
          } else if ((r < 0.8) && ner) {
            swap = true;
            allgood = true;
          } else if ((r < 0.4 + prob) && (pos == 'NN' || pos == 'NNS' || pos == 'JJ' || pos == 'VBN' || pos == 'VB' || pos == 'VBD')) {
            swap = true;
            allgood = true;
          } else if (r < 0.3 && pos == 'HASHTAG') {
            swap = true;
          } else if (r < 0.1 + prob) {
            swap = true;
          }
          // Hack to deal with contraction problem right now
          if (pos == 'MD' || pos == 'RB' || pos == "''") {
            swap = false;
          }

          if (swap) {
            var replace = util.choice(options);
            replace = util.capitalize(word, replace);
            console.log(pos + ' ' + word + ' --> ' + replace);
            if (pos == replace) {
              allgood = false;
            }
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
    if (!allgood) {
      console.log('not enough swapping, trying again.');
      protection++;
    }
  }

  if (protection >= 100) {
    return undefined;
  }
  var tweet = output.join('');
  tweet = tweet.replace(/’/, "'");
  return tweet;
}
