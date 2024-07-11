import { MorphologicalDisambiguator } from "./MorphologicalDisambiguator";
import { FsmParseList } from "nlptoolkit-morphologicalanalysis/dist/MorphologicalAnalysis/FsmParseList";
import { FsmParse } from "nlptoolkit-morphologicalanalysis/dist/MorphologicalAnalysis/FsmParse";
import { DisambiguationCorpus } from "nlptoolkit-morphologicalanalysis/dist/Corpus/DisambiguationCorpus";
export declare class LongestRootFirstDisambiguation extends MorphologicalDisambiguator {
    private rootList;
    /**
     * Constructor for the longest root first disambiguation algorithm. The method reads a list of (surface form, most
     * frequent root word for that surface form) pairs from a given file.
     * @param fileName File that contains list of (surface form, most frequent root word for that surface form) pairs.
     */
    constructor(fileName?: string);
    /**
     * Reads the list of (surface form, most frequent root word for that surface form) pairs from a given file.
     * @param fileName Input file name.
     */
    private readFromFile;
    /**
     * The disambiguate method gets an array of fsmParses. Then loops through that parses and finds the longest root
     * word. At the end, gets the parse with longest word among the fsmParses and adds it to the correctFsmParses
     * {@link Array}.
     *
     * @param fsmParses {@link FsmParseList} to disambiguate.
     * @return correctFsmParses {@link Array} which holds the parses with longest root words.
     */
    disambiguate(fsmParses: Array<FsmParseList>): Array<FsmParse>;
    /**
     * Train method implements method in {@link MorphologicalDisambiguator}.
     *
     * @param corpus {@link DisambiguationCorpus} to train.
     */
    train(corpus: DisambiguationCorpus): void;
}
