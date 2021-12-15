import {MorphologicalDisambiguator} from "./MorphologicalDisambiguator";
import {FsmParseList} from "nlptoolkit-morphologicalanalysis/dist/MorphologicalAnalysis/FsmParseList";
import {FsmParse} from "nlptoolkit-morphologicalanalysis/dist/MorphologicalAnalysis/FsmParse";
import {DisambiguationCorpus} from "nlptoolkit-morphologicalanalysis/dist/Corpus/DisambiguationCorpus";

export class DummyDisambiguation extends MorphologicalDisambiguator{

    /**
     * Overridden disambiguate method takes an array of {@link FsmParseList} and loops through its items, if the current FsmParseList's
     * size is greater than 0, it adds a random parse of this list to the correctFsmParses {@link Array}.
     *
     * @param fsmParses {@link FsmParseList} to disambiguate.
     * @return correctFsmParses {@link Array}.
     */
    disambiguate(fsmParses: Array<FsmParseList>): Array<FsmParse> {
        let correctFsmParses = new Array<FsmParse>();
        for (let fsmParseList of fsmParses) {
            if (fsmParseList.size() > 0) {
                correctFsmParses.push(fsmParseList.getFsmParse(Math.floor(Math.random() * fsmParseList.size())));
            }
        }
        return correctFsmParses;
    }

    /**
     * Train method implements method in {@link MorphologicalDisambiguator}.
     *
     * @param corpus {@link DisambiguationCorpus} to train.
     */
    train(corpus: DisambiguationCorpus) {
    }

}