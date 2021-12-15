(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./NaiveDisambiguation", "nlptoolkit-ngram/dist/NGram", "nlptoolkit-ngram/dist/LaplaceSmoothing"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HmmDisambiguation = void 0;
    const NaiveDisambiguation_1 = require("./NaiveDisambiguation");
    const NGram_1 = require("nlptoolkit-ngram/dist/NGram");
    const LaplaceSmoothing_1 = require("nlptoolkit-ngram/dist/LaplaceSmoothing");
    class HmmDisambiguation extends NaiveDisambiguation_1.NaiveDisambiguation {
        /**
         * The disambiguate method takes {@link FsmParseList} as an input and gets one word with its part of speech tags, then gets its probability
         * from word unigram model. It also gets ig and its probability. Then, hold the logarithmic value of  the product of these probabilities in an array.
         * Also by taking into consideration the parses of these word it recalculates the probabilities and returns these parses.
         *
         * @param fsmParses {@link FsmParseList} to disambiguate.
         * @return ArrayList of FsmParses.
         */
        disambiguate(fsmParses) {
            if (fsmParses.length == 0) {
                return undefined;
            }
            for (let i = 0; i < fsmParses.length; i++) {
                if (fsmParses[i].size() == 0) {
                    return undefined;
                }
            }
            let correctFsmParses = new Array();
            let probabilities = new Array();
            let best = new Array();
            for (let i = 0; i < fsmParses.length; i++) {
                probabilities.push(new Array());
                best.push(new Array());
            }
            for (let i = 0; i < fsmParses[0].size(); i++) {
                let currentParse = fsmParses[0].getFsmParse(i);
                let w1 = currentParse.getWordWithPos().getName();
                let probability = this.wordUniGramModel.getProbability(w1);
                for (let j = 0; j < currentParse.size(); j++) {
                    let ig1 = currentParse.getInflectionalGroup(j).toString();
                    probability *= this.igUniGramModel.getProbability(ig1);
                }
                probabilities[0].push(Math.log(probability));
            }
            for (let i = 1; i < fsmParses.length; i++) {
                for (let j = 0; j < fsmParses[i].size(); j++) {
                    let bestProbability = Number.NEGATIVE_INFINITY;
                    let bestIndex = -1;
                    let currentParse = fsmParses[i].getFsmParse(j);
                    for (let k = 0; k < fsmParses[i - 1].size(); k++) {
                        let previousParse = fsmParses[i - 1].getFsmParse(k);
                        let w1 = previousParse.getWordWithPos().getName();
                        let w2 = currentParse.getWordWithPos().getName();
                        let probability = probabilities[i - 1][k] + Math.log(this.wordBiGramModel.getProbability(w1, w2));
                        for (let t = 0; t < fsmParses[i].getFsmParse(j).size(); t++) {
                            let ig1 = previousParse.lastInflectionalGroup().toString();
                            let ig2 = currentParse.getInflectionalGroup(t).toString();
                            probability += Math.log(this.igBiGramModel.getProbability(ig1, ig2));
                        }
                        if (probability > bestProbability) {
                            bestIndex = k;
                            bestProbability = probability;
                        }
                    }
                    probabilities[i][j] = bestProbability;
                    best[i][j] = bestIndex;
                }
            }
            let bestProbability = Number.NEGATIVE_INFINITY;
            let bestIndex = -1;
            for (let i = 0; i < fsmParses[fsmParses.length - 1].size(); i++) {
                if (probabilities[fsmParses.length - 1][i] > bestProbability) {
                    bestProbability = probabilities[fsmParses.length - 1][i];
                    bestIndex = i;
                }
            }
            if (bestIndex == -1) {
                return undefined;
            }
            correctFsmParses.push(fsmParses[fsmParses.length - 1].getFsmParse(bestIndex));
            for (let i = fsmParses.length - 2; i >= 0; i--) {
                bestIndex = best[i + 1][bestIndex];
                if (bestIndex == -1) {
                    return null;
                }
                correctFsmParses.splice(0, 0, fsmParses[i].getFsmParse(bestIndex));
            }
            return correctFsmParses;
        }
        /**
         * The train method gets sentences from given {@link DisambiguationCorpus} and both word and the next word of that sentence at each iteration.
         * Then, adds these words together with their part of speech tags to word unigram and bigram models. It also adds the last inflectional group of
         * word to the ig unigram and bigram models.
         * <p>
         * At the end, it calculates the NGram probabilities of both word and ig unigram models by using LaplaceSmoothing, and
         * both word and ig bigram models by using InterpolatedSmoothing.
         *
         * @param corpus {@link DisambiguationCorpus} to train.
         */
        train(corpus) {
            this.wordUniGramModel = new NGram_1.NGram(1);
            this.igUniGramModel = new NGram_1.NGram(1);
            this.wordBiGramModel = new NGram_1.NGram(2);
            this.igBiGramModel = new NGram_1.NGram(2);
            for (let i = 0; i < corpus.sentenceCount(); i++) {
                let sentence = corpus.getSentence(i);
                for (let j = 0; j < sentence.wordCount() - 1; j++) {
                    let word = sentence.getWord(j);
                    let nextWord = sentence.getWord(j + 1);
                    let words1 = new Array();
                    let words2 = new Array();
                    words2.push(word.getParse().getWordWithPos().getName());
                    words1.push(words2[0]);
                    words2.push(nextWord.getParse().getWordWithPos().getName());
                    this.wordUniGramModel.addNGram(words1);
                    this.wordBiGramModel.addNGram(words2);
                    for (let k = 0; k < nextWord.getParse().size(); k++) {
                        let igs1 = new Array();
                        let igs2 = new Array();
                        igs2.push(word.getParse().lastInflectionalGroup().toString());
                        igs2.push(nextWord.getParse().getInflectionalGroup(k).toString());
                        this.igBiGramModel.addNGram(igs2);
                        igs1.push(igs2[1]);
                        this.igUniGramModel.addNGram(igs1);
                    }
                }
            }
            this.wordUniGramModel.calculateNGramProbabilitiesSimple(new LaplaceSmoothing_1.LaplaceSmoothing());
            this.igUniGramModel.calculateNGramProbabilitiesSimple(new LaplaceSmoothing_1.LaplaceSmoothing());
            this.wordBiGramModel.calculateNGramProbabilitiesSimple(new LaplaceSmoothing_1.LaplaceSmoothing());
            this.igBiGramModel.calculateNGramProbabilitiesSimple(new LaplaceSmoothing_1.LaplaceSmoothing());
        }
    }
    exports.HmmDisambiguation = HmmDisambiguation;
});
//# sourceMappingURL=HmmDisambiguation.js.map