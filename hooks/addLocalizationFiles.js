var fs = require('fs-extra');
var _ = require('lodash');
var xmldom = require('xmldom');    
var path = require('path');


var iosProjFolder;
var iosPbxProjPath;

var getValue = function(configDoc, name) {
    var name = configDoc.getElementsByTagName(name)[0];
    return name.textContent
}


function initIosDir(){
    if (!iosProjFolder || !iosPbxProjPath) {
        var config = fs.readFileSync("config.xml").toString();
        var configDoc = (new xmldom.DOMParser()).parseFromString(config, 'application/xml');
        var name = getValue(configDoc, "name");

        iosProjFolder =  "platforms/ios/" + name;
        iosPbxProjPath = "platforms/ios/" + name + ".xcodeproj/project.pbxproj";
    }
}

function getTargetIosDir() {
    initIosDir();
    return iosProjFolder;
}

function getXcodePbxProjPath() {
    initIosDir();
    return iosPbxProjPath;
}

function copyFile(localizationFilePath, lang, fileName) {
    var lProjPath = "source/"+getTargetIosDir() + "/Resources/" + lang + ".lproj";
    if(fs.existsSync(lProjPath)){
        let out = require('child_process').spawnSync("chmod", ["777",lProjPath]);
    }
    let out = require('child_process').spawnSync("chmod", ["777",path.dirname(lProjPath)]);
    console.log(localizationFilePath);
    console.log(lProjPath);
    fs.ensureDir(lProjPath, function (err) {
        if (!err) {
            fs.copyFileSync(localizationFilePath,lProjPath,{ overwrite : true });
        }
    });
}

function writeLocalisationFieldsToXcodeProj(filePaths, groupname, proj) {
    var fileRefSection = proj.pbxFileReferenceSection();
    var fileRefValues = _.values(fileRefSection);

    if (filePaths.length > 0) {

        // var groupKey;
        var groupKey = proj.findPBXVariantGroupKey({name: groupname});
        if (!groupKey) {
            // findPBXVariantGroupKey with name InfoPlist.strings not found.  creating new group
            var localizableStringVarGroup = proj.addLocalizationVariantGroup(groupname);
            groupKey = localizableStringVarGroup.fileRef;
        }

        filePaths.forEach(function (path) {
            var results = _.find(fileRefValues, function(o){
                return  (_.isObject(o) && _.has(o, "path") && o.path.replace(/['"]+/g, '') == path)
            });
            if (_.isUndefined(results)) {
                //not found in pbxFileReference yet
                proj.addResourceFile("Resources/" + path, {variantGroup: true}, groupKey);
            }
        });
    }
}
module.exports = function(context) {
    var xcode = require('xcode');

    var localizableStringsPaths = [];

    return getTargetLang(context)
        .then(function(languages) {

            languages.forEach(function(lang){

                // check the locales to write to
                var localeLangs = [];
                localeLangs.push(lang.lang);

                _.forEach(localeLangs, function(localeLang){
                    
                    if (!_.isEmpty(lang.path)) {
                        copyFile(lang.path, localeLang, "Localizable.strings");
                        localizableStringsPaths.push(localeLang + ".lproj/" + "Localizable.strings");
                    }
                    
                });

            });

            var proj = xcode.project(getXcodePbxProjPath());

            return new Promise(function (resolve, reject) {
              proj.parse(function (error) {
                  if (error) {
                    reject(error);
                  }

                  writeLocalisationFieldsToXcodeProj(localizableStringsPaths, 'Localizable.strings', proj);

                  fs.writeFileSync(getXcodePbxProjPath(), proj.writeSync());
                  console.log('new pbx project written with localization groups');
                  
                  var platformPath   = path.join( context.opts.projectRoot, "platforms", "ios" );
                  var projectFileApi = require( path.join( platformPath, "/cordova/lib/projectFile.js" ) );
                  projectFileApi.purgeProjectFileCache( platformPath );
                  console.log(platformPath + ' purged from project cache');
                  
                  resolve();
              });
            });
        });
};

function getTargetLang(context) {
    var targetLangArr = [];

    var path = require('path');
    var glob = require('glob');

    var providedTranslationPathPattern = "platforms/ios/Pods/JumioMobileSDK/JumioMobileSDK-3.8.0/Localizations/*.lproj"
    var providedTranslationPathRegex = new RegExp("platforms/ios/Pods/JumioMobileSDK/JumioMobileSDK-3.8.0/Localizations/(.*).lproj")

    return new Promise(function (resolve, reject) {

      glob(providedTranslationPathPattern, function(error, langFiles) {
        if (error) {
          reject(error);
        }
        
        langFiles.forEach(function(langFile) {
          var matches = langFile.match(providedTranslationPathRegex);
          if (matches) {
            targetLangArr.push({
              lang: matches[1],
              path: path.join(context.opts.projectRoot, langFile)
            });
            let out = require('child_process').spawnSync("chmod", ["777",path.join(context.opts.projectRoot, langFile)]);
          }
        });
        resolve(targetLangArr);
      });
    });
}