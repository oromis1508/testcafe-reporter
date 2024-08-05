const mainFile = require('./index')();
const args = mainFile.getStartArgObject();
const reportObj = require('./jsonToHtml');
const fs = require('fs');
const path = require('path');
const toCombine = args.odd[args.odd.length - 1];
const dest = args.dest;
const last = args.last;

if (typeof dest === 'string') mainFile.createReportPath(path.dirname(dest));


function parseFilesAndGenerateReport (files) {
    const json = { startTime: new Date("1999/01/01").toString(), fixtures: [] };

    for (const file of files) {
        const content = JSON.parse(fs.readFileSync(file).toLocaleString());

        if (new Date(content.startTime) > new Date(json.startTime)) 
            json.startTime = content.startTime;
        
        const testIds = json.fixtures.map(fixture => fixture.tests.map(test => test.id)).flat();
        const maxTestId = Math.max(0, ...testIds);
        
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

    if (typeof last === 'string') {
        const lastRunFixtures = JSON.parse(fs.readFileSync(last).toLocaleString()).fixtures;

        json.fixtures = json.fixtures.filter(f => lastRunFixtures.find(lastF => f.name == lastF.name));

        for(const f of json.fixtures) {
            f.tests = f.tests.filter(t => lastRunFixtures.find(lastF => f.name == lastF.name).tests.find(lastT => lastT.name == t.name));
        }
    }

    const resultHtml = path.resolve(reportObj.generateReportAsHtml(json, dest));

    console.log(resultHtml);
    fs.writeFileSync(resultHtml.replace(/\.html$/, '-combined.json'), JSON.stringify(json, null, 2));
}

const files = [];

function getJsonsFromDir (dir, parent) {
    dir = parent ? path.join(parent, dir) : dir;

    const subitems = fs.readdirSync(dir);

    for (const item of subitems) {
        if (fs.lstatSync(path.join(dir, item)).isFile()) {
            if (item.endsWith('.json') && !item.endsWith('-combined.json')) files.push(path.join(dir, item));
        }
        else getJsonsFromDir(item, dir);
    }
}

if (fs.existsSync(toCombine) && fs.lstatSync(toCombine).isDirectory()) {
    getJsonsFromDir(toCombine);
    parseFilesAndGenerateReport(files);
}
else parseFilesAndGenerateReport(toCombine.split(','));


