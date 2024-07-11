(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./MorphologicalDisambiguator", "fs", "./AutoDisambiguator"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LongestRootFirstDisambiguation = void 0;
    const MorphologicalDisambiguator_1 = require("./MorphologicalDisambiguator");
    const fs = require("fs");
    const AutoDisambiguator_1 = require("./AutoDisambiguator");
    class LongestRootFirstDisambiguation extends MorphologicalDisambiguator_1.MorphologicalDisambiguator {
        /**
         * Constructor for the longest root first disambiguation algorithm. The method reads a list of (surface form, most
         * frequent root word for that surface form) pairs from a given file.
         * @param fileName File that contains list of (surface form, most frequent root word for that surface form) pairs.
         */
        constructor(fileName) {
            super();
            this.rootList = new Map();
            if (fileName == undefined) {
                fileName = "rootlist.txt";
            }
            this.readFromFile(fileName);
        }
        /**
         * Reads the list of (surface form, most frequent root word for that surface form) pairs from a given file.
         * @param fileName Input file name.
         */
        readFromFile(fileName) {
            let data = fs.readFileSync(fileName, 'utf8');
            let lines = data.split("\n");
            for (let line of lines) {
                let items = line.split(" ");
                if (items.length == 2) {
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
        disambiguate(fsmParses) {
            let correctFsmParses = new Array();
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
                if (bestRoot == undefined || !rootFound) {
                    let bestParse = fsmParseList.getParseWithLongestRootWord();
                    fsmParseList.reduceToParsesWithSameRoot(bestParse.getWord().getName());
                }
                else {
                    fsmParseList.reduceToParsesWithSameRoot(bestRoot);
                }
                let newBestParse = AutoDisambiguator_1.AutoDisambiguator.caseDisambiguator(i, fsmParses, correctFsmParses);
                let bestParse;
                if (newBestParse != null) {
                    bestParse = newBestParse;
                }
                else {
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
        train(corpus) {
        }
    }
    exports.LongestRootFirstDisambiguation = LongestRootFirstDisambiguation;
});
//# sourceMappingURL=LongestRootFirstDisambiguation.js.map