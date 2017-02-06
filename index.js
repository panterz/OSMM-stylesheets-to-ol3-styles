import * as fs from 'fs';
import program from 'commander';

class Convertor {
    constructor (args){
        this.args = args;
    }

    convert() {

    }
}

export default Convertor;

if (require.main === module){

    program
        .version('0.0.1')
        .option('-p, --path [type]', 'Define the path of the input file/directory')
        .option('-o, --output [type]', 'Define the paht of the output file/directory, not needed when input is directory')
        .option('-c, --conversion [type]', 'Define the conversion [html2json, json2html]')
        .parse(process.argv);

    let convertor = new Convertor(program);
    convertor.convert();
}
