import {MorphologicalDisambiguator} from "./MorphologicalDisambiguator";
import {NGram} from "nlptoolkit-ngram/dist/NGram";
import {Word} from "nlptoolkit-dictionary/dist/Dictionary/Word";

export abstract class NaiveDisambiguation extends MorphologicalDisambiguator{

    protected wordUniGramModel: NGram<string>
    protected igUniGramModel: NGram<string>

}