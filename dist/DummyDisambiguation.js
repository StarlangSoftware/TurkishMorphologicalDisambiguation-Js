(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./MorphologicalDisambiguator"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DummyDisambiguation = void 0;
    const MorphologicalDisambiguator_1 = require("./MorphologicalDisambiguator");
    class DummyDisambiguation extends MorphologicalDisambiguator_1.MorphologicalDisambiguator {
        /**
         * Overridden disambiguate method takes an array of {@link FsmParseList} and loops through its items, if the current FsmParseList's
         * size is greater than 0, it adds a random parse of this list to the correctFsmParses {@link Array}.
         *
         * @param fsmParses {@link FsmParseList} to disambiguate.
         * @return correctFsmParses {@link Array}.
         */
        disambiguate(fsmParses) {
            let correctFsmParses = new Array();
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
        train(corpus) {
        }
    }
    exports.DummyDisambiguation = DummyDisambiguation;
});
//# sourceMappingURL=DummyDisambiguation.js.map