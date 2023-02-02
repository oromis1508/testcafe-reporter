const args = require('./index')().getStartArgObject();
const writeReport = require('./jsonToHtml').generateReportAsHtml;
const fs = require('fs');
const toCombine = args.odd[args.odd.length - 1];
const dest = args.dest;

function parseFilesAndGenerateReport (files) {
    const json = { startTime: new Date() };

    for (const file of files) {
        const content = JSON.parse(fs.readFileSync(file).toLocaleString());

        if (content.startTime < json.startTime) 
            json.startTime = content.startTime;
        
        const testIds = json.fixtures.map(fixture => fixture.tests.map(test => test.id)).flat();
        const maxTestId = Math.max(...testIds);

        for (const fixture of content.fixtures) {
            fixture.tests.forEach(test => {
                test.id += maxTestId;
            });
            const theSameFix = json.fixtures.find(fix => fix.name === fixture.name);

            if (theSameFix) 
                theSameFix.tests.push(...fixture.tests);
            else 
                json.fixtures.push(fixture);
        }
        
    }
    writeReport(json, dest);
}

const files = [];

function getJsonsFromDir (path) {
    const subitems = fs.readdirSync(path);

    for (const item of subitems) {
        if (fs.lstatSync(item).isFile()) {
            if (item.endsWith('.json')) files.push(item);
        }
        else getJsonsFromDir(item);
    }
}

if (fs.existsSync(toCombine) && fs.lstatSync(toCombine).isDirectory()) {
    getJsonsFromDir(toCombine);
    parseFilesAndGenerateReport(files);
}
else parseFilesAndGenerateReport(toCombine.split(','));


