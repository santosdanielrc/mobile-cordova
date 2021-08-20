const mergeFiles = require('merge-files');
const path = require('path');
const fs = require('fs');

module.exports = function (ctx) {

    console.log("Started merging pod files to add the post_install script");
    
    var rootdir = "";
    var outputPath = path.join(ctx.opts.plugin.dir, "src", "ios", "mergedPodfile")
    var projectPodfile = path.join(rootdir, "platforms", "ios", "Podfile");

    var inputPathList = [
        projectPodfile,
        path.join(ctx.opts.plugin.dir, "src", "ios", "Podfile")
    ];

    mergeFiles(inputPathList, outputPath).then((status) => {
        if (status){
            console.log("Files merged successfully");
        } else {
            throw ("Error merging files");
        }
        
        fs.copyFile(outputPath, projectPodfile, fs.constants.COPYFILE_FICLONE, function(err){
            if (err){
                throw (err);
            }
            console.log("Ended merging pod files to add the post_install script");
        });
    });
}