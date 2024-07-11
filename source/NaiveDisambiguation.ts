import {MorphologicalDisambiguator} from "./MorphologicalDisambiguator";
import {NGram} from "nlptoolkit-ngram/dist/NGram";

export abstract class NaiveDisambiguation extends MorphologicalDisambiguator{

    protected wordUniGramModel: NGram<string>
    protected igUniGramModel: NGram<string>

}