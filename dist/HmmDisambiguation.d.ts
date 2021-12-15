import { NaiveDisambiguation } from "./NaiveDisambiguation";
import { FsmParseList } from "nlptoolkit-morphologicalanalysis/dist/MorphologicalAnalysis/FsmParseList";
import { FsmParse } from "nlptoolkit-morphologicalanalysis/dist/MorphologicalAnalysis/FsmParse";
import { DisambiguationCorpus } from "nlptoolkit-morphologicalanalysis/dist/Corpus/DisambiguationCorpus";
import { NGram } from "nlptoolkit-ngram/dist/NGram";
export declare class HmmDisambiguation extends NaiveDisambiguation {
    protected wordBiGramModel: NGram<string>;
    protected igBiGramModel: NGram<string>;
    /**
     * The disambiguate method takes {@link FsmParseList} as an input and gets one word with its part of speech tags, then gets its probability
     * from word unigram model. It also gets ig and its probability. Then, hold the logarithmic value of  the product of these probabilities in an array.
     * Also by taking into consideration the parses of these word it recalculates the probabilities and returns these parses.
     *
     * @param fsmParses {@link FsmParseList} to disambiguate.
     * @return ArrayList of FsmParses.
     */
    disambiguate(fsmParses: Array<FsmParseList>): Array<FsmParse>;
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
    train(corpus: DisambiguationCorpus): void;
}
