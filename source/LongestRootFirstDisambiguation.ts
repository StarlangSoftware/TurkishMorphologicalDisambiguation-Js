import {MorphologicalDisambiguator} from "./MorphologicalDisambiguator";
import {FsmParseList} from "nlptoolkit-morphologicalanalysis/dist/MorphologicalAnalysis/FsmParseList";
import {FsmParse} from "nlptoolkit-morphologicalanalysis/dist/MorphologicalAnalysis/FsmParse";
import {DisambiguationCorpus} from "nlptoolkit-morphologicalanalysis/dist/Corpus/DisambiguationCorpus";
import * as fs from "fs";
import {AutoDisambiguator} from "./AutoDisambiguator";

export class LongestRootFirstDisambiguation extends MorphologicalDisambiguator{

    private rootList: Map<string, string> = new Map<string, string>()

    constructor(fileName?: string) {
        super();
        if (fileName == undefined){
            fileName = "rootlist.txt"
        }
        this.readFromFile(fileName)
    }

    private readFromFile(fileName: string){
        let data = fs.readFileSync(fileName, 'utf8')
        let lines = data.split("\n")
        for (let line of lines) {
            let items = line.split(" ");
            if (items.length == 2){
                this.rootList.set(items[0], items[1]);
            }
        }
    }

    /**
     * The disambiguate method gets an array of fsmParses. Then loops through that parses and finds the longest root
     * word. At the end, gets the parse with longest word among the fsmParses and adds it to the correctFsmParses
     * {@link Array}.
     *
     * @param fsmParses {@link FsmParseList} to disambiguate.
     * @return correctFsmParses {@link Array} which holds the parses with longest root words.
     */
    disambiguate(fsmParses: Array<FsmParseList>): Array<FsmParse> {
        let correctFsmParses = new Array<FsmParse>();
        let i = 0;
        for (let fsmParseList of fsmParses) {
            let surfaceForm = fsmParseList.getFsmParse(0).getSurfaceForm();
            let bestRoot = this.rootList.get(surfaceForm);
            let rootFound = false;
            for (let j = 0; j < fsmParseList.size(); j++) {
                if (fsmParseList.getFsmParse(j).getWord().getName() == bestRoot) {
                    rootFound = true;
                    break;
                }
            }
            if (bestRoot == undefined || !rootFound){
                let bestParse = fsmParseList.getParseWithLongestRootWord();
                fsmParseList.reduceToParsesWithSameRoot(bestParse.getWord().getName());
            } else {
                fsmParseList.reduceToParsesWithSameRoot(bestRoot);
            }
            let newBestParse = AutoDisambiguator.caseDisambiguator(i, fsmParses, correctFsmParses);
            let bestParse
            if (newBestParse != null){
                bestParse = newBestParse;
            } else {
                bestParse = fsmParseList.getFsmParse(0);
            }
            correctFsmParses.push(bestParse);
            i++;
        }
        return correctFsmParses;
    }

    /**
     * Train method implements method in {@link MorphologicalDisambiguator}.
     *
     * @param corpus {@link DisambiguationCorpus} to train.
     */
    train(corpus: DisambiguationCorpus): void {
    }
    
}