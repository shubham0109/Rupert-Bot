module.exports = POS;

// var rita = require('rita');

var util = require('./util');
var corenlp = require("corenlp-js-interface");

function POS() {
  this.dict = {};
  this.dict['hashtag'] = [];
  this.dict['PERSON'] = [];

  var current = [];

  this.clearNNP = function() {
    var incast = ['Andrea', 'Brad', 'Culpepper', 'Aubry',
      'Cirie', 'Michaela', 'Tai',
      'Sarah', 'Troyzan', 'Sierra'
    ];
    var outcast = ['Probst', 'Jeff Probst', 'Zeke', 'Hali', 'Ozzy', 'Debbie'];
    var eliminated = ['Ciera', 'Tony', 'Caleb', 'Malcolm', 'JT', 'Sandra'];
    this.dict['PERSON'] = [];
    for (var i = 0; i < incast.length; i++) {
      for (var j = 0; j < 5; j++) {
        this.dict['PERSON'].push(incast[i]);
      }
    }
    for (var i = 0; i < outcast.length; i++) {
      this.dict['PERSON'].push(outcast[i]);
    }
  }

  // For future reference
  // this.clearNNPHunted = function() {
  //   var hunted = ['Lee', 'Hilmar', 'Aarif', 'Immad', 'English', 'Stephen'];
  //   this.dict['PERSON'] = [];
  //   for (var i = 0; i < hunted.length; i++) {
  //     for (var j = 0; j < 10; j++) {
  //       this.dict['PERSON'].push(hunted[i]);
  //     }
  //   }
  //   var teams = ['Team Alpha', 'Team Bravo', 'Team Charlie', 'Team Delta', 'Team Echo', 'Team Foxtrot', 'Team Golf', 'Team Hotel', 'Team India'];
  //   for (var i = 0; i < teams.length; i++) {
  //     for (var j = 0; j < 5; j++) {
  //       this.dict['PERSON'].push(teams[i]);
  //     }
  //   }
  //
  //   var hunters = ['Jacquie', 'Jermaine', 'Amanda', 'Walter', 'Jonathan', 'Nick', 'Chad', 'Roxanne', 'Cortice', 'Maureen', 'Allison', 'Sam', 'John', 'Evy', 'Paul', 'Vincent', 'John', 'Robert', 'Myke', 'Charles', 'Lenny', 'Steve', 'Connie', 'Ben', 'Theresa', 'Aki', 'Ryan', 'Zaira', 'Landon', 'Andy', 'Ma'];
  //   for (var i = 0; i < hunters.length; i++) {
  //     this.dict['PERSON'].push(hunters[i]);
  //   }
  // }

  this.process = function(txt) {
    var result = corenlp(txt, 9000, "ner,pos", "json");
    var nlp = JSON.parse(result);
    // console.log('processing ' + txt);
    for (var s = 0; s < nlp.sentences.length; s++) {
      var tokens = nlp.sentences[s].tokens;

      if (tokens) {
        for (var i = 0; i < tokens.length; i++) {
          var word = tokens[i].word;
          var pos = tokens[i].pos;
          if (tokens[i].ner != "O") {
            pos = tokens[i].ner;
          }
          if (/^#.*?/.test(word)) {
            pos = 'HASHTAG';
          }
          if (/^@.*?/.test(word)) {
            pos = 'MENTION';
          }
          if (!this.dict[pos]) {
            this.dict[pos] = [];
          }
          // console.log(word, pos);
          this.dict[pos].push(word);
        }
      } else {
        console.log("No tokens: " + txt);
      }
    }
    // var words = util.tokenize(txt);
    // for (var i = 0; i < words.length; i++) {
    //   var word = words[i];
    //   if (/\w+/.test(word)) {
    //     var pos = rita.RiTa.getPosTags(word);
    //     for (var j = 0; j < pos.length; j++) {
    //       var p = pos[j];
    //       if (!this.dict[p]) {
    //         this.dict[p] = [];
    //       }
    //       this.dict[p].push(word);
    //     }
    //   }
    // }
  }

}
