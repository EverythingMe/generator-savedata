(function () {
    "use strict";

    var PLUGIN_ID = require("./package.json").name,
        MENU_ID = "savedata",
        MENU_LABEL = "$$$/JavaScripts/Generator/Save data to file/Menu=Save data to file";

    var _generator = null,
        _currentDocumentId = null,
        _config = null;

    /*********** INIT ***********/

    function init(generator, config) {
        _generator = generator;
        _config = config;

        console.log("initializing generator getting started tutorial with config %j", _config);

        // add menu item "Save data to file"
        _generator.addMenuItem(MENU_ID, MENU_LABEL, true, false).then(
            function () {
                console.log("Menu created", MENU_ID);
            }, function () {
                console.error("Menu creation failed", MENU_ID);
            }
        );

        // listen to menu click event
        _generator.onPhotoshopEvent("generatorMenuChanged", handleGeneratorMenuClicked);
    }

    /*********** EVENTS ***********/

    function handleGeneratorMenuClicked(event) {
        // Ignore changes to other menus
        var menu = event.generatorMenuChanged;
        if (!menu || menu.name !== MENU_ID) {
            return;
        }

        // get document data and send to save function
        _generator.getDocumentInfo().then(save,
            function (err) {
                console.error("[SaveData] Error in getDocumentInfo:", err);
            }
        ).done();
    }

    /*********** HELPERS ***********/

    // save file to file system
    function save(doc) {
        var fs = require('fs');
        var path = require('path');
        var util = require('util');

        // cunstruct path
        var parsed = path.parse(doc.file);
        parsed.base = util.format(
            '%s-comp%d-rev%d.json',
            parsed.name,
            getCurrentCompName(doc),
            doc.count
        );
        var dir = path.format(parsed);

        console.log('JSON file location: '+dir);

        // remove unnecessary data
        doc.layers = filterHiddenLayers(doc.layers);
        delete doc.comps;

        // download file
        fs.writeFile(dir, stringify(doc), function(err) {
            if(err) {
                console.log("error"+err);
            } else {
                console.log("The file was saved!");
            }
        });
    }

    // convert json to string
    function stringify(object) {
        try {
            return JSON.stringify(object, null, "    ");
        } catch (e) {
            console.error(e);
        }
        return String(object);
    }

    // return visible layers
    function filterHiddenLayers(layers) {
        var visibleLayers = [];
        layers.forEach(function (layer) {
          // when visible
          if (layer.visible) {
            // folder + recursion
            if (layer.type == 'layerSection') {
                var internalVisibleLayers = filterHiddenLayers(layer.layers);
                visibleLayers = visibleLayers.concat(internalVisibleLayers);

            // layer
            } else  {
                visibleLayers.push(layer);
            }
          }
        });
        return visibleLayers;
    }

    // extract current layer comp name
    function getCurrentCompName(doc) {
        // default to 1
        var compName = "1";

        // if comps exist
        if (doc.comps) {
            // find current
            doc.comps.forEach(function(comp) {
                if (comp.applied) {
                    compName = comp.name;
                }
            });
        }
        return compName;
    }

    exports.init = init;

}());
