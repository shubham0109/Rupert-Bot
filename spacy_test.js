var spacyNLP = require('spacy-nlp');
// default port 6466
// start the server with the python client that exposes spacyIO (or use an existing socketIO server at IOPORT)
var serverPromise = spacyNLP.server({ port: process.env.IOPORT })
// Loading spacy may take up to 15s

// var nlp = spacyNLP.nlp
//
// // Note you can pass multiple sentences concat in one string.
// nlp.parse('Bob Brought the pizza to Alice.')
//   .then((output) => {
//     console.log(output)
//     console.log(JSON.stringify(output[0].parse_tree, null, 2))
//   });
