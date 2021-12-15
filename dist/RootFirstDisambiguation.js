(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./NaiveDisambiguation", "nlptoolkit-ngram/dist/NGram", "nlptoolkit-ngram/dist/LaplaceSmoothing", "nlptoolkit-dictionary/dist/Dictionary/Word"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RootFirstDisambiguation = void 0;
    const NaiveDisambiguation_1 = require("./NaiveDisambiguation");
    const NGram_1 = require("nlptoolkit-ngram/dist/NGram");
    const LaplaceSmoothing_1 = require("nlptoolkit-ngram/dist/LaplaceSmoothing");
    const Word_1 = require("nlptoolkit-dictionary/dist/Dictionary/Word");
    class RootFirstDisambiguation extends NaiveDisambiguation_1.NaiveDisambiguation {
        /**
         * The disambiguate method gets an array of fsmParses. Then loops through that parses and finds the most probable root
         * word and removes the other words which are identical to the most probable root word. At the end, gets the most probable parse
         * among the fsmParses and adds it to the correctFsmParses {@link Array}.
         *
         * @param fsmParses {@link FsmParseList} to disambiguate.
         * @return correctFsmParses {@link Array} which holds the most probable parses.
         */
        disambiguate(fsmParses) {
            let correctFsmParses = new Array();
            for (let i = 0; i < fsmParses.length; i++) {
                let bestWord = this.getBestRootWord(fsmParses[i]);
                fsmParses[i].reduceToParsesWithSameRootAndPos(bestWord);
                let bestParse = this.getParseWithBestIgProbability(fsmParses[i], correctFsmParses, i);
                if (bestParse != undefined) {
                    correctFsmParses.push(bestParse);
                }
            }
            return correctFsmParses;
        }
        /**
         * The train method initially creates new NGrams; wordUniGramModel, wordBiGramModel, igUniGramModel, and igBiGramModel. It gets the
         * sentences from given corpus and gets each word as a DisambiguatedWord. Then, adds the word together with its part of speech
         * tags to the wordUniGramModel. It also gets the transition list of that word and adds it to the igUniGramModel.
         * <p>
         * If there exists a next word in the sentence, it adds the current and next {@link DisambiguatedWord} to the wordBiGramModel with
         * their part of speech tags. It also adds them to the igBiGramModel with their transition lists.
         * <p>
         * At the end, it calculates the NGram probabilities of both word and ig unigram models by using LaplaceSmoothing, and
         * both word and ig bigram models by using InterpolatedSmoothing.
         *
         * @param corpus {@link DisambiguationCorpus} to train.
         */
        train(corpus) {
            this.wordUniGramModel = new NGram_1.NGram(1);
            this.wordBiGramModel = new NGram_1.NGram(2);
            this.igUniGramModel = new NGram_1.NGram(1);
            this.igBiGramModel = new NGram_1.NGram(2);
            for (let i = 0; i < corpus.sentenceCount(); i++) {
                let sentence = corpus.getSentence(i);
                for (let j = 0; j < sentence.wordCount(); j++) {
                    let word = sentence.getWord(j);
                    let words1 = new Array();
                    let words2 = new Array();
                    let igs1 = new Array();
                    let igs2 = new Array();
                    words1.push(word.getParse().getWordWithPos().getName());
                    this.wordUniGramModel.addNGram(words1);
                    igs1.push(word.getParse().getMorphologicalParseTransitionList());
                    this.igUniGramModel.addNGram(igs1);
                    if (j + 1 < sentence.wordCount()) {
                        words2.push(words1[0]);
                        words2.push(sentence.getWord(j + 1).getParse().getWordWithPos().getName());
                        this.wordBiGramModel.addNGram(words2);
                        igs2.push(igs1[0]);
                        igs2.push(sentence.getWord(j + 1).getParse().getMorphologicalParseTransitionList());
                        this.igBiGramModel.addNGram(igs2);
                    }
                }
            }
            this.wordUniGramModel.calculateNGramProbabilitiesSimple(new LaplaceSmoothing_1.LaplaceSmoothing());
            this.igUniGramModel.calculateNGramProbabilitiesSimple(new LaplaceSmoothing_1.LaplaceSmoothing());
            this.wordBiGramModel.calculateNGramProbabilitiesSimple(new LaplaceSmoothing_1.LaplaceSmoothing());
            this.igBiGramModel.calculateNGramProbabilitiesSimple(new LaplaceSmoothing_1.LaplaceSmoothing());
        }
        /**
         * The getWordProbability method returns the probability of a word by using word bigram or unigram model.
         *
         * @param word             Word to find the probability.
         * @param correctFsmParses FsmParse of given word which will be used for getting part of speech tags.
         * @param index            Index of FsmParse of which part of speech tag will be used to get the probability.
         * @return The probability of the given word.
         */
        getWordProbability(word, correctFsmParses, index) {
            if (index != 0 && correctFsmParses.length == index) {
                return this.wordBiGramModel.getProbability(correctFsmParses[index - 1].getWordWithPos().getName(), word.getName());
            }
            else {
                return this.wordUniGramModel.getProbability(word.getName());
            }
        }
        /**
         * The getIgProbability method returns the probability of a word by using ig bigram or unigram model.
         *
         * @param word             Word to find the probability.
         * @param correctFsmParses FsmParse of given word which will be used for getting transition list.
         * @param index            Index of FsmParse of which transition list will be used to get the probability.
         * @return The probability of the given word.
         */
        getIgProbability(word, correctFsmParses, index) {
            if (index != 0 && correctFsmParses.length == index) {
                return this.igBiGramModel.getProbability(correctFsmParses[index - 1].getFsmParseTransitionList(), word.getName());
            }
            else {
                return this.igUniGramModel.getProbability(word.getName());
            }
        }
        /**
         * The getBestRootWord method takes a {@link FsmParseList} as an input and loops through the list. It gets each word with its
         * part of speech tags as a new {@link Word} word and its transition list as a {@link Word} ig. Then, finds their corresponding
         * probabilities. At the end returns the word with the highest probability.
         *
         * @param fsmParseList {@link FsmParseList} is used to get the part of speech tags and transition lists of words.
         * @return The word with the highest probability.
         */
        getBestRootWord(fsmParseList) {
            let bestProbability = Number.NEGATIVE_INFINITY;
            let bestWord = undefined;
            for (let j = 0; j < fsmParseList.size(); j++) {
                let word = fsmParseList.getFsmParse(j).getWordWithPos().getName();
                let ig = fsmParseList.getFsmParse(j).getFsmParseTransitionList();
                let wordProbability = this.wordUniGramModel.getProbability(word);
                let igProbability = this.igUniGramModel.getProbability(ig);
                let probability = wordProbability * igProbability;
                if (probability > bestProbability) {
                    bestWord = new Word_1.Word(word);
                    bestProbability = probability;
                }
            }
            return bestWord;
        }
        /**
         * The getParseWithBestIgProbability gets each {@link FsmParse}'s transition list as a {@link Word} ig. Then, finds the corresponding
         * probabilitt. At the end returns the parse with the highest ig probability.
         *
         * @param parseList        {@link FsmParseList} is used to get the {@link FsmParse}.
         * @param correctFsmParses FsmParse is used to get the transition lists.
         * @param index            Index of FsmParse of which transition list will be used to get the probability.
         * @return The parse with the highest probability.
         */
        getParseWithBestIgProbability(parseList, correctFsmParses, index) {
            let bestParse = undefined;
            let bestProbability = Number.NEGATIVE_INFINITY;
            for (let j = 0; j < parseList.size(); j++) {
                let ig = new Word_1.Word(parseList.getFsmParse(j).getFsmParseTransitionList());
                let probability = this.getIgProbability(ig, correctFsmParses, index);
                if (probability > bestProbability) {
                    bestParse = parseList.getFsmParse(j);
                    bestProbability = probability;
                }
            }
            return bestParse;
        }
    }
    exports.RootFirstDisambiguation = RootFirstDisambiguation;
});
//# sourceMappingURL=RootFirstDisambiguation.js.map