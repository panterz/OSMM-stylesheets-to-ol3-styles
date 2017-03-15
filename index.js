import * as fs from 'fs';
import program from 'commander';
import xml2json from 'xml2json';

class Convertor {
    constructor (args){
        const path = "OSMM-Topography-Layer-stylesheets/Schema version " + args.schemaVersion +
                    "/Stylesheets/Geoserver stylesheets (SLD)/";
        const slds = {
            7: {
                "topographicarea-backdrop": "OSMM Topo - Topographic Area.sld",
                "topographicline-backdrop": "OSMM Topo - Topographic Lines.sld",
                "topographicarea-standard": "OSMM Topo - Topographic Area.sld",
                "topographicline-standard": "OSMM Topo - Topographic Lines.sld"
            },
            9: {
                "topographicarea-backdrop": "topographicarea-backdrop.sld.sld",
                "topographicline-backdrop": "topographicline-backdrop.sld.sld",
                "topographicarea-standard": "topographicarea-standard.sld.sld",
                "topographicline-standard": "topographicline-standard.sld.sld"
            }

        };

        this.sld = path + slds[args.schemaVersion][args.style];
        this.name = args.style + "_"  + args.schemaVersion;
    }

    convert() {
        let xml = fs.readFileSync(this.sld, 'utf8');
        let styles = [];

        // xml to json
        let json = xml2json.toJson(xml, {
            object: true
            //arrayNotation: true
        });

        let stylesFromSld = json.StyledLayerDescriptor.NamedLayer.UserStyle.FeatureTypeStyle;


        for(let i = 0; i<stylesFromSld.length; i++ ) {

            let rule = stylesFromSld[i].Rule;
            let style = {};

            Object.keys(rule).forEach((attribute) => {
                switch(attribute) {
                    case "Name":
                        style.name = rule.Name;
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

        fs.writeFile('export/'+this.name+'.json', JSON.stringify(styles, null, 4));
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
        let factor = 10;

        Object.keys(strokeStyleObj).forEach((styleType) => {
            strokeStyleObj[styleType].forEach((style) => {
                switch(style.name){
                    case "stroke":
                        strokeStyle.colour = this._hexToRgb(style["$t"]);
                        break;
                    case "stroke-width":
                        strokeStyle.width = this._roundNumber(parseFloat(style["$t"]) * factor, 2);
                        break;
                    case "stroke-dasharray":
                        let lineDash = [];

                        style["$t"].split(" ").forEach((element) => {
                            lineDash.push(this._roundNumber(parseFloat(element) * factor, 2));
                        })
                        strokeStyle.lineDash = lineDash;
                        break;
                }
            });
        });
        return strokeStyle;
    }

    _roundNumber(n, places) {
        return +(Math.round(n + "e+"+places)  + "e-"+places);
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

                //filter.operator = operator;
                filter.value = value;
                filter.attribute = attribute;
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
        .option('-s, --style [type]', 'Define the sld to be transformed')
        .option('-v, --schemaVersion [type]', '[7, 9] the version of the schema for SLDs')
        .parse(process.argv);

    let convertor = new Convertor(program);
    convertor.convert();
}
