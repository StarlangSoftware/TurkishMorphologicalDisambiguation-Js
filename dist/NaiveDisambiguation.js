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
    exports.NaiveDisambiguation = void 0;
    const MorphologicalDisambiguator_1 = require("./MorphologicalDisambiguator");
    class NaiveDisambiguation extends MorphologicalDisambiguator_1.MorphologicalDisambiguator {
    }
    exports.NaiveDisambiguation = NaiveDisambiguation;
});
//# sourceMappingURL=NaiveDisambiguation.js.map