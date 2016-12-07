// var StanfordSimpleNLP = require('stanford-simple-nlp');
//
// var stanfordSimpleNLP = new StanfordSimpleNLP.StanfordSimpleNLP();
// stanfordSimpleNLP.loadPipelineSync();
// console.log("about to process");
// var result = stanfordSimpleNLP.process('Rupert went to Paris and had a good time. #hashtag', processed);
// console.log(result);
// function processed(err, result) {
//   console.log(err);
//   console.log("mid-process");
//   var fs = require('fs');
//   var json = JSON.stringify(result, null, 2);
//   fs.writeFile("corenlp.json", json);
// }
// console.log("finished process");
//
// // var java = require('java');
// // java.newInstanceSync("java.lang.String");

var corenlp = require("corenlp-js-interface");
// corenlp.port = 9000;
// corenlp.annotators= "parse";
// corenlp.format = "json";
// corenlp.parseJson = true;

var tweet = "This is a test tweet from Bob vacationing in Paris. #Survivor"

// annotators: ['tokenize', 'ssplit', 'pos', 'lemma', 'ner', 'parse', 'dcoref']

//var text = corenlp(tweet, 9000, "parse,tokenize,ssplit,ner,pos", "json");
var text = corenlp(tweet, 9000, "ner,pos", "json");
text = text.replace(/\n+/g, '');
var result = JSON.parse(text);
var fs = require('fs');
var output = JSON.stringify(result, null, 2);
fs.writeFile("corenlp.json", output, finished);
function finished() {
  
}
