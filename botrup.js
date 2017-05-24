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

var livetweets = [
  'It\'s almost time for tonight\'s episode of #Survivor. Will you be around to live tweet with me? #survivor',
  'Each Wednesday night I live tweet Survivor! Watch along with me!'
];

// var livetweets = [
//   'It\'s almost time for tonight\'s episode of #Hunted. Will you be around to live tweet with me? #Hunted',
// ];

// Using the Twit node package
// https://github.com/ttezel/twit
var Twit = require('twit');
var rita = require('rita');

// Pulling all my twitter account info from another file
var config = require('./config.js');

// Making a Twit object for connection to the API
var T = new Twit(config);

var fs = require('fs');

// var txt = fs.readFileSync('data/rupert_test.txt', 'utf-8');
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
posdict.clearNNP();

// HUNTED!
// posdict.clearNNPHunted();

var testing = false;

// Testing reply picking algorithm
// LSTMTweet(150, 'test','This is @test and #testing but my name is Dan.','12345');

// Start once
tweeter();

var howoften = 5;

// var tst = 'Watching learn English is like watching sentient crystals speak through Data calling us "ugly bags of mostly water". #STNG';
// LSTMTweet(150, 'blah', tst, 111);

// Once every N milliseconds
if (testing) {
  setInterval(tweeter, 5000);
} else {
  setInterval(tweeter, 60 * howoften * 1000);
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
  if (day == 3 && hours == 23 && minutes > (59 - howoften)) {
    starting = true;
  }
  if (day != 4) {
    live = false;
  }
  if (hours < 0 || hours > 5) {
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

function swapPeople(tweet) {
  var result = corenlp(tweet, 9000, "ner,pos", "json");
  result = result.replace(/\n+/g, '');
  var nlp = JSON.parse(result);
  var output = [];
  for (var k = 0; k < nlp.sentences.length; k++) {
    var tokens = nlp.sentences[k].tokens;
    for (var i = 0; i < tokens.length; i++) {
      var at = false;
      var ner = false;
      var pos = tokens[i].pos;
      var word = tokens[i].originalText;
      if (tokens[i].ner != "O") {
        pos = tokens[i].ner;
      }
      if (/^#.*?/.test(word)) {
        pos = 'HASHTAG';
      }
      if (/^@.*?/.test(word)) {
        pos = 'PERSON';
        at = true;
      }
      if (pos == 'PERSON') {
        var options = posdict.dict['PERSON'];
        var r = Math.random();
        var swap = false;
        if (at) {
          swap = true;
        } else if (r < 0.75) {
          swap = true;
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

  var tweet = output.join('');
  tweet = tweet.replace(/’/g, "'");
  return tweet;
}

function generateTweet(name) {
  var tweet;

  var r = Math.random();

  if (r < 0.1) {
    console.log('char markov');
    tweet = markov.generate();
    if (Math.random() < 0.5) {
      var hash = cfg.expandFrom('<HASHTAG>');
      tweet = tweet + ' ' + hash;
    }
    tweet = swapPeople(tweet);
  } else if (r < 0.2) {
    console.log('sentence markov');
    var result = rm.generateSentences(1);
    tweet = result[0];
    // Fixing hashtags
    tweet = tweet.replace(/#\s+(\w+)/, '#$1');
    if (Math.random() < 0.5) {
      var hash = cfg.expandFrom('<HASHTAG>');
      tweet = tweet + ' ' + hash;
    }
    tweet = swapPeople(tweet);
  } else if (r < 0.3) {
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
    tweet = swapPeople(tweet);
  } else if (r < 0.85) {
    console.log('the falconer');
    console.log(lines.length);
    var start = util.choice(lines);

    // Protect against empty tweets
    while (start.length < 1) {
      start = util.choice(lines);
    }

    tweet = falconer(start);
  } else {
    console.log('LSTM! ' + name);
    LSTMTweet(150);
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
  // console.log(name);

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

  // We need prime text, start by assuming none
  var primetext = undefined;

  var spawn = require('child_process').spawn;

  var params = ['sample.lua', 'rnn/rupert_032917_cpu.t7', '-length', len];
  params[4] = '-temperature';
  params[5] = Math.random() * 0.8 + 0.1;
  params[6] = '-seed';
  params[7] = Math.floor(Math.random() * 1000);
  if (!txt) {
    // Let's sometimes prime with a current cast member!
    if (Math.random() < 0.5) {
      var next = ['is', 'was', 'can', 'should', 'has', '', '', '', '', '', '', '', '', '', ''];
      next = util.choice(next);
      primetext = util.choice(posdict.dict['PERSON']) + ' ' + next;
    } else {
      txt = util.choice(lines);
    }
  }

  // If there isn't primetext already, go through this crazy process of picking some
  if (!primetext) {
    // Try to fix a bug?
    // if (!txt) {
    //   txt = util.choice(posdict.dict['PERSON']);
    // }
    txt = txt.replace(/http.*?(\s|$)/gi, '');
    txt = txt.replace(/@.*?\b/gi, '');
    txt = txt.replace(/#.*?\b/gi, '');
    // Forget about any mentions of rupbot
    txt = txt.replace(/rupbot/gi, '');

    // Try some NLP
    var result = corenlp(txt, 9000, "ner,pos", "json");
    result = result.replace(/\n+/g, '');
    var nlp = JSON.parse(result);


    var options = [];

    var first = true;

    for (var k = 0; k < nlp.sentences.length; k++) {
      var tokens = nlp.sentences[k].tokens;
      for (var i = 0; i < tokens.length; i++) {

        // The first two words are a good option
        if (first && tokens.length > 1) {
          options.push(tokens[i].originalText + tokens[i].after + tokens[i + 1].originalText);
          first = false;
        }
        // Last word is also a good option
        if (k == nlp.sentences.length - 1 && i == tokens.length - 1) {
          var w = tokens[i].originalText;
          if (w.length < 2 && tokens.length > 1) {
            options.push(tokens[i-1].originalText);
          } else {
            options.push(w);
          }
        }
        var pos = tokens[i].pos;
        var ner = tokens[i].ner;
        var word = tokens[i].originalText;
        if (ner == "PERSON") {
          options.push(word);
          if (i < tokens.length - 1) {
            options.push(word + tokens[i].after + tokens[i + 1].originalText);
          }
          options.push
        } else if (ner != "O" || pos == 'NN' || pos == 'NNS' || options.length == 0) {
          options.push(word);
          if (i < tokens.length - 1) {
            options.push(word + tokens[i].after + tokens[i + 1].originalText);
          }
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
    //console.log(total, tokens);
    if (options.length > 0) {
      //if (total === 1) {
      primetext = util.choice(options);
      // For get all this nonsense, make options with more than one word from time to time
      // } else {
      //   var pickone = util.choice(options);
      //   for (var find = 0; find < tokens.length; find++) {
      //     if (tokens[find] == pickone && find < tokens.length - 1) {
      //       primetext = pickone + ' ' + tokens[find + 1];
      //     } else if (tokens[find] == pickone && find > 0) {
      //       primetext = tokens[find - 1] + ' ' + pickone;
      //     } else {
      //       primetext = pickone;
      //     }
      //   }
      // }
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
  }

  // Last chance just in case, grab a castmember name
  if (!primetext) {
    primetext = util.choice(posdict.dict['PERSON']);
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
      replyText = swapPeople(results[0]);
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
          } else if ((r < 0.5) && ner) {
            swap = true;
            allgood = true;
          } else if ((r < 0.2 + prob) && (pos == 'NN' || pos == 'NNS' || pos == 'JJ' || pos == 'VBN' || pos == 'VB' || pos == 'VBD')) {
            swap = true;
            allgood = true;
          } else if (r < 0.2 && pos == 'HASHTAG') {
            swap = true;
          } else if (r < 0.05 + prob) {
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
