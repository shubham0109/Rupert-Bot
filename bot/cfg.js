module.exports = CFG;

var rita = require('rita');

function CFG() {
  this.rg = new rita.RiGrammar();
}

CFG.prototype.initGrammar = function() {
  this.rg.addRule('<start>', '<S> <HASHTAG>');
  this.rg.addRule('<start>', '<S> <HASHTAG> <HASHTAG>');
  this.rg.addRule('<start>', '<S> <S> <HASHTAG>', 0.5);
  this.rg.addRule('<NVP>', '<NP> <VP>')
  this.rg.addRule('<NVP>', '<NP> <MD> <VP>')
  this.rg.addRule('<S>', '<UH><PUNC> <S>');
  this.rg.addRule('<S>', '<NVP><PUNC>', 0.6);
  this.rg.addRule('<S>', '<NVP> <CC> <S>', 0.3);
  this.rg.addRule('<NP>', '<DT> <JJ> <NN>');
  this.rg.addRule('<NP>', '<DT> <NN>');
  this.rg.addRule('<NOUN>', '<NN>');
  this.rg.addRule('<NOUN>', '<NNS>');
  this.rg.addRule('<NP>', '<DT> <NOUN> <CC> <NOUN>', 0.1);
  this.rg.addRule('<NP>', '<NOUN>');
  this.rg.addRule('<NP>', '<CD> <NOUN>');
  this.rg.addRule('<NP>', '<NOUN> <CC> <NOUN>', 0.1);
  this.rg.addRule('<PPN>', '<NNP>');
  this.rg.addRule('<PPN>', '<NNPS>');
  this.rg.addRule('<NP>', '<PPN>');
  this.rg.addRule('<NP>', '<PPN> <CC> <PRP>', 0.1);
  this.rg.addRule('<NP>', '<PRP>');
  this.rg.addRule('<VERB>', '<VB>');
  this.rg.addRule('<VERB>', '<VBD>');
  this.rg.addRule('<VP>', '<VERB>');
  this.rg.addRule('<VP>', '<VERB> <RB>');
  this.rg.addRule('<VP>', '<VERB> <NP>');
  this.rg.addRule('<VP>', '<VERB> <NP> <PP>');
  this.rg.addRule('<VP>', '<VERB> <PP>');
  this.rg.addRule('<PP>', '<IN> <NP>');
  this.rg.addRule('<ADJP>', '<JJ>');
  this.rg.addRule('<ADJP>', '<JJR>');
  this.rg.addRule('<ADJP>', '<PRP$>');
  this.rg.addRule('<ADJP>', '<JJS>');
  this.rg.addRule('<PUNC>', '.');
  this.rg.addRule('<PUNC>', '?');
  this.rg.addRule('<PUNC>', '!');
  this.rg.addRule('<PUNC>', '!');
}

// MISSING pos
// http://rednoise.org/rita/reference/PennTags.html
// EX WRB WP WDT VBZ VBP

CFG.prototype.addWords = function(wordcounts) {
  var words = wordcounts.getKeys();
  // Go through all the words
  for (var i = 0; i < words.length; i++) {
    var word = words[i];
    var count = wordcounts.getCount(word);
    var prob = count / wordcounts.total;
    //console.log(word, prob);

    if (word.charAt(0) == '#') {
      this.rg.addRule('<HASHTAG>', word, prob);
    } else if (word.charAt(0) == '@') {
      this.rg.addRule('NNP', word)
    } else {
      // Use RiTa's Analyzer to determine syllable count
      var pos = rita.RiTa.getPosTags(word);
      for (var j = 0; j < pos.length; j++) {
        var p = '<' + pos[j].toUpperCase() + '>';
        this.rg.addRule(p, word)
      }
    }
    // Syllables are separated with colons
  }

}

CFG.prototype.expand = function() {
  return this.rg.expand();
}
