import * as fs from 'fs';
import program from 'commander';
import xml2json from 'xml2json';

class Convertor {
    constructor (args){
        this.args = args;
    }

    convert() {
        const sld = "OSMM-Topography-Layer-stylesheets/Schema version 9/Stylesheets/Geoserver stylesheets (SLD)/topographicline-standard.sld.sld";

        let xml = fs.readFileSync(sld, 'utf8');
        let styles = [];

        // xml to json
        let json = xml2json.toJson(xml, {
            object: true
            //arrayNotation: true
        });

        console.log(json.StyledLayerDescriptor.NamedLayer.UserStyle)
        let stylesFromSld = json.StyledLayerDescriptor.NamedLayer.UserStyle.FeatureTypeStyle;

        console.log(stylesFromSld.length)

        for(let i = 0; i<stylesFromSld.length; i++ ) {

            let rule = stylesFromSld[i].Rule;
            let style = {};

            Object.keys(rule).forEach((attribute) => {
                switch(attribute) {
                    case "Name":
                        style.name = rule.Name;
                        console.log(rule.Name)
                        break;
                    case "ogc:Filter":
                        style.filter = this._ogcFilterToObject(rule[attribute]);
                        break;
                    case "LineSymbolizer":
                        style.style = this._getStyleFromSLD(rule[attribute]);
                }
            });

            styles.push(style);
        }

        console.log(JSON.stringify(styles));
    }

    _getStyleFromSLD(styleObj) {
        let style = {};

        Object.keys(styleObj).forEach((styleType) => {
            switch(styleType) {
                case "Stroke":
                    style.stroke = this._getStrokeStyle(styleObj[styleType]);
            }
        });

        return style;
    }

    _getStrokeStyle(strokeStyleObj) {
        let strokeStyle = {};

        Object.keys(strokeStyleObj).forEach((styleType) => {
            strokeStyleObj[styleType].forEach((style) => {
                switch(style.name){
                    case "stroke":
                        strokeStyle.colour = this._hexToRgb(style["$t"]);
                        break;
                    case "stroke-width":
                        strokeStyle.width = parseFloat(style["$t"]) * 10;
                        break;
                    case "stroke-dasharray":
                        let lineDash = [];

                        style["$t"].split(" ").forEach((element) => {
                            lineDash.push(parseFloat(element) * 10);
                        })
                        strokeStyle.lineDash = lineDash;
                        break;
                }
            });
        });
        return strokeStyle;
    }

    _ogcFilterToObject(ogcFilter) {
        let filter = {};
        const propertyName = "ogc:PropertyName";
        const propertyLiteral = "ogc:Literal";

        let keys = Object.keys(ogcFilter);

        keys.forEach((key) => {
            let operator = this._getComparisonOperator(key);

            if(operator) {
                let attribute = ogcFilter[key][propertyName];
                let value = parseInt(ogcFilter[key][propertyLiteral]);

                filter.operator = operator;
                filter[attribute] = value;
            }
        });

        return filter;
    }

    _getComparisonOperator(ogcFilterOperator) {
        let operator;

        switch(ogcFilterOperator) {
            case "ogc:PropertyIsEqualTo":
                operator = "isEqualTo";
            break;
            case "ogc:PropertyIsNotEqualTo":
                operator = "isEqualTo";
            break;
            case "ogc:PropertyIsLessThan":
                operator = "isLessThan";
            break;
            case "ogc:PropertyIsLessThanOrEqualTo":
                operator = "isLessThanOrEqualTo";
            break;
            case "ogc:PropertyIsGreaterThan":
                operator = "isGreaterThan";
            break;
            case "ogc:PropertyIsGreaterThanOrEqualTo":
                operator = "isGreaterThanOrEqualTo";
            break;
            default:
                break;
        }

        return operator;
    }

    _hexToRgb(hex) {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => {
            return r + r + g + g + b + b;
        });

        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16),
            1
        ] : null;
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
