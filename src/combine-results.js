const mainFile = require('./index')();
const args = mainFile.getStartArgObject();
const reportObj = require('./jsonToHtml');
const fs = require('fs');
const path = require('path');
const toCombine = args.odd[args.odd.length - 1];
const dest = args.dest;
const last = args.last;
const single = args.single;
const daysToShow = args.days ?? 14;

if (typeof dest === 'string') mainFile.createReportPath(path.dirname(dest));

function getFilteredTests (fileFilterBy, fixtures) {
    let filterByFixtures = [];
    const filter = fixtures.filter(f => filterByFixtures.find(lastF => f.name === lastF.name));
    const result = [];

    try {
        filterByFixtures = JSON.parse(fs.readFileSync(fileFilterBy).toLocaleString()).fixtures;
    }
    catch (err) {
        console.log(err.message);
        return filter;
    }

    for (const f of filter) {
        let copy = {};

        try {
        //eslint-disable-next-line no-undef
            copy = structuredClone(f);
        }
        catch (err) {
            console.log(err.message);
            return filter;
        }

        result.push(copy);
        copy.tests = copy.tests.filter(t => filterByFixtures.find(fbf => copy.name === fbf.name).tests.find(fbf => fbf.name === t.name));
    }
    
    return result;
}

function parseFilesAndGenerateReport (files) {
    const json = { startTime: new Date('1999/01/01').toString(), fixtures: [] };

    for (const file of files) {
        let content;

        try {
            content = JSON.parse(fs.readFileSync(file).toLocaleString());
        }
        catch {
            continue;
        }

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

    for (const fixture of json.fixtures) 
        fixture.tests = fixture.tests.filter(t => new Date(t.time) >= new Date().setDate(new Date().getDate() - +daysToShow));
    
    json.fixtures = json.fixtures.filter(f => f.tests.length);
    console.log('Fixtures: ' + json.fixtures.length);
    console.log('Tests: ' + json.fixtures.reduce((acc, f) => acc + f.tests.length, 0));

    if (typeof last === 'string') {
        /**
         * @type Array
         */
        let filteredFixtures;

        if (!single) {
            const dirPath = path.dirname(last);

            for (let file of fs.readdirSync(dirPath)) {
                if (file.endsWith('t.json')) {
                    file = path.resolve(dirPath, file);
                    if (!filteredFixtures || !filteredFixtures.length) filteredFixtures = getFilteredTests(file, json.fixtures); else {
                        const newFilter = getFilteredTests(file, json.fixtures);
      
                        for (const newFix of newFilter) {
                            const fix = filteredFixtures.find(f => f.name === newFix.name);

                            if (fix) {
                                for (const newTst of newFix.tests) 
                                    fix.tests.push(newTst);
                            }
                            else filteredFixtures.push(newFix);
                        }
                    }
                }
            }
            json.fixtures = filteredFixtures;
        }
        else 
            json.fixtures = getFilteredTests(last, json.fixtures);
        
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


