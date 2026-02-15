"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LongestRootFirstDisambiguation = void 0;
const MorphologicalDisambiguator_1 = require("./MorphologicalDisambiguator");
const fs = __importStar(require("fs"));
const AutoDisambiguator_1 = require("./AutoDisambiguator");
class LongestRootFirstDisambiguation extends MorphologicalDisambiguator_1.MorphologicalDisambiguator {
    rootList = new Map();
    /**
     * Constructor for the longest root first disambiguation algorithm. The method reads a list of (surface form, most
     * frequent root word for that surface form) pairs from a given file.
     * @param fileName File that contains list of (surface form, most frequent root word for that surface form) pairs.
     */
    constructor(fileName) {
        super();
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
//# sourceMappingURL=LongestRootFirstDisambiguation.js.map