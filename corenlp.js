//
// var util = require('./lib/util');
//
// var tweet = "Good move by Brenda, or uncomfortable? #survivor"
// tweet = util.truncate(tweet, 10);
// console.log(tweet);



var corenlp = require("corenlp-js-interface");
// corenlp.port = 9000;
// corenlp.annotators= "parse";
// corenlp.format = "json";
// corenlp.parseJson = true;

var tweet = "I can't"

// annotators: ['tokenize', 'ssplit', 'pos', 'lemma', 'ner', 'parse', 'dcoref']
//var text = corenlp(tweet, 9000, "parse,tokenize,ssplit,ner,pos", "json");
var text = corenlp(tweet, 9000, "ner,pos", "json");
//var text = corenlp(tweet, 9000, "parse,ner,pos", "json");
text = text.replace(/\n+/g, '');
var result = JSON.parse(text);
console.log(result.sentences[0].tokens);


// var fs = require('fs');
// var output = JSON.stringify(result, null, 2);
// fs.writeFile("corenlp.json", output, finished);
// function finished() {
//
// }
