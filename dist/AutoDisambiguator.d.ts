import { FsmMorphologicalAnalyzer } from "nlptoolkit-morphologicalanalysis/dist/MorphologicalAnalysis/FsmMorphologicalAnalyzer";
import { FsmParse } from "nlptoolkit-morphologicalanalysis/dist/MorphologicalAnalysis/FsmParse";
import { FsmParseList } from "nlptoolkit-morphologicalanalysis/dist/MorphologicalAnalysis/FsmParseList";
export declare abstract class AutoDisambiguator {
    protected morphologicalAnalyzer: FsmMorphologicalAnalyzer;
    /**
     * Checks if there is any singular second person agreement or possessor tag before the current word at position
     * index.
     * @param index Position of the current word.
     * @param correctParses All correct morphological parses of the previous words.
     * @return True, if at least one of the morphological parses of the previous words has a singular second person
     * agreement or possessor tag, false otherwise.
     */
    private static isAnyWordSecondPerson;
    /**
     * Checks if there is any plural agreement or possessor tag before the current word at position index.
     * @param index Position of the current word.
     * @param correctParses All correct morphological parses of the previous words.
     * @return True, if at least one of the morphological parses of the previous words has a plural agreement or
     * possessor tag, false otherwise.
     */
    private static isPossessivePlural;
    /**
     * Given all possible parses of the next word, this method returns the most frequent pos tag.
     * @param nextParseList All possible parses of the next word.
     * @return Most frequent pos tag in all possible parses of the next word.
     */
    private static nextWordPos;
    /**
     * Checks if the current word is just before the last word.
     * @param index Position of the current word.
     * @param fsmParses All morphological parses of the current sentence.
     * @return True, if the current word is just before the last word, false otherwise.
     */
    private static isBeforeLastWord;
    /**
     * Checks if there is at least one word after the current word.
     * @param index Position of the current word.
     * @param fsmParses All morphological parses of the current sentence.
     * @return True, if there is at least one word after the current word, false otherwise.
     */
    private static nextWordExists;
    /**
     * Checks if there is at least one word after the current word and that next word is a noun.
     * @param index Position of the current word.
     * @param fsmParses All morphological parses of the current sentence.
     * @return True, if there is at least one word after the current word and that next word is a noun, false otherwise.
     */
    private static isNextWordNoun;
    /**
     * Checks if there is at least one word after the current word and that next word is a number.
     * @param index Position of the current word.
     * @param fsmParses All morphological parses of the current sentence.
     * @return True, if there is at least one word after the current word and that next word is a number, false
     * otherwise.
     */
    private static isNextWordNum;
    /**
     * Checks if there is at least one word after the current word and that next word is a noun or adjective.
     * @param index Position of the current word.
     * @param fsmParses All morphological parses of the current sentence.
     * @return True, if there is at least one word after the current word and that next word is a noun or adjective,
     * false otherwise.
     */
    private static isNextWordNounOrAdjective;
    /**
     * Checks if the current word is the first word of the sentence or not.
     * @param index Position of the current word.
     * @return True, if the current word is the first word of the sentence, false otherwise.
     */
    private static isFirstWord;
    /**
     * Checks if there are at least two occurrences of 'ne', 'ya' or 'gerek' in the sentence.
     * @param fsmParses All morphological parses of the current sentence.
     * @param word 'ne', 'ya' or 'gerek'
     * @return True, if there are at least two occurrences of 'ne', 'ya' or 'gerek' in the sentence, false otherwise.
     */
    private static containsTwoNeOrYa;
    /**
     * Checks if there is at least one word before the given word and its pos tag is the given pos tag.
     * @param index Position of the current word.
     * @param correctParses All correct morphological parses of the previous words.
     * @param tag Pos tag of the previous word
     * @return True, if there is at least one word before the given word and its pos tag is the given pos tag, false
     * otherwise.
     */
    private static hasPreviousWordTag;
    /**
     * Given the disambiguation parse string, position of the current word in the sentence, all morphological parses of
     * all words in the sentence and all correct morphological parses of the previous words, the algorithm determines
     * the correct morphological parse of the current word in rule based manner.
     * @param parseString Disambiguation parse string. The string contains distinct subparses for the given word for a
     *                    determined root word. The subparses are separated with '$'.
     * @param index Position of the current word.
     * @param fsmParses All morphological parses of the current sentence.
     * @param correctParses All correct morphological parses of the previous words.
     * @return Correct morphological subparse of the current word.
     */
    private static selectCaseForParseString;
    /**
     * Given the position of the current word in the sentence, all morphological parses of all words in the sentence and
     * all correct morphological parses of the previous words, the algorithm determines the correct morphological parse
     * of the current word in rule based manner.
     * @param index Position of the current word.
     * @param fsmParses All morphological parses of the current sentence.
     * @param correctParses All correct morphological parses of the previous words.
     * @return Correct morphological parse of the current word.
     */
    static caseDisambiguator(index: number, fsmParses: Array<FsmParseList>, correctParses: Array<FsmParse>): FsmParse;
}
