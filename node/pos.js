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
    var incast = ['David', 'Zeke', 'Hannah', 'Sunday', 'Brett', 'Jay', 'Ken', 'Will'];
    var outcast = ['Chris', 'Taylor', 'Jessica', 'Michelle'];
    this.dict['nnp'] = [];
    for (var i = 0; i < incast.length; i++) {
      for (var j = 0; j < 5; j++) {
        this.dict['nnp'].push(incast[i]);
      }
    }
    for (var i = 0; i < outcast.length; i++) {
      this.dict['nnp'].push(outcast[i]);
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
