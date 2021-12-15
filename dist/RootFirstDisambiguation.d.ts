import { NaiveDisambiguation } from "./NaiveDisambiguation";
import { FsmParseList } from "nlptoolkit-morphologicalanalysis/dist/MorphologicalAnalysis/FsmParseList";
import { FsmParse } from "nlptoolkit-morphologicalanalysis/dist/MorphologicalAnalysis/FsmParse";
import { DisambiguationCorpus } from "nlptoolkit-morphologicalanalysis/dist/Corpus/DisambiguationCorpus";
import { NGram } from "nlptoolkit-ngram/dist/NGram";
import { Word } from "nlptoolkit-dictionary/dist/Dictionary/Word";
export declare class RootFirstDisambiguation extends NaiveDisambiguation {
    protected wordBiGramModel: NGram<string>;
    protected igBiGramModel: NGram<string>;
    /**
     * The disambiguate method gets an array of fsmParses. Then loops through that parses and finds the most probable root
     * word and removes the other words which are identical to the most probable root word. At the end, gets the most probable parse
     * among the fsmParses and adds it to the correctFsmParses {@link Array}.
     *
     * @param fsmParses {@link FsmParseList} to disambiguate.
     * @return correctFsmParses {@link Array} which holds the most probable parses.
     */
    disambiguate(fsmParses: Array<FsmParseList>): Array<FsmParse>;
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
    train(corpus: DisambiguationCorpus): void;
    /**
     * The getWordProbability method returns the probability of a word by using word bigram or unigram model.
     *
     * @param word             Word to find the probability.
     * @param correctFsmParses FsmParse of given word which will be used for getting part of speech tags.
     * @param index            Index of FsmParse of which part of speech tag will be used to get the probability.
     * @return The probability of the given word.
     */
    protected getWordProbability(word: Word, correctFsmParses: Array<FsmParse>, index: number): number;
    /**
     * The getIgProbability method returns the probability of a word by using ig bigram or unigram model.
     *
     * @param word             Word to find the probability.
     * @param correctFsmParses FsmParse of given word which will be used for getting transition list.
     * @param index            Index of FsmParse of which transition list will be used to get the probability.
     * @return The probability of the given word.
     */
    protected getIgProbability(word: Word, correctFsmParses: Array<FsmParse>, index: number): number;
    /**
     * The getBestRootWord method takes a {@link FsmParseList} as an input and loops through the list. It gets each word with its
     * part of speech tags as a new {@link Word} word and its transition list as a {@link Word} ig. Then, finds their corresponding
     * probabilities. At the end returns the word with the highest probability.
     *
     * @param fsmParseList {@link FsmParseList} is used to get the part of speech tags and transition lists of words.
     * @return The word with the highest probability.
     */
    protected getBestRootWord(fsmParseList: FsmParseList): Word;
    /**
     * The getParseWithBestIgProbability gets each {@link FsmParse}'s transition list as a {@link Word} ig. Then, finds the corresponding
     * probabilitt. At the end returns the parse with the highest ig probability.
     *
     * @param parseList        {@link FsmParseList} is used to get the {@link FsmParse}.
     * @param correctFsmParses FsmParse is used to get the transition lists.
     * @param index            Index of FsmParse of which transition list will be used to get the probability.
     * @return The parse with the highest probability.
     */
    protected getParseWithBestIgProbability(parseList: FsmParseList, correctFsmParses: Array<FsmParse>, index: number): FsmParse;
}
