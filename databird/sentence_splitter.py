import nltk.data
import codecs

sent_detector = nltk.data.load('tokenizers/punkt/english.pickle')

# f = open("rupert.txt")
f = codecs.open("tbird_confessionals.txt", "r", "utf-8")
text = f.read()
# print(text)
sentences = sent_detector.tokenize(text)
# print(sentences)
fout = codecs.open("tbird_sentences.txt", "w", "utf-8")
for sentence in sentences:
  fout.write("%s\n" % sentence)
