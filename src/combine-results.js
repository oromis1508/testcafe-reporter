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
const keepFullLogsCount = args.keepFullCount ?? 3;

if (typeof dest === 'string') mainFile.createReportPath(path.dirname(dest));

function getFilteredTests (fileFilterBy, fixtures) {
    let filterByFixtures = [];
    
    let filter;
    const result = [];

    try {
        filterByFixtures = JSON.parse(fs.readFileSync(fileFilterBy).toLocaleString()).fixtures;
        filter = fixtures.filter(f => filterByFixtures.find(lastF => f.name === lastF.name));
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

function processFixtures (fixtures) {
    const longDataToKeepCount = typeof last === 'string' ? +keepFullLogsCount - 1 : +keepFullLogsCount;

    try {
        return fixtures.map(fixture => {
            const testGroups = {};
    
            fixture.tests.forEach(test => {
                const testName = test.name;
    
                if (!testGroups[testName]) testGroups[testName] = [];
                testGroups[testName].push(test);
            });
    
            Object.values(testGroups).forEach(tests => {
                tests.sort((a, b) => new Date(b.time) - new Date(a.time));
    
                const uniqueDates = [];

                for (let i = 0; i < tests.length; i++) {
                    const testDate = new Date(tests[i].time).toDateString();

                    if (uniqueDates.indexOf(testDate) === -1) uniqueDates.push(testDate);
                    if (uniqueDates.length === longDataToKeepCount) break;
                }
    
                tests.forEach(test => {
                    const testDate = new Date(test.time).toDateString();
    
                    if (!uniqueDates.includes(testDate)) {
                        test.screenshot = null;
                        test.steps = [];
                    }
                });
            });
    
            return fixture;
        });    
    }
    catch (err) {
        console.log(err.message);
        console.log(err.stack);

        return fixtures;
    }
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
        
        let maxTestId = testIds.reduce((max, id) => id ? Math.max(max, id) : 0, 0);
        
        for (const fixture of content.fixtures) {
            //eslint-disable-next-line no-loop-func
            fixture.tests.forEach((test) => {
                if (typeof test.id === 'undefined') test.id = maxTestId++;
                else {
                    test.id += maxTestId++;
                    maxTestId = test.id;
                }
            });
            const theSameFix = json.fixtures.find(fix => fix.name === fixture.name);

            if (theSameFix) 
                theSameFix.tests.push(...fixture.tests);
            else 
                json.fixtures.push(fixture);
        }
    }

    for (const fixture of json.fixtures) {
        fixture.tests = fixture.tests.filter(t => new Date(t.time) >= new Date().setDate(new Date().getDate() - +daysToShow));
        fixture.tests.sort((t1, t2) => new Date(t1.time) - new Date(t2.time));
    }
    
    json.fixtures = json.fixtures.filter(f => f.tests.length);
    console.log('Fixtures: ' + json.fixtures.length);
    console.log('Tests: ' + json.fixtures.reduce((acc, f) => acc + f.tests.length, 0));

    json.fixtures = processFixtures(json.fixtures);

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

                            //eslint-dlisable-next-line
                            if (fix) {
                                for (const newTst of newFix.tests) {
                                    if (!fix.tests.find(t => t.id === newTst.id)) 
                                        fix.tests.push(newTst);
                                }
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


