import {
    FsmMorphologicalAnalyzer
} from "nlptoolkit-morphologicalanalysis/dist/MorphologicalAnalysis/FsmMorphologicalAnalyzer";
import {FsmParse} from "nlptoolkit-morphologicalanalysis/dist/MorphologicalAnalysis/FsmParse";
import {MorphologicalTag} from "nlptoolkit-morphologicalanalysis/dist/MorphologicalAnalysis/MorphologicalTag";
import {FsmParseList} from "nlptoolkit-morphologicalanalysis/dist/MorphologicalAnalysis/FsmParseList";
import {CounterHashMap} from "nlptoolkit-datastructure/dist/CounterHashMap";

export abstract class AutoDisambiguator {

    protected morphologicalAnalyzer: FsmMorphologicalAnalyzer

    /**
     * Checks if there is any singular second person agreement or possessor tag before the current word at position
     * index.
     * @param index Position of the current word.
     * @param correctParses All correct morphological parses of the previous words.
     * @return True, if at least one of the morphological parses of the previous words has a singular second person
     * agreement or possessor tag, false otherwise.
     */
    private static isAnyWordSecondPerson(index: number, correctParses: Array<FsmParse>): boolean{
        let count = 0;
        for (let i = index - 1; i >= 0; i--) {
            if (correctParses[i].containsTag(MorphologicalTag.A2SG) ||
                correctParses[i].containsTag(MorphologicalTag.P2SG)) {
                count++;
            }
        }
        return count >= 1;
    }

    /**
     * Checks if there is any plural agreement or possessor tag before the current word at position index.
     * @param index Position of the current word.
     * @param correctParses All correct morphological parses of the previous words.
     * @return True, if at least one of the morphological parses of the previous words has a plural agreement or
     * possessor tag, false otherwise.
     */
    private static isPossessivePlural(index: number, correctParses: Array<FsmParse>): boolean{
        for (let i = index - 1; i >= 0; i--) {
            if (correctParses[i].isNoun()) {
                return correctParses[i].isPlural();
            }
        }
        return false;
    }

    /**
     * Given all possible parses of the next word, this method returns the most frequent pos tag.
     * @param nextParseList All possible parses of the next word.
     * @return Most frequent pos tag in all possible parses of the next word.
     */
    private static nextWordPos(nextParseList: FsmParseList): string{
        let map = new CounterHashMap<string>();
        for (let i = 0; i < nextParseList.size(); i++) {
            map.put(nextParseList.getFsmParse(i).getPos());
        }
        return map.max();
    }

    /**
     * Checks if the current word is just before the last word.
     * @param index Position of the current word.
     * @param fsmParses All morphological parses of the current sentence.
     * @return True, if the current word is just before the last word, false otherwise.
     */
    private static isBeforeLastWord(index: number, fsmParses: Array<FsmParseList>): boolean{
        return index + 2 == fsmParses.length;
    }

    /**
     * Checks if there is at least one word after the current word.
     * @param index Position of the current word.
     * @param fsmParses All morphological parses of the current sentence.
     * @return True, if there is at least one word after the current word, false otherwise.
     */
    private static nextWordExists(index: number, fsmParses: Array<FsmParseList>): boolean{
        return index + 1 < fsmParses.length;
    }

    /**
     * Checks if there is at least one word after the current word and that next word is a noun.
     * @param index Position of the current word.
     * @param fsmParses All morphological parses of the current sentence.
     * @return True, if there is at least one word after the current word and that next word is a noun, false otherwise.
     */
    private static isNextWordNoun(index: number, fsmParses: Array<FsmParseList>): boolean{
        return index + 1 < fsmParses.length && AutoDisambiguator.nextWordPos(fsmParses[index + 1]) == "NOUN";
    }

    /**
     * Checks if there is at least one word after the current word and that next word is a number.
     * @param index Position of the current word.
     * @param fsmParses All morphological parses of the current sentence.
     * @return True, if there is at least one word after the current word and that next word is a number, false
     * otherwise.
     */
    private static isNextWordNum(index: number, fsmParses: Array<FsmParseList>): boolean{
        return index + 1 < fsmParses.length && AutoDisambiguator.nextWordPos(fsmParses[index + 1]) == "NUM";
    }

    /**
     * Checks if there is at least one word after the current word and that next word is a noun or adjective.
     * @param index Position of the current word.
     * @param fsmParses All morphological parses of the current sentence.
     * @return True, if there is at least one word after the current word and that next word is a noun or adjective,
     * false otherwise.
     */
    private static isNextWordNounOrAdjective(index: number, fsmParses: Array<FsmParseList>): boolean{
        return index + 1 < fsmParses.length && (AutoDisambiguator.nextWordPos(fsmParses[index + 1]) == "NOUN" ||
            AutoDisambiguator.nextWordPos(fsmParses[index + 1]) == "ADJ" ||
            AutoDisambiguator.nextWordPos(fsmParses[index + 1]) == "DET");
    }

    /**
     * Checks if the current word is the first word of the sentence or not.
     * @param index Position of the current word.
     * @return True, if the current word is the first word of the sentence, false otherwise.
     */
    private static isFirstWord(index: number): boolean{
        return index == 0
    }

    /**
     * Checks if there are at least two occurrences of 'ne', 'ya' or 'gerek' in the sentence.
     * @param fsmParses All morphological parses of the current sentence.
     * @param word 'ne', 'ya' or 'gerek'
     * @return True, if there are at least two occurrences of 'ne', 'ya' or 'gerek' in the sentence, false otherwise.
     */
    private static containsTwoNeOrYa(fsmParses: Array<FsmParseList>, word: string): boolean{
        let count = 0;
        for (let fsmPars of fsmParses) {
            let surfaceForm = fsmPars.getFsmParse(0).getSurfaceForm();
            if (surfaceForm == word) {
                count++;
            }
        }
        return count == 2;
    }

    /**
     * Checks if there is at least one word before the given word and its pos tag is the given pos tag.
     * @param index Position of the current word.
     * @param correctParses All correct morphological parses of the previous words.
     * @param tag Pos tag of the previous word
     * @return True, if there is at least one word before the given word and its pos tag is the given pos tag, false
     * otherwise.
     */
    private static hasPreviousWordTag(index: number, correctParses: Array<FsmParse>, tag: MorphologicalTag): boolean{
        return index > 0 && correctParses[index - 1].containsTag(tag);
    }

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
    private static selectCaseForParseString(parseString: string, index: number, fsmParses: Array<FsmParseList>,
                                            correctParses: Array<FsmParse>): string{
        let surfaceForm = fsmParses[index].getFsmParse(0).getSurfaceForm();
        let root = fsmParses[index].getFsmParse(0).getWord().getName();
        let lastWord = fsmParses[fsmParses.length - 1].getFsmParse(0).getSurfaceForm();
        switch (parseString) {
            /* kısmını, duracağını, grubunun */
            case "P2SG$P3SG":
                if (AutoDisambiguator.isAnyWordSecondPerson(index, correctParses)) {
                    return "P2SG";
                }
                return "P3SG";
            case "A2SG+P2SG$A3SG+P3SG":
                if (AutoDisambiguator.isAnyWordSecondPerson(index, correctParses)) {
                    return "A2SG+P2SG";
                }
                return "A3SG+P3SG";
            /* BİR */
            case "ADJ$ADV$DET$NUM+CARD":
                return "DET";
            /* tahminleri, işleri, hisseleri */
            case "A3PL+P3PL+NOM$A3PL+P3SG+NOM$A3PL+PNON+ACC$A3SG+P3PL+NOM":
                if (AutoDisambiguator.isPossessivePlural(index, correctParses)) {
                    return "A3SG+P3PL+NOM";
                }
                return "A3PL+P3SG+NOM";
            /* Ocak, Cuma, ABD */
            case "A3SG$PROP+A3SG":
                if (index > 0) {
                    return "PROP+A3SG";
                }
                break;
            /* şirketin, seçimlerin, borsacıların, kitapların */
            case "P2SG+NOM$PNON+GEN":
                if (AutoDisambiguator.isAnyWordSecondPerson(index, correctParses)) {
                    return "P2SG+NOM";
                }
                return "PNON+GEN";
            /* ÇOK */
            case "ADJ$ADV$DET$POSTP+PCABL":
            /* FAZLA */
            case "ADJ$ADV$POSTP+PCABL":
                if (AutoDisambiguator.hasPreviousWordTag(index, correctParses, MorphologicalTag.ABLATIVE)) {
                    return "POSTP+PCABL";
                }
                if (index + 1 < fsmParses.length) {
                    switch (AutoDisambiguator.nextWordPos(fsmParses[index + 1])) {
                        case "NOUN":
                            return "ADJ";
                        case "ADJ":
                        case "ADV":
                        case "VERB":
                            return "ADV";
                        default:
                            break;
                    }
                }
                break;
            case "ADJ$NOUN+A3SG+PNON+NOM":
                if (AutoDisambiguator.isNextWordNounOrAdjective(index, fsmParses)) {
                    return "ADJ";
                }
                return "NOUN+A3SG+PNON+NOM";
            /* fanatiklerini, senetlerini, olduklarını */
            case "A3PL+P2SG$A3PL+P3PL$A3PL+P3SG$A3SG+P3PL":
                if (AutoDisambiguator.isAnyWordSecondPerson(index, correctParses)) {
                    return "A3PL+P2SG";
                }
                if (AutoDisambiguator.isPossessivePlural(index, correctParses)) {
                    return "A3SG+P3PL";
                } else {
                    return "A3PL+P3SG";
                }
            case "ADJ$NOUN+PROP+A3SG+PNON+NOM":
                if (index > 0) {
                    return "NOUN+PROP+A3SG+PNON+NOM";
                }
                break;
            /* BU, ŞU */
            case "DET$PRON+DEMONSP+A3SG+PNON+NOM":
                if (AutoDisambiguator.isNextWordNoun(index, fsmParses)) {
                    return "DET";
                }
                return "PRON+DEMONSP+A3SG+PNON+NOM";
            /* gelebilir */
            case "AOR+A3SG$AOR^DB+ADJ+ZERO":
                if (AutoDisambiguator.isBeforeLastWord(index, fsmParses)) {
                    return "AOR+A3SG";
                } else if (AutoDisambiguator.isFirstWord(index)) {
                    return "AOR^DB+ADJ+ZERO";
                } else {
                    if (AutoDisambiguator.isNextWordNounOrAdjective(index, fsmParses)) {
                        return "AOR^DB+ADJ+ZERO";
                    } else {
                        return "AOR+A3SG";
                    }
                }
            case "ADV$NOUN+A3SG+PNON+NOM":
                return "ADV";
            case "ADJ$ADV":
                if (AutoDisambiguator.isNextWordNoun(index, fsmParses)) {
                    return "ADJ";
                }
                return "ADV";
            case "P2SG$PNON":
                if (AutoDisambiguator.isAnyWordSecondPerson(index, correctParses)) {
                    return "P2SG";
                }
                return "PNON";
            /* etti, kırdı */
            case "NOUN+A3SG+PNON+NOM^DB+VERB+ZERO$VERB+POS":
                if (AutoDisambiguator.isBeforeLastWord(index, fsmParses)) {
                    return "VERB+POS";
                }
                break;
            /* İLE */
            case "CONJ$POSTP+PCNOM":
                return "POSTP+PCNOM";
            /* gelecek */
            case "POS+FUT+A3SG$POS^DB+ADJ+FUTPART+PNON":
                if (AutoDisambiguator.isBeforeLastWord(index, fsmParses)) {
                    return "POS+FUT+A3SG";
                }
                return "POS^DB+ADJ+FUTPART+PNON";
            case "ADJ^DB$NOUN+A3SG+PNON+NOM^DB":
                if (root == "yok" || root == "düşük" || root == "eksik" || root == "rahat" || root == "orta" || root == "vasat") {
                    return "ADJ^DB";
                }
                return "NOUN+A3SG+PNON+NOM^DB";
            /* yaptık, şüphelendik */
            case "POS+PAST+A1PL$POS^DB+ADJ+PASTPART+PNON$POS^DB+NOUN+PASTPART+A3SG+PNON+NOM":
                return "POS+PAST+A1PL";
            /* ederim, yaparım */
            case "AOR+A1SG$AOR^DB+ADJ+ZERO^DB+NOUN+ZERO+A3SG+P1SG+NOM":
                return "AOR+A1SG";
            /* geçti, vardı, aldı */
            case "ADJ^DB+VERB+ZERO$VERB+POS":
                if (root == "var" && !AutoDisambiguator.isPossessivePlural(index, correctParses)) {
                    return "ADJ^DB+VERB+ZERO";
                }
                return "VERB+POS";
            /* ancak */
            case "ADV$CONJ":
                return "CONJ";
            /* yaptığı, ettiği */
            case "ADJ+PASTPART+P3SG$NOUN+PASTPART+A3SG+P3SG+NOM":
                if (AutoDisambiguator.isNextWordNounOrAdjective(index, fsmParses)) {
                    return "ADJ+PASTPART+P3SG";
                }
                return "NOUN+PASTPART+A3SG+P3SG+NOM";
            /* ÖNCE, SONRA */
            case "ADV$NOUN+A3SG+PNON+NOM$POSTP+PCABL":
                if (AutoDisambiguator.hasPreviousWordTag(index, correctParses, MorphologicalTag.ABLATIVE)) {
                    return "POSTP+PCABL";
                }
                return "ADV";
            case "NARR+A3SG$NARR^DB+ADJ+ZERO":
                if (AutoDisambiguator.isBeforeLastWord(index, fsmParses)) {
                    return "NARR+A3SG";
                }
                return "NARR^DB+ADJ+ZERO";
            case "ADJ$NOUN+A3SG+PNON+NOM$NOUN+PROP+A3SG+PNON+NOM":
                if (index > 0) {
                    return "NOUN+PROP+A3SG+PNON+NOM";
                } else {
                    if (AutoDisambiguator.isNextWordNounOrAdjective(index, fsmParses)) {
                        return "ADJ";
                    }
                    return "NOUN+A3SG+PNON+NOM";
                }
            /* ödediğim */
            case "ADJ+PASTPART+P1SG$NOUN+PASTPART+A3SG+P1SG+NOM":
                if (AutoDisambiguator.isNextWordNounOrAdjective(index, fsmParses)) {
                    return "ADJ+PASTPART+P1SG";
                }
                return "NOUN+PASTPART+A3SG+P1SG+NOM";
            /* O */
            case "DET$PRON+DEMONSP+A3SG+PNON+NOM$PRON+PERS+A3SG+PNON+NOM":
                if (AutoDisambiguator.isNextWordNoun(index, fsmParses)) {
                    return "DET";
                }
                return "PRON+PERS+A3SG+PNON+NOM";
            /* BAZI */
            case "ADJ$DET$PRON+QUANTP+A3SG+P3SG+NOM":
                return "DET";
            /* ONUN, ONA, ONDAN, ONUNLA, OYDU, ONUNKİ */
            case "DEMONSP$PERS":
                return "PERS";
            case "ADJ$NOUN+A3SG+PNON+NOM$VERB+POS+IMP+A2SG":
                if (AutoDisambiguator.isNextWordNounOrAdjective(index, fsmParses)) {
                    return "ADJ";
                }
                return "NOUN+A3SG+PNON+NOM";
            /* hazineler, kıymetler */
            case "A3PL+PNON+NOM$A3SG+PNON+NOM^DB+VERB+ZERO+PRES+A3PL$PROP+A3PL+PNON+NOM":
                if (index > 0) {
                    if (fsmParses[index].getFsmParse(0).isCapitalWord()) {
                        return "PROP+A3PL+PNON+NOM";
                    }
                    return "A3PL+PNON+NOM";
                }
                break;
            /* ARTIK, GERİ */
            case "ADJ$ADV$NOUN+A3SG+PNON+NOM":
                if (root == "artık") {
                    return "ADV";
                } else if (AutoDisambiguator.isNextWordNoun(index, fsmParses)) {
                    return "ADJ";
                }
                return "ADV";
            case "P1SG+NOM$PNON+NOM^DB+VERB+ZERO+PRES+A1SG":
                if (AutoDisambiguator.isBeforeLastWord(index, fsmParses) || root == "değil") {
                    return "PNON+NOM^DB+VERB+ZERO+PRES+A1SG";
                }
                return "P1SG+NOM";
            /* görülmektedir */
            case "POS+PROG2$POS^DB+NOUN+INF+A3SG+PNON+LOC^DB+VERB+ZERO+PRES":
                return "POS+PROG2";
            /* NE */
            case "ADJ$ADV$CONJ$PRON+QUESP+A3SG+PNON+NOM":
                if (lastWord == "?") {
                    return "PRON+QUESP+A3SG+PNON+NOM";
                }
                if (AutoDisambiguator.containsTwoNeOrYa(fsmParses, "ne")) {
                    return "CONJ";
                }
                if (AutoDisambiguator.isNextWordNoun(index, fsmParses)) {
                    return "ADJ";
                }
                return "ADV";
            /* TÜM */
            case "DET$NOUN+A3SG+PNON+NOM":
                return "DET";
            /* AZ */
            case "ADJ$ADV$POSTP+PCABL$VERB+POS+IMP+A2SG":
                if (AutoDisambiguator.hasPreviousWordTag(index, correctParses, MorphologicalTag.ABLATIVE)) {
                    return "POSTP+PCABL";
                }
                if (AutoDisambiguator.isNextWordNounOrAdjective(index, fsmParses)) {
                    return "ADJ";
                }
                return "ADV";
            /* görülmedik */
            case "NEG+PAST+A1PL$NEG^DB+ADJ+PASTPART+PNON$NEG^DB+NOUN+PASTPART+A3SG+PNON+NOM":
                if (surfaceForm == "alışılmadık") {
                    return "NEG^DB+ADJ+PASTPART+PNON";
                }
                return "NEG+PAST+A1PL";
            case "DATE$NUM+FRACTION":
                return "NUM+FRACTION";
            /* giriş, satış, öpüş, vuruş */
            case "POS^DB+NOUN+INF3+A3SG+PNON+NOM$RECIP+POS+IMP+A2SG":
                return "POS^DB+NOUN+INF3+A3SG+PNON+NOM";
            /* başka, yukarı */
            case "ADJ$POSTP+PCABL":
                if (AutoDisambiguator.hasPreviousWordTag(index, correctParses, MorphologicalTag.ABLATIVE)) {
                    return "POSTP+PCABL";
                }
                return "ADJ";
            /* KARŞI */
            case "ADJ$ADV$NOUN+A3SG+PNON+NOM$POSTP+PCDAT":
                if (AutoDisambiguator.hasPreviousWordTag(index, correctParses, MorphologicalTag.DATIVE)) {
                    return "POSTP+PCDAT";
                }
                if (AutoDisambiguator.isNextWordNoun(index, fsmParses)) {
                    return "ADJ";
                }
                return "ADV";
            /* BEN */
            case "NOUN+A3SG$NOUN+PROP+A3SG$PRON+PERS+A1SG":
                return "PRON+PERS+A1SG";
            /* yapıcı, verici */
            case "ADJ+AGT$NOUN+AGT+A3SG+PNON+NOM":
                if (AutoDisambiguator.isNextWordNounOrAdjective(index, fsmParses)) {
                    return "ADJ+AGT";
                }
                return "NOUN+AGT+A3SG+PNON+NOM";
            /* BİLE */
            case "ADV$VERB+POS+IMP+A2SG":
                return "ADV";
            /* ortalamalar, uzaylılar, demokratlar */
            case "NOUN+ZERO+A3PL+PNON+NOM$VERB+ZERO+PRES+A3PL":
                return "NOUN+ZERO+A3PL+PNON+NOM";
            /* yasa, diye, yıla */
            case "NOUN+A3SG+PNON+DAT$VERB+POS+OPT+A3SG":
                return "NOUN+A3SG+PNON+DAT";
            /* BİZ, BİZE */
            case "NOUN+A3SG$PRON+PERS+A1PL":
                return "PRON+PERS+A1PL";
            /* AZDI */
            case "ADJ^DB+VERB+ZERO$POSTP+PCABL^DB+VERB+ZERO$VERB+POS":
                return "ADJ^DB+VERB+ZERO";
            /* BİRİNCİ, İKİNCİ, ÜÇÜNCÜ, DÖRDÜNCÜ, BEŞİNCİ */
            case "ADJ$NUM+ORD":
                return "ADJ";
            /* AY */
            case "INTERJ$NOUN+A3SG+PNON+NOM$VERB+POS+IMP+A2SG":
                return "NOUN+A3SG+PNON+NOM";
            /* konuşmam, savunmam, etmem */
            case "NEG+AOR+A1SG$POS^DB+NOUN+INF2+A3SG+P1SG+NOM":
                return "NEG+AOR+A1SG";
            /* YA */
            case "CONJ$INTERJ":
                if (AutoDisambiguator.containsTwoNeOrYa(fsmParses, "ya")) {
                    return "CONJ";
                }
                if (AutoDisambiguator.nextWordExists(index, fsmParses) && fsmParses[index + 1].getFsmParse(0).getSurfaceForm() == "da") {
                    return "CONJ";
                }
                return "INTERJ";
            case "A3PL+P3PL$A3PL+P3SG$A3SG+P3PL":
                if (AutoDisambiguator.isPossessivePlural(index, correctParses)) {
                    return "A3SG+P3PL";
                }
                return "A3PL+P3SG";
            /* YÜZDE, YÜZLÜ */
            case "NOUN$NUM+CARD^DB+NOUN+ZERO":
                return "NOUN";
            /* almanlar, uzmanlar, elmaslar, katiller */
            case "ADJ^DB+VERB+ZERO+PRES+A3PL$NOUN+A3PL+PNON+NOM$NOUN+A3SG+PNON+NOM^DB+VERB+ZERO+PRES+A3PL":
                return "NOUN+A3PL+PNON+NOM";
            /* fazlası, yetkilisi */
            case "ADJ+JUSTLIKE$NOUN+ZERO+A3SG+P3SG+NOM":
                return "NOUN+ZERO+A3SG+P3SG+NOM";
            /* HERKES, HERKESTEN, HERKESLE, HERKES */
            case "NOUN+A3SG+PNON$PRON+QUANTP+A3PL+P3PL":
                return "PRON+QUANTP+A3PL+P3PL";
            /* BEN, BENDEN, BENCE, BANA, BENDE */
            case "NOUN+A3SG$PRON+PERS+A1SG":
                return "PRON+PERS+A1SG";
            /* karşısından, geriye, geride */
            case "ADJ^DB+NOUN+ZERO$NOUN":
                return "ADJ^DB+NOUN+ZERO";
            /* gideceği, kalacağı */
            case "ADJ+FUTPART+P3SG$NOUN+FUTPART+A3SG+P3SG+NOM":
                if (AutoDisambiguator.isNextWordNounOrAdjective(index, fsmParses)) {
                    return "ADJ+FUTPART+P3SG";
                }
                return "NOUN+FUTPART+A3SG+P3SG+NOM";
            /* bildiğimiz, geçtiğimiz, yaşadığımız */
            case "ADJ+PASTPART+P1PL$NOUN+PASTPART+A3SG+P1PL+NOM":
                return "ADJ+PASTPART+P1PL";
            /* eminim, memnunum, açım */
            case "NOUN+ZERO+A3SG+P1SG+NOM$VERB+ZERO+PRES+A1SG":
                return "VERB+ZERO+PRES+A1SG";
            /* yaparlar, olabilirler, değiştirirler */
            case "AOR+A3PL$AOR^DB+ADJ+ZERO^DB+NOUN+ZERO+A3PL+PNON+NOM":
                return "AOR+A3PL";
            /* san, yasa */
            case "NOUN+A3SG+PNON+NOM$NOUN+PROP+A3SG+PNON+NOM$VERB+POS+IMP+A2SG":
                if (index > 0) {
                    return "NOUN+PROP+A3SG+PNON+NOM";
                }
                break;
            /* etmeyecek, yapmayacak, koşmayacak */
            case "NEG+FUT+A3SG$NEG^DB+ADJ+FUTPART+PNON":
                return "NEG+FUT+A3SG";
            /* etmeli, olmalı */
            case "POS+NECES+A3SG$POS^DB+NOUN+INF2+A3SG+PNON+NOM^DB+ADJ+WITH":
                if (AutoDisambiguator.isBeforeLastWord(index, fsmParses)) {
                    return "POS+NECES+A3SG";
                }
                if (AutoDisambiguator.isNextWordNounOrAdjective(index, fsmParses)) {
                    return "POS^DB+NOUN+INF2+A3SG+PNON+NOM^DB+ADJ+WITH";
                }
                return "POS+NECES+A3SG";
            /* DE */
            case "CONJ$NOUN+PROP+A3SG+PNON+NOM$VERB+POS+IMP+A2SG":
                if (index > 0) {
                    return "NOUN+PROP+A3SG+PNON+NOM";
                }
                break;
            /* GEÇ, SIK */
            case "ADJ$ADV$VERB+POS+IMP+A2SG":
                if (surfaceForm == "sık") {
                    let previousWord = "";
                    let nextWord = "";
                    if (index - 1 > -1) {
                        previousWord = fsmParses[index - 1].getFsmParse(0).getSurfaceForm();
                    }
                    if (index + 1 < fsmParses.length) {
                        nextWord = fsmParses[index + 1].getFsmParse(0).getSurfaceForm();
                    }
                    if (previousWord == "sık" || nextWord == "sık") {
                        return "ADV";
                    }
                }
                if (AutoDisambiguator.isNextWordNoun(index, fsmParses)) {
                    return "ADJ";
                }
                return "ADV";
            /* BİRLİKTE */
            case "ADV$POSTP+PCINS":
                if (AutoDisambiguator.hasPreviousWordTag(index, correctParses, MorphologicalTag.INSTRUMENTAL)) {
                    return "POSTP+PCINS";
                }
                return "ADV";
            /* yavaşça, dürüstçe, fazlaca */
            case "ADJ+ASIF$ADV+LY$NOUN+ZERO+A3SG+PNON+EQU":
                return "ADV+LY";
            /* FAZLADIR, FAZLAYDI, ÇOKTU, ÇOKTUR */
            case "ADJ^DB$POSTP+PCABL^DB":
                if (AutoDisambiguator.hasPreviousWordTag(index, correctParses, MorphologicalTag.ABLATIVE)) {
                    return "POSTP+PCABL^DB";
                }
                return "ADJ^DB";
            /* kaybettikleri, umdukları, gösterdikleri */
            case "ADJ+PASTPART+P3PL$NOUN+PASTPART+A3PL+P3PL+NOM$NOUN+PASTPART+A3PL+P3SG+NOM$NOUN+PASTPART+A3SG+P3PL+NOM":
                if (AutoDisambiguator.isNextWordNounOrAdjective(index, fsmParses)) {
                    return "ADJ+PASTPART+P3PL";
                }
                if (AutoDisambiguator.isPossessivePlural(index, correctParses)) {
                    return "NOUN+PASTPART+A3SG+P3PL+NOM";
                }
                return "NOUN+PASTPART+A3PL+P3SG+NOM";
            /* yılın, yolun */
            case "NOUN+A3SG+P2SG+NOM$NOUN+A3SG+PNON+GEN$VERB+POS+IMP+A2PL$VERB^DB+VERB+PASS+POS+IMP+A2SG":
                if (AutoDisambiguator.isAnyWordSecondPerson(index, correctParses)) {
                    return "NOUN+A3SG+P2SG+NOM";
                }
                return "NOUN+A3SG+PNON+GEN";
            /* sürmekte, beklenmekte, değişmekte */
            case "POS+PROG2+A3SG$POS^DB+NOUN+INF+A3SG+PNON+LOC":
                return "POS+PROG2+A3SG";
            /* KİMSE, KİMSEDE, KİMSEYE */
            case "NOUN+A3SG+PNON$PRON+QUANTP+A3SG+P3SG":
                return "PRON+QUANTP+A3SG+P3SG";
            /* DOĞRU */
            case "ADJ$NOUN+A3SG+PNON+NOM$POSTP+PCDAT":
                if (AutoDisambiguator.hasPreviousWordTag(index, correctParses, MorphologicalTag.DATIVE)) {
                    return "POSTP+PCDAT";
                }
                return "ADJ";
            /* ikisini, ikisine, fazlasına */
            case "ADJ+JUSTLIKE^DB+NOUN+ZERO+A3SG+P2SG$NOUN+ZERO+A3SG+P3SG":
                return "NOUN+ZERO+A3SG+P3SG";
            /* kişilerdir, aylardır, yıllardır */
            case "A3PL+PNON+NOM^DB+ADV+SINCE$A3PL+PNON+NOM^DB+VERB+ZERO+PRES+COP+A3SG$A3SG+PNON+NOM^DB+VERB+ZERO+PRES+A3PL+COP":
                if (root == "yıl" || root == "süre" || root == "zaman" || root == "ay") {
                    return "A3PL+PNON+NOM^DB+ADV+SINCE";
                } else {
                    return "A3PL+PNON+NOM^DB+VERB+ZERO+PRES+COP+A3SG";
                }
            /* HEP */
            case "ADV$PRON+QUANTP+A3SG+P3SG+NOM":
                return "ADV";
            /* O */
            case "DET$NOUN+PROP+A3SG+PNON+NOM$PRON+DEMONSP+A3SG+PNON+NOM$PRON+PERS+A3SG+PNON+NOM":
                if (AutoDisambiguator.isNextWordNoun(index, fsmParses)){
                    return "DET";
                } else {
                    return "PRON+PERS+A3SG+PNON+NOM";
                }
            /* yapmalıyız, etmeliyiz, alınmalıdır */
            case "POS+NECES$POS^DB+NOUN+INF2+A3SG+PNON+NOM^DB+ADJ+WITH^DB+VERB+ZERO+PRES":
                return "POS+NECES";
            /* kızdı, çekti, bozdu */
            case "ADJ^DB+VERB+ZERO$NOUN+A3SG+PNON+NOM^DB+VERB+ZERO$VERB+POS":
                return "VERB+POS";
            /* BİZİMLE */
            case "NOUN+A3SG+P1SG$PRON+PERS+A1PL+PNON":
                return "PRON+PERS+A1PL+PNON";
            /* VARDIR */
            case "ADJ^DB+VERB+ZERO+PRES+COP+A3SG$VERB^DB+VERB+CAUS+POS+IMP+A2SG":
                return "ADJ^DB+VERB+ZERO+PRES+COP+A3SG";
            /* Mİ */
            case "NOUN+A3SG+PNON+NOM$QUES+PRES+A3SG":
                return "QUES+PRES+A3SG";
            /* BENİM */
            case "NOUN+A3SG+P1SG+NOM$NOUN+A3SG+PNON+NOM^DB+VERB+ZERO+PRES+A1SG$PRON+PERS+A1SG+PNON+GEN$PRON+PERS+A1SG+PNON+NOM^DB+VERB+ZERO+PRES+A1SG":
                return "PRON+PERS+A1SG+PNON+GEN";
            /* SUN */
            case "NOUN+PROP+A3SG+PNON+NOM$VERB+POS+IMP+A2SG":
                return "NOUN+PROP+A3SG+PNON+NOM";
            case "ADJ+JUSTLIKE$NOUN+ZERO+A3SG+P3SG+NOM$NOUN+ZERO^DB+ADJ+ALMOST":
                return "NOUN+ZERO+A3SG+P3SG+NOM";
            /* düşündük, ettik, kazandık */
            case "NOUN+A3SG+PNON+NOM^DB+VERB+ZERO+PAST+A1PL$VERB+POS+PAST+A1PL$VERB+POS^DB+ADJ+PASTPART+PNON$VERB+POS^DB+NOUN+PASTPART+A3SG+PNON+NOM":
                return "VERB+POS+PAST+A1PL";
            /* komiktir, eksiktir, mevcuttur, yoktur */
            case "ADJ^DB+VERB+ZERO+PRES+COP+A3SG$NOUN+A3SG+PNON+NOM^DB+ADV+SINCE$NOUN+A3SG+PNON+NOM^DB+VERB+ZERO+PRES+COP+A3SG":
                return "ADJ^DB+VERB+ZERO+PRES+COP+A3SG";
            /* edeceğim, ekeceğim, koşacağım, gideceğim, savaşacağım, olacağım  */
            case "POS+FUT+A1SG$POS^DB+ADJ+FUTPART+P1SG$POS^DB+NOUN+FUTPART+A3SG+P1SG+NOM":
                return "POS+FUT+A1SG";
            /* A */
            case "ADJ$INTERJ$NOUN+PROP+A3SG+PNON+NOM":
                return "NOUN+PROP+A3SG+PNON+NOM";
            /* BİZİ */
            case "NOUN+A3SG+P3SG+NOM$NOUN+A3SG+PNON+ACC$PRON+PERS+A1PL+PNON+ACC":
                return "PRON+PERS+A1PL+PNON+ACC";
            /* BİZİM */
            case "NOUN+A3SG+P1SG+NOM$NOUN+A3SG+PNON+NOM^DB+VERB+ZERO+PRES+A1SG$PRON+PERS+A1PL+PNON+GEN$PRON+PERS+A1PL+PNON+NOM^DB+VERB+ZERO+PRES+A1SG":
                return "PRON+PERS+A1PL+PNON+GEN";
            /* erkekler, kadınlar, madenler, uzmanlar*/
            case "ADJ^DB+VERB+ZERO+PRES+A3PL$NOUN+A3PL+PNON+NOM$NOUN+A3SG+PNON+NOM^DB+VERB+ZERO+PRES+A3PL$NOUN+PROP+A3PL+PNON+NOM":
                return "NOUN+A3PL+PNON+NOM";
            /* TABİ */
            case "ADJ$INTERJ":
                return "ADJ";
            case "AOR+A2PL$AOR^DB+ADJ+ZERO^DB+ADJ+JUSTLIKE^DB+NOUN+ZERO+A3SG+P2PL+NOM":
                return "AOR+A2PL";
            /* ayın, düşünün*/
            case "NOUN+A3SG+P2SG+NOM$NOUN+A3SG+PNON+GEN$VERB+POS+IMP+A2PL":
                if (AutoDisambiguator.isBeforeLastWord(index, fsmParses)){
                    return "VERB+POS+IMP+A2PL";
                }
                return "NOUN+A3SG+PNON+GEN";
            /* ödeyecekler, olacaklar */
            case "POS+FUT+A3PL$POS^DB+NOUN+FUTPART+A3PL+PNON+NOM":
                return "POS+FUT+A3PL";
            /* 9:30'daki */
            case "P3SG$PNON":
                return "PNON";
            /* olabilecek, yapabilecek */
            case "ABLE+FUT+A3SG$ABLE^DB+ADJ+FUTPART+PNON":
                if (AutoDisambiguator.isNextWordNounOrAdjective(index, fsmParses)){
                    return "ABLE^DB+ADJ+FUTPART+PNON";
                }
                return "ABLE+FUT+A3SG";
            /* düşmüş duymuş artmış */
            case "NOUN+A3SG+PNON+NOM^DB+VERB+ZERO+NARR+A3SG$VERB+POS+NARR+A3SG$VERB+POS+NARR^DB+ADJ+ZERO":
                if (AutoDisambiguator.isBeforeLastWord(index, fsmParses)){
                    return "VERB+POS+NARR+A3SG";
                }
                return "VERB+POS+NARR^DB+ADJ+ZERO";
            /* BERİ, DIŞARI, AŞAĞI */
            case "ADJ$ADV$NOUN+A3SG+PNON+NOM$POSTP+PCABL":
                if (AutoDisambiguator.hasPreviousWordTag(index, correctParses, MorphologicalTag.ABLATIVE)) {
                    return "POSTP+PCABL";
                }
                return "ADV";
            /* TV, CD */
            case "A3SG+PNON+ACC$PROP+A3SG+PNON+NOM":
                return "A3SG+PNON+ACC";
            /* değinmeyeceğim, vermeyeceğim */
            case "NEG+FUT+A1SG$NEG^DB+ADJ+FUTPART+P1SG$NEG^DB+NOUN+FUTPART+A3SG+P1SG+NOM":
                return "NEG+FUT+A1SG";
            /* görünüşe, satışa, duruşa */
            case "POS^DB+NOUN+INF3+A3SG+PNON+DAT$RECIP+POS+OPT+A3SG":
                return "POS^DB+NOUN+INF3+A3SG+PNON+DAT";
            /* YILDIR, AYDIR, YOLDUR */
            case "NOUN+A3SG+PNON+NOM^DB+ADV+SINCE$NOUN+A3SG+PNON+NOM^DB+VERB+ZERO+PRES+COP+A3SG$VERB^DB+VERB+CAUS+POS+IMP+A2SG":
                if (root == "yıl" || root == "ay") {
                    return "NOUN+A3SG+PNON+NOM^DB+ADV+SINCE";
                } else {
                    return "NOUN+A3SG+PNON+NOM^DB+VERB+ZERO+PRES+COP+A3SG";
                }
            /* BENİ */
            case "NOUN+A3SG+P3SG+NOM$NOUN+A3SG+PNON+ACC$PRON+PERS+A1SG+PNON+ACC":
                return "PRON+PERS+A1SG+PNON+ACC";
            /* edemezsin, kanıtlarsın, yapamazsın */
            case "AOR+A2SG$AOR^DB+ADJ+ZERO^DB+ADJ+JUSTLIKE^DB+NOUN+ZERO+A3SG+P2SG+NOM":
                return "AOR+A2SG";
            /* BÜYÜME, ATAMA, KARIMA, KORUMA, TANIMA, ÜREME */
            case "NOUN+A3SG+P1SG+DAT$VERB+NEG+IMP+A2SG$VERB+POS^DB+NOUN+INF2+A3SG+PNON+NOM":
                if (root == "karı"){
                    return "NOUN+A3SG+P1SG+DAT";
                }
                return "VERB+POS^DB+NOUN+INF2+A3SG+PNON+NOM";
            /* HANGİ */
            case "ADJ$PRON+QUESP+A3SG+PNON+NOM":
                if (lastWord == "?") {
                    return "PRON+QUESP+A3SG+PNON+NOM";
                }
                return "ADJ";
            /* GÜCÜNÜ, GÜCÜNÜN, ESASINDA */
            case "ADJ^DB+NOUN+ZERO+A3SG+P2SG$ADJ^DB+NOUN+ZERO+A3SG+P3SG$NOUN+A3SG+P2SG$NOUN+A3SG+P3SG":
                return "NOUN+A3SG+P3SG";
            /* YILININ, YOLUNUN, DİLİNİN */
            case "NOUN+A3SG+P2SG+GEN$NOUN+A3SG+P3SG+GEN$VERB^DB+VERB+PASS+POS+IMP+A2PL":
                return "NOUN+A3SG+P3SG+GEN";
            /* ÇIKARDI */
            case "VERB+POS+AOR$VERB^DB+VERB+CAUS+POS":
                return "VERB+POS+AOR";
            /* sunucularımız, rakiplerimiz, yayınlarımız */
            case "P1PL+NOM$P1SG+NOM^DB+VERB+ZERO+PRES+A1PL":
                return "P1PL+NOM";
            /* etmiştir, artmıştır, düşünmüştür, alınmıştır */
            case "NOUN+A3SG+PNON+NOM^DB+VERB+ZERO+NARR+A3SG+COP$VERB+POS+NARR+COP+A3SG":
                return "VERB+POS+NARR+COP+A3SG";
            /* hazırlandı, yuvarlandı, temizlendi */
            case "VERB+REFLEX$VERB^DB+VERB+PASS":
                return "VERB^DB+VERB+PASS";
            /* KARA, ÇEK, SOL, KOCA */
            case "ADJ$NOUN+A3SG+PNON+NOM$NOUN+PROP+A3SG+PNON+NOM$VERB+POS+IMP+A2SG":
                if (index > 0) {
                    if (fsmParses[index].getFsmParse(0).isCapitalWord()) {
                        return "NOUN+PROP+A3SG+PNON+NOM";
                    }
                    return "ADJ";
                }
                break;
            /* YÜZ */
            case "NOUN+A3SG+PNON+NOM$NUM+CARD$VERB+POS+IMP+A2SG":
                if (AutoDisambiguator.isNextWordNum(index, fsmParses)){
                    return "NUM+CARD";
                }
                return "NOUN+A3SG+PNON+NOM";
            case "ADJ+AGT^DB+ADJ+JUSTLIKE$NOUN+AGT+A3SG+P3SG+NOM$NOUN+AGT^DB+ADJ+ALMOST":
                return "NOUN+AGT+A3SG+P3SG+NOM";
            /* artışın, düşüşün, yükselişin*/
            case "POS^DB+NOUN+INF3+A3SG+P2SG+NOM$POS^DB+NOUN+INF3+A3SG+PNON+GEN$RECIP+POS+IMP+A2PL":
                if (AutoDisambiguator.isAnyWordSecondPerson(index, correctParses)){
                    return "POS^DB+NOUN+INF3+A3SG+P2SG+NOM";
                }
                return "POS^DB+NOUN+INF3+A3SG+PNON+GEN";
            /* VARSA */
            case "ADJ^DB+VERB+ZERO+COND$VERB+POS+DESR":
                return "ADJ^DB+VERB+ZERO+COND";
            /* DEK */
            case "NOUN+A3SG+PNON+NOM$POSTP+PCDAT":
                return "POSTP+PCDAT";
            /* ALDIK */
            case "ADJ^DB+VERB+ZERO+PAST+A1PL$VERB+POS+PAST+A1PL$VERB+POS^DB+ADJ+PASTPART+PNON$VERB+POS^DB+NOUN+PASTPART+A3SG+PNON+NOM":
                return "VERB+POS+PAST+A1PL";
            /* BİRİNİN, BİRİNE, BİRİNİ, BİRİNDEN */
            case "ADJ^DB+NOUN+ZERO+A3SG+P2SG$ADJ^DB+NOUN+ZERO+A3SG+P3SG$NUM+CARD^DB+NOUN+ZERO+A3SG+P2SG$NUM+CARD^DB+NOUN+ZERO+A3SG+P3SG":
                return "NUM+CARD^DB+NOUN+ZERO+A3SG+P3SG";
            /* ARTIK */
            case "ADJ$ADV$NOUN+A3SG+PNON+NOM$NOUN+PROP+A3SG+PNON+NOM":
                return "ADV";
            /* BİRİ */
            case "ADJ^DB+NOUN+ZERO+A3SG+P3SG+NOM$ADJ^DB+NOUN+ZERO+A3SG+PNON+ACC$NUM+CARD^DB+NOUN+ZERO+A3SG+P3SG+NOM$NUM+CARD^DB+NOUN+ZERO+A3SG+PNON+ACC":
                return "NUM+CARD^DB+NOUN+ZERO+A3SG+P3SG+NOM";
            /* DOĞRU */
            case "ADJ$NOUN+A3SG+PNON+NOM$NOUN+PROP+A3SG+PNON+NOM$POSTP+PCDAT":
                if (AutoDisambiguator.hasPreviousWordTag(index, correctParses, MorphologicalTag.DATIVE)) {
                    return "POSTP+PCDAT";
                }
                return "ADJ";
            /* demiryolları, havayolları, milletvekilleri */
            case "P3PL+NOM$P3SG+NOM$PNON+ACC":
                if (AutoDisambiguator.isPossessivePlural(index, correctParses)){
                    return "P3PL+NOM";
                }
                return "P3SG+NOM";
            /* GEREK */
            case "CONJ$NOUN+A3SG+PNON+NOM$VERB+POS+IMP+A2SG":
                if (AutoDisambiguator.containsTwoNeOrYa(fsmParses, "gerek")){
                    return "CONJ";
                }
                return "NOUN+A3SG+PNON+NOM";
            /* bilmediğiniz, sevdiğiniz, kazandığınız */
            case "ADJ+PASTPART+P2PL$NOUN+PASTPART+A3SG+P2PL+NOM$NOUN+PASTPART+A3SG+PNON+GEN^DB+VERB+ZERO+PRES+A1PL":
                if (AutoDisambiguator.isNextWordNounOrAdjective(index, fsmParses)){
                    return "ADJ+PASTPART+P2PL";
                }
                return "NOUN+PASTPART+A3SG+P2PL+NOM";
            /* yapabilecekleri, edebilecekleri, sunabilecekleri */
            case "ADJ+FUTPART+P3PL$NOUN+FUTPART+A3PL+P3PL+NOM$NOUN+FUTPART+A3PL+P3SG+NOM$NOUN+FUTPART+A3PL+PNON+ACC$NOUN+FUTPART+A3SG+P3PL+NOM":
                if (AutoDisambiguator.isNextWordNounOrAdjective(index, fsmParses)){
                    return "ADJ+FUTPART+P3PL";
                }
                if (AutoDisambiguator.isPossessivePlural(index, correctParses)){
                    return "NOUN+FUTPART+A3SG+P3PL+NOM";
                }
                return "NOUN+FUTPART+A3PL+P3SG+NOM";
            /* KİM */
            case "NOUN+PROP$PRON+QUESP":
                if (lastWord == "?") {
                    return "PRON+QUESP";
                }
                return "NOUN+PROP";
            /* ALINDI */
            case "ADJ^DB+NOUN+ZERO+A3SG+P2SG+NOM^DB+VERB+ZERO$ADJ^DB+NOUN+ZERO+A3SG+PNON+GEN^DB+VERB+ZERO$VERB^DB+VERB+PASS+POS":
                return "VERB^DB+VERB+PASS+POS";
            /* KIZIM */
            case "ADJ^DB+VERB+ZERO+PRES+A1SG$NOUN+A3SG+P1SG+NOM$NOUN+A3SG+PNON+NOM^DB+VERB+ZERO+PRES+A1SG":
                return "NOUN+A3SG+P1SG+NOM";
            /* etmeliydi, yaratmalıydı */
            case "POS+NECES$POS^DB+NOUN+INF2+A3SG+PNON+NOM^DB+ADJ+WITH^DB+VERB+ZERO":
                return "POS+NECES";
            /* HERKESİN */
            case "NOUN+A3SG+P2SG+NOM$NOUN+A3SG+PNON+GEN$PRON+QUANTP+A3PL+P3PL+GEN":
                return "PRON+QUANTP+A3PL+P3PL+GEN";
            case "ADJ+JUSTLIKE^DB+NOUN+ZERO+A3SG+P2SG$ADJ+JUSTLIKE^DB+NOUN+ZERO+A3SG+PNON$NOUN+ZERO+A3SG+P3SG":
                return "NOUN+ZERO+A3SG+P3SG";
            /* milyarlık, milyonluk, beşlik, ikilik */
            case "NESS+A3SG+PNON+NOM$ZERO+A3SG+PNON+NOM^DB+ADJ+FITFOR":
                return "ZERO+A3SG+PNON+NOM^DB+ADJ+FITFOR";
            /* alınmamaktadır, koymamaktadır */
            case "NEG+PROG2$NEG^DB+NOUN+INF+A3SG+PNON+LOC^DB+VERB+ZERO+PRES":
                return "NEG+PROG2";
            /* HEPİMİZ */
            case "A1PL+P1PL+NOM$A3SG+P3SG+GEN^DB+VERB+ZERO+PRES+A1PL":
                return "A1PL+P1PL+NOM";
            /* KİMSENİN */
            case "NOUN+A3SG+P2SG$NOUN+A3SG+PNON$PRON+QUANTP+A3SG+P3SG":
                return "PRON+QUANTP+A3SG+P3SG";
            /* GEÇMİŞ, ALMIŞ, VARMIŞ */
            case "ADJ^DB+VERB+ZERO+NARR+A3SG$VERB+POS+NARR+A3SG$VERB+POS+NARR^DB+ADJ+ZERO":
                if (AutoDisambiguator.isNextWordNounOrAdjective(index, fsmParses)){
                    return "VERB+POS+NARR^DB+ADJ+ZERO";
                }
                return "VERB+POS+NARR+A3SG";
            /* yapacağınız, konuşabileceğiniz, olacağınız */
            case "ADJ+FUTPART+P2PL$NOUN+FUTPART+A3SG+P2PL+NOM$NOUN+FUTPART+A3SG+PNON+GEN^DB+VERB+ZERO+PRES+A1PL":
                if (AutoDisambiguator.isNextWordNounOrAdjective(index, fsmParses)){
                    return "ADJ+FUTPART+P2PL";
                }
                return "NOUN+FUTPART+A3SG+P2PL+NOM";
            /* YILINA, DİLİNE, YOLUNA */
            case "NOUN+A3SG+P2SG+DAT$NOUN+A3SG+P3SG+DAT$VERB^DB+VERB+PASS+POS+OPT+A3SG":
                if (AutoDisambiguator.isAnyWordSecondPerson(index, correctParses)){
                    return "NOUN+A3SG+P2SG+DAT";
                }
                return "NOUN+A3SG+P3SG+DAT";
            /* MİSİN, MİYDİ, MİSİNİZ */
            case "NOUN+A3SG+PNON+NOM^DB+VERB+ZERO$QUES":
                return "QUES";
            /* ATAKLAR, GÜÇLER, ESASLAR */
            case "ADJ^DB+NOUN+ZERO+A3PL+PNON+NOM$ADJ^DB+VERB+ZERO+PRES+A3PL$NOUN+A3PL+PNON+NOM$NOUN+A3SG+PNON+NOM^DB+VERB+ZERO+PRES+A3PL":
                return "NOUN+A3PL+PNON+NOM";
            case "A3PL+P3SG$A3SG+P3PL$PROP+A3PL+P3PL":
                return "PROP+A3PL+P3PL";
            /* pilotunuz, suçunuz, haberiniz */
            case "P2PL+NOM$PNON+GEN^DB+VERB+ZERO+PRES+A1PL":
                return "P2PL+NOM";
            /* yıllarca, aylarca, düşmanca */
            case "ADJ+ASIF$ADV+LY":
                if (AutoDisambiguator.isNextWordNounOrAdjective(index, fsmParses)){
                    return "ADJ+ASIF";
                }
                return "ADV+LY";
            /* gerçekçi, alıcı */
            case "ADJ^DB+NOUN+AGT+A3SG+PNON+NOM$NOUN+A3SG+PNON+NOM^DB+ADJ+AGT":
                if (AutoDisambiguator.isNextWordNounOrAdjective(index, fsmParses)){
                    return "NOUN+A3SG+PNON+NOM^DB+ADJ+AGT";
                }
                return "ADJ^DB+NOUN+AGT+A3SG+PNON+NOM";
            /* havayollarına, gözyaşlarına */
            case "P2SG$P3PL$P3SG":
                if (AutoDisambiguator.isAnyWordSecondPerson(index, correctParses)){
                    return "P2SG";
                }
                if (AutoDisambiguator.isPossessivePlural(index, correctParses)){
                    return "P3PL";
                }
                return "P3SG";
            /* olun, kurtulun, gelin */
            case "VERB+POS+IMP+A2PL$VERB^DB+VERB+PASS+POS+IMP+A2SG":
                return "VERB+POS+IMP+A2PL";
            case "ADJ+JUSTLIKE^DB$NOUN+ZERO+A3SG+P3SG+NOM^DB":
                return "NOUN+ZERO+A3SG+P3SG+NOM^DB";
            /* oluşmaktaydı, gerekemekteydi */
            case "POS+PROG2$POS^DB+NOUN+INF+A3SG+PNON+LOC^DB+VERB+ZERO":
                return "POS+PROG2";
            /* BERABER */
            case "ADJ$ADV$POSTP+PCINS":
                if (AutoDisambiguator.hasPreviousWordTag(index, correctParses, MorphologicalTag.INSTRUMENTAL)) {
                    return "POSTP+PCINS";
                }
                if (AutoDisambiguator.isNextWordNounOrAdjective(index, fsmParses)){
                    return "ADJ";
                }
                return "ADV";
            /* BİN, KIRK */
            case "NUM+CARD$VERB+POS+IMP+A2SG":
                return "NUM+CARD";
            /* ÖTE */
            case "NOUN+A3SG+PNON+NOM$POSTP+PCABL":
                if (AutoDisambiguator.hasPreviousWordTag(index, correctParses, MorphologicalTag.ABLATIVE)) {
                    return "POSTP+PCABL";
                }
                return "NOUN+A3SG+PNON+NOM";
            /* BENİMLE */
            case "NOUN+A3SG+P1SG$PRON+PERS+A1SG+PNON":
                return "PRON+PERS+A1SG+PNON";
            /* Accusative and Ablative Cases*/
            case "ADV+WITHOUTHAVINGDONESO$NOUN+INF2+A3SG+PNON+ABL":
                return "ADV+WITHOUTHAVINGDONESO";
            case "ADJ^DB+NOUN+ZERO+A3SG+P3SG+NOM$ADJ^DB+NOUN+ZERO+A3SG+PNON+ACC$NOUN+A3SG+P3SG+NOM$NOUN+A3SG+PNON+ACC":
                return "ADJ^DB+NOUN+ZERO+A3SG+P3SG+NOM";
            case "P3SG+NOM$PNON+ACC":
                if (fsmParses[index].getFsmParse(0).getFinalPos() == "PROP") {
                    return "PNON+ACC";
                } else {
                    return "P3SG+NOM";
                }
            case "A3PL+PNON+NOM$A3SG+PNON+NOM^DB+VERB+ZERO+PRES+A3PL":
                return "A3PL+PNON+NOM";
            case "ADV+SINCE$VERB+ZERO+PRES+COP+A3SG":
                if (root == "yıl" || root == "süre" || root == "zaman" || root == "ay") {
                    return "ADV+SINCE";
                } else {
                    return "VERB+ZERO+PRES+COP+A3SG";
                }
            case "CONJ$VERB+POS+IMP+A2SG":
                return "CONJ";
            case "NEG+IMP+A2SG$POS^DB+NOUN+INF2+A3SG+PNON+NOM":
                return "POS^DB+NOUN+INF2+A3SG+PNON+NOM";
            case "NEG+OPT+A3SG$POS^DB+NOUN+INF2+A3SG+PNON+DAT":
                return "POS^DB+NOUN+INF2+A3SG+PNON+DAT";
            case "NOUN+A3SG+P3SG+NOM$NOUN^DB+ADJ+ALMOST":
                return "NOUN+A3SG+P3SG+NOM";
            case "ADJ$VERB+POS+IMP+A2SG":
                return "ADJ";
            case "NOUN+A3SG+PNON+NOM$VERB+POS+IMP+A2SG":
                return "NOUN+A3SG+PNON+NOM";
            case "INF2+A3SG+P3SG+NOM$INF2^DB+ADJ+ALMOST":
                return "INF2+A3SG+P3SG+NOM";
            default:
                break;
        }
        return undefined;
    }

    /**
     * Given the position of the current word in the sentence, all morphological parses of all words in the sentence and
     * all correct morphological parses of the previous words, the algorithm determines the correct morphological parse
     * of the current word in rule based manner.
     * @param index Position of the current word.
     * @param fsmParses All morphological parses of the current sentence.
     * @param correctParses All correct morphological parses of the previous words.
     * @return Correct morphological parse of the current word.
     */
    static caseDisambiguator(index: number, fsmParses: Array<FsmParseList>, correctParses: Array<FsmParse>): FsmParse{
        let fsmParseList = fsmParses[index];
        let defaultCase = AutoDisambiguator.selectCaseForParseString(fsmParses[index].parsesWithoutPrefixAndSuffix(), index, fsmParses, correctParses);
        if (defaultCase != undefined) {
            for (let i = 0; i < fsmParseList.size(); i++) {
                let fsmParse = fsmParseList.getFsmParse(i);
                if (fsmParse.getFsmParseTransitionList().includes(defaultCase)) {
                    return fsmParse;
                }
            }
        }
        return undefined;
    }
}