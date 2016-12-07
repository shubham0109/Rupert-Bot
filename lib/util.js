module.exports = {

  tokenize: function(s) {
    return s.split(/([^A-Z0-9'%]+)/i);
  },
  clean: function(a) {
    // Just the last one
    var end = a.length - 1;
    if (a[end].length === 0 || /^\s+$/.test(a[end])) {
      a.splice(end, 1);
    }
  },
  cleanAll: function(a) {
    // Just the last one
    for (var i = a.length-1; i >= 0; i--) {
      if (a[i].length === 0 || /^\s+$/.test(a[i]) || a[i].charAt(0) === '@') {
        a.splice(i, 1);
      }
    }
  },
  capitalize: function(before, after) {
    if (/^[A-Z]+$/.test(before)) {
      return after.toUpperCase();
    } else if (/^[a-z]+$/.test(before)) {
      return after.toLowerCase();
    } else if (/^[A-Z][a-z]*$/.test(before)) {
      var c = after.charAt(0).toUpperCase();
      return c + after.substring(1, after.length);
    }
    return after;
  },

  choice: function(a) {
    var index = Math.floor(Math.random() * a.length);
    var picked = a[index];
    return picked;
  },

  truncate: function(s, maxlen) {
    var self = this;
    function randomPunc() {
      var punc = ['.', '.', '.', '.', '?', '!'];
      var i = Math.floor(Math.random() * punc.length);
      return punc[i];
    }

    function wordTruncate(s) {
      var regex = /(\s+)/;
      var words = s.split(regex);
      self.clean(words);
      words.splice(words.length - 1, 1);
      self.clean(words);
      words[words.length - 1] += randomPunc();
      return words;
    }

    s = s.trim();
    var regex = /([.!?]+)/;
    var sentences = s.split(regex);

    // Trim out empty spots
    this.clean(sentences);
    var len = sentences.length;
    var last = sentences[len - 1];

    if (regex.test(last)) {
      if (len > 3) {
        // Last two
        sentences.splice(len - 2, 2);
      } else if (len === 3) {
        // Last one
        sentences.splice(len - 1, 1);
      } else {
        sentences = wordTruncate(s);
      }
    } else {
      if (len > 2) {
        // Last one
        sentences.splice(len - 1, 1);
      } else {
        sentences = wordTruncate(s);
      }
    }

    //console.log(sentences);
    var truncated = sentences.join('');

    if (truncated.length > maxlen) {
      return this.truncate(truncated, maxlen);
    }

    return truncated;
  }
}
