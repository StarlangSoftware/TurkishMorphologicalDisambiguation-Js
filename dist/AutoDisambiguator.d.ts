import { FsmMorphologicalAnalyzer } from "nlptoolkit-morphologicalanalysis/dist/MorphologicalAnalysis/FsmMorphologicalAnalyzer";
import { FsmParse } from "nlptoolkit-morphologicalanalysis/dist/MorphologicalAnalysis/FsmParse";
import { FsmParseList } from "nlptoolkit-morphologicalanalysis/dist/MorphologicalAnalysis/FsmParseList";
export declare abstract class AutoDisambiguator {
    protected morphologicalAnalyzer: FsmMorphologicalAnalyzer;
    private static isAnyWordSecondPerson;
    private static isPossessivePlural;
    private static nextWordPos;
    private static isBeforeLastWord;
    private static nextWordExists;
    private static isNextWordNoun;
    private static isNextWordNum;
    private static isNextWordNounOrAdjective;
    private static isFirstWord;
    private static containsTwoNeOrYa;
    private static hasPreviousWordTag;
    private static selectCaseForParseString;
    static caseDisambiguator(index: number, fsmParses: Array<FsmParseList>, correctParses: Array<FsmParse>): FsmParse;
}
