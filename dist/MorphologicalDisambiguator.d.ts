import { DisambiguationCorpus } from "nlptoolkit-morphologicalanalysis/dist/Corpus/DisambiguationCorpus";
import { FsmParseList } from "nlptoolkit-morphologicalanalysis/dist/MorphologicalAnalysis/FsmParseList";
import { FsmParse } from "nlptoolkit-morphologicalanalysis/dist/MorphologicalAnalysis/FsmParse";
export declare abstract class MorphologicalDisambiguator {
    /**
     * Method to train the given {@link DisambiguationCorpus}.
     *
     * @param corpus {@link DisambiguationCorpus} to train.
     */
    abstract train(corpus: DisambiguationCorpus): void;
    /**
     * Method to disambiguate the given {@link FsmParseList}.
     *
     * @param fsmParses {@link FsmParseList} to disambiguate.
     * @return ArrayList of {@link FsmParse}.
     */
    abstract disambiguate(fsmParses: Array<FsmParseList>): Array<FsmParse>;
}
