# Rupert-Bot
[Rupert Botham](http://twitter.com/rupbot), of course.

# Current Features
* [x] Tweets every 5 minutes from 8pm-12am EST every Wednesday.
* [x] Tweets at other users when followed.
* [x] Responds to tweets
* [ ] Tweet when real rupert tweets

# Training Set
* [Rupert Tweets about survivor](https://github.com/shiffman/Rupert-Bot/blob/master/data/rupert_tweets_edited.txt)
* [Rupert Interviews](https://github.com/shiffman/Rupert-Bot/blob/master/data/rupert_interviews.txt)
* [Rupert Reddit AMA](https://github.com/shiffman/Rupert-Bot/blob/master/data/rupert_reddit.txt)
* [Rupert Confessionals](https://github.com/shiffman/Rupert-Bot/blob/master/data/rupert_confessionals.txt)

# How does Rupbot work?

When Rupbot tweets, it picks one of four options.

1. Word level markov chain (order: 2).  Using [RiTaJS](https://github.com/dhowe/RiTaJS/), Rupbot picks a random sequence of two starting words.  Until it reaches the end of a "sentence" it continues to pick new words from its vocabulary based on their [n-grams](https://en.wikipedia.org/wiki/N-gram) of order 2 (also known as "bi-grams") probabilities.  For more about markov chains: http://shiffman.net/a2z/markov

2. Character level markov chain (order: 5).  Rupbot picks a random sequence of 5 characters from its vocabulary and generates new characters based on n-gram probabilities.  It stops at 140 characters. For more about markov chains: http://shiffman.net/a2z/markov

3. LSTM (explanation coming soon)

4. Context-Free Grammar.  Using the [Penn Tag Set](https://www.ling.upenn.edu/courses/Fall_2003/ling001/penn_treebank_pos.html) Rupbot has categorized all words in its vocabulary into "part of speech" lists.  Rupbot then can generate a sentence based a very simple English language grammar tree.  The specific grammar can be found in [cfg.js](https://github.com/shiffman/Rupert-Bot/blob/gh-pages/node/cfg.js) and it looks something like below.  For more about CFG: http://shiffman.net/a2z/cfg/


```
<start> --> <S> <HASHTAG>
<start> --> <S> <HASHTAG> <HASHTAG>
<NVP>   --> <NP> <VP>
<NVP>   --> <NP> <MD> <VP>
<S>     --> <UH><PUNC>
<S>     --> <UH><PUNC> <S>
<S>     --> <UH><PUNC> <NVP><PUNC>
<S>     --> <NVP><PUNC>
<NOUN>  --> <NN> | <NNS>
<NP>    --> <DT> <ADJP> <NOUN>
<NP>    --> <DT> <NOUN>
<VERB> --> <VB> | <VBD>
<VP> --> <VERB>
<VP> --> <VERB> <RB>
<VP> --> <VERB> <NP>
<VP> --> <VERB> <NP> <PP>
<ADJP> --> <JJ> | <JJR> | <PRP$> | <JJS>
<PUNC> --> . | ? | !
```
