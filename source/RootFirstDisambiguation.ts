import {NaiveDisambiguation} from "./NaiveDisambiguation";
import {FsmParseList} from "nlptoolkit-morphologicalanalysis/dist/MorphologicalAnalysis/FsmParseList";
import {FsmParse} from "nlptoolkit-morphologicalanalysis/dist/MorphologicalAnalysis/FsmParse";
import {DisambiguationCorpus} from "nlptoolkit-morphologicalanalysis/dist/Corpus/DisambiguationCorpus";
import {NGram} from "nlptoolkit-ngram/dist/NGram";
import {DisambiguatedWord} from "nlptoolkit-morphologicalanalysis/dist/Corpus/DisambiguatedWord";
import {LaplaceSmoothing} from "nlptoolkit-ngram/dist/LaplaceSmoothing";
import {Word} from "nlptoolkit-dictionary/dist/Dictionary/Word";

export class RootFirstDisambiguation extends NaiveDisambiguation{

    protected wordBiGramModel: NGram<string>
    protected igBiGramModel: NGram<string>

    /**
     * The disambiguate method gets an array of fsmParses. Then loops through that parses and finds the most probable root
     * word and removes the other words which are identical to the most probable root word. At the end, gets the most probable parse
     * among the fsmParses and adds it to the correctFsmParses {@link Array}.
     *
     * @param fsmParses {@link FsmParseList} to disambiguate.
     * @return correctFsmParses {@link Array} which holds the most probable parses.
     */
    disambiguate(fsmParses: Array<FsmParseList>): Array<FsmParse> {
        let correctFsmParses = new Array<FsmParse>();
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
    train(corpus: DisambiguationCorpus): void {
        this.wordUniGramModel = new NGram<string>(1);
        this.wordBiGramModel = new NGram<string>(2);
        this.igUniGramModel = new NGram<string>(1);
        this.igBiGramModel = new NGram<string>(2);
        for (let i = 0; i < corpus.sentenceCount(); i++) {
            let sentence = corpus.getSentence(i);
            for (let j = 0; j < sentence.wordCount(); j++) {
                let word = <DisambiguatedWord> sentence.getWord(j);
                let words1 = new Array<string>();
                let words2 = new Array<string>();
                let igs1 = new Array<string>();
                let igs2 = new Array<string>();
                words1.push(word.getParse().getWordWithPos().getName());
                this.wordUniGramModel.addNGram(words1);
                igs1.push(word.getParse().getMorphologicalParseTransitionList());
                this.igUniGramModel.addNGram(igs1);
                if (j + 1 < sentence.wordCount()) {
                    words2.push(words1[0]);
                    words2.push((<DisambiguatedWord> sentence.getWord(j + 1)).getParse().getWordWithPos().getName());
                    this.wordBiGramModel.addNGram(words2);
                    igs2.push(igs1[0]);
                    igs2.push((<DisambiguatedWord> sentence.getWord(j + 1)).getParse().getMorphologicalParseTransitionList());
                    this.igBiGramModel.addNGram(igs2);
                }
            }
        }
        this.wordUniGramModel.calculateNGramProbabilitiesSimple(new LaplaceSmoothing<string>());
        this.igUniGramModel.calculateNGramProbabilitiesSimple(new LaplaceSmoothing<string>());
        this.wordBiGramModel.calculateNGramProbabilitiesSimple(new LaplaceSmoothing<string>());
        this.igBiGramModel.calculateNGramProbabilitiesSimple(new LaplaceSmoothing<string>());
    }

    /**
     * The getWordProbability method returns the probability of a word by using word bigram or unigram model.
     *
     * @param word             Word to find the probability.
     * @param correctFsmParses FsmParse of given word which will be used for getting part of speech tags.
     * @param index            Index of FsmParse of which part of speech tag will be used to get the probability.
     * @return The probability of the given word.
     */
    protected getWordProbability(word: Word, correctFsmParses: Array<FsmParse>, index: number): number{
        if (index != 0 && correctFsmParses.length == index) {
            return this.wordBiGramModel.getProbability(correctFsmParses[index - 1].getWordWithPos().getName(),
                word.getName());
        } else {
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
    protected getIgProbability(word: Word, correctFsmParses: Array<FsmParse>, index: number): number{
        if (index != 0 && correctFsmParses.length == index) {
            return this.igBiGramModel.getProbability(correctFsmParses[index - 1].getFsmParseTransitionList(),
                word.getName());
        } else {
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
    protected getBestRootWord(fsmParseList: FsmParseList): Word{
        let bestProbability = Number.NEGATIVE_INFINITY;
        let bestWord = undefined;
        for (let j = 0; j < fsmParseList.size(); j++) {
            let word = fsmParseList.getFsmParse(j).getWordWithPos().getName();
            let ig = fsmParseList.getFsmParse(j).getFsmParseTransitionList();
            let wordProbability = this.wordUniGramModel.getProbability(word);
            let igProbability = this.igUniGramModel.getProbability(ig);
            let probability = wordProbability * igProbability;
            if (probability > bestProbability) {
                bestWord = new Word(word);
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
    protected getParseWithBestIgProbability(parseList: FsmParseList, correctFsmParses: Array<FsmParse>,
                                            index: number): FsmParse{
        let bestParse = undefined;
        let bestProbability = Number.NEGATIVE_INFINITY;
        for (let j = 0; j < parseList.size(); j++) {
            let ig = new Word(parseList.getFsmParse(j).getFsmParseTransitionList());
            let probability = this.getIgProbability(ig, correctFsmParses, index);
            if (probability > bestProbability) {
                bestParse = parseList.getFsmParse(j);
                bestProbability = probability;
            }
        }
        return bestParse;
    }
}