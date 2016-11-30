module.exports = POS;

var rita = require('rita');

function tokenize(s) {
  return s.split(/([^A-Z0-9'%]+)/i);
}

function POS() {
  this.dict = {};
  // this.dict['hashtag'] = [];
  this.dict['nnp'] = [];

  var current = [];

  this.clearNNP = function() {
    var cast = ['David', 'Zeke', 'Hannah', 'Sunday', 'Brett', 'Jay', 'Chris', 'Taylor', 'Jessica', 'Ken', 'Will'];
    this.dict['nnp'] = [];
    for (var i = 0; i < cast.length; i++) {
      //for (var j = 0; j < 1; j++) {
      this.dict['nnp'].push(cast[i]);
      //}
    }
  }


  this.process = function(txt) {
    var words = tokenize(txt);
    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      if (/\w+/.test(word)) {
        var pos = rita.RiTa.getPosTags(word);
        for (var j = 0; j < pos.length; j++) {
          var p = pos[j];
          if (!this.dict[p]) {
            this.dict[p] = [];
          }
          this.dict[p].push(word);
        }
      }
    }
  }

}
