function initGrammar() {
  rg.addRule('<start>', '<S> <HASHTAG>');
  rg.addRule('<start>', '<S> <HASHTAG> <HASHTAG>');
  rg.addRule('<start>', '<S> <S> <HASHTAG>');
  rg.addRule('<NVP>', '<NP> <VP>')
  rg.addRule('<NVP>', '<NP> <MD> <VP>')
  rg.addRule('<S>', '<UH><PUNC> <S>');
  rg.addRule('<S>', '<NVP><PUNC>');
  rg.addRule('<S>', '<NVP> <CC> <S>');
  rg.addRule('<NP>', '<DT> <JJ> <NN>');
  rg.addRule('<NP>', '<DT> <NN>');
  rg.addRule('<NOUN>', '<NN>');
  rg.addRule('<NOUN>', '<NNS>');
  rg.addRule('<NP>', '<DT> <NOUN> <CC> <NOUN>', 0.1);
  rg.addRule('<NP>', '<NOUN>');
  rg.addRule('<NP>', '<CD> <NOUN>');
  rg.addRule('<NP>', '<NOUN> <CC> <NOUN>', 0.1);
  rg.addRule('<PPN>', '<NNP>');
  rg.addRule('<PPN>', '<NNPS>');
  rg.addRule('<NP>', '<PPN>');
  rg.addRule('<NP>', '<PPN> <CC> <PRP>', 0.1);
  rg.addRule('<NP>', '<PRP>');
  rg.addRule('<VERB>', '<VB>');
  rg.addRule('<VERB>', '<VBD>');
  rg.addRule('<VP>', '<VERB>');
  rg.addRule('<VP>', '<VERB> <RB>');
  rg.addRule('<VP>', '<VERB> <NP>');
  rg.addRule('<VP>', '<VERB> <NP> <PP>');
  rg.addRule('<VP>', '<VERB> <PP>');
  rg.addRule('<PP>', '<IN> <NP>');
  rg.addRule('<ADJP>', '<JJ>');
  rg.addRule('<ADJP>', '<JJR>');
  rg.addRule('<ADJP>', '<PRP$>');
  rg.addRule('<ADJP>', '<JJS>');
  rg.addRule('<PUNC>', '.');
  rg.addRule('<PUNC>', '?');
  rg.addRule('<PUNC>', '!');
}

// MISSING pos
// http://rednoise.org/rita/reference/PennTags.html
// EX WRB WP WDT VBZ VBP

function addWords(words) {
  // Go through all the words
  for (var i = 0; i < words.length; i++) {
    var word = words[i];
    var count = concordance.getCount(word);
    var prob = count / concordance.total;
    //console.log(word, prob);

    if (word.charAt(0) == '#') {
      rg.addRule('<HASHTAG>', word, prob);
    } else if (word.charAt(0) == '@') {
      rg.addRule('NNP', word)
    } else {
      // Use RiTa's Analyzer to determine syllable count
      var pos = RiTa.getPosTags(word);
      for (var j = 0; j < pos.length; j++) {
        var p = '<' + pos[j].toUpperCase() + '>';
        rg.addRule(p, word)
      }
    }
    // Syllables are separated with colons
  }

}

function preload() {
  txt = loadStrings('rupert.txt');
}

var concordance;
var txt;
var rg;
var rm;
var markov;
var hashtags = [];

function setup() {
  noCanvas();

  // Count all the words
  concordance = new Concordance();
  for (var i = 0; i < txt.length; i++) {
    concordance.process(txt[i]);
  }
  var keys = concordance.getKeys();

  rg = new RiGrammar();
  initGrammar();
  addWords(keys);

  rm = new RiMarkov(2);
  rm.loadText(txt.join('\n'));

  markov = new MarkovGenerator(5, 140);
  for (var i = 0; i < txt.length; i++) {
    markov.feed(txt[i]);
  }

  button = createButton('generate a tweet');
  button.mousePressed(tweetIt);

  button = createButton('clear');
  button.mousePressed(clearIt);
}



function tweetIt() {

  var tweet;

  var r = random(1);
  if (r < 0.33) {
    console.log('char markov');
    tweet = markov.generate();
  } else if (r < 0.67) {
    console.log('sentence markov');
    var result = rm.generateSentences(1);
    tweet = result[0] + ' ' + rg.expandFrom('<HASHTAG>');
  } else {
    console.log('cfg');
    var result = rg.expand();
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
          var pos = RiTa.getPosTags(word);
          if (word.length > 1 && !/^[A-Z]+$/.test(word) && !/nnp/.test(pos[0])) {
            word = word.toLowerCase();
          }
        }
        output.push(word);
      }
    }
    tweet = output.join('');
  }



  createP(tweet).class('tweets');
}

function clearIt() {
  var pars = selectAll('.tweets');
  for (var i = 0; i < pars.length; i++) {
    pars[i].remove();
  }
}
