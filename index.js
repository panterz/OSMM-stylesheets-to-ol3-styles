import * as fs from 'fs';
import program from 'commander';
import xml2json from 'xml2json';

class Convertor {
    constructor (args){
        this.args = args;
    }

    convert() {
        const sld = "OSMM-Topography-Layer-stylesheets/Schema version 9/Stylesheets/Geoserver stylesheets (SLD)/topographicarea-standard.sld.sld";

        let xml = fs.readFileSync(sld, 'utf8');

        // xml to json
        let json = xml2json.toJson(xml, {
            object: true
            //arrayNotation: true
        });

        let styles = json.StyledLayerDescriptor.NamedLayer.UserStyle.FeatureTypeStyle;
        //console.log(styles)

        for(let i = 0; i<styles.length; i++ ) {
            let rule = styles[i].Rule;
            for(let key in rule) {
                //if(ogc:PropertyIsEqualTo === "")
                //console.log(key)
                let name = rule.Name;
                console.log(name);
            }
            //console.log(styles[i].Rule["ogc:Filter"]);
        }
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
