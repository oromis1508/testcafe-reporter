var stepsArray = [];

// var ad = {
module.exports = {
    jsonNames: {
        baseJsonContent: '{"fixtures": []}',

        test: 'test',

        baseTestContent: (name) => {
            return { name: name, steps: [] };
        },

        fixture: 'fixture',

        baseFixtureContent: (name) => { 
            return { name: name, tests: [] };
        },

        startTime: 'startTime',

        screenshotOnFail: 'screenshot',

        testUserAgents: 'userAgent',

        testDuration: 'durationMs',

        testStackTrace: 'stackTrace',

        testStatus: 'status'
    },

    getFormattedDate: function () {
        const curDate = new Date();
        const month = curDate.getMonth() + 1 < 10 ? `0${curDate.getMonth() + 1}` : curDate.getMonth() + 1;
        
        return `${curDate.getDate()}.${month}`;
    },

    getResultFileName: function () {       
        return `test-results/report_${this.getFormattedDate()}.json`;
    },

    getReportPath: function () {        
        return `test-results/report_${this.getFormattedDate()}`;
    },

    // generateReportAsHtml: function () {
    //     const fs = require('fs');
    //     // const copydir = require('copy-dir');
    //     const json = JSON.parse(fs.readFileSync(this.getResultFileName()).toLocaleString());
    //     const newReportDir = this.getReportPath();

    //     let originalReportPath = 'src/report';

    //     if (!fs.existsSync(originalReportPath))
    //         originalReportPath = 'node_modules/testcafe-reporter-acd-html-reporter/report';
        
    //     // copydir.sync(originalReportPath, newReportDir, {
    //     //     utimes: true,

    //     //     mode: true,

    //     //     cover: true
    //     // });
        
    //     const html = fs.readFileSync(`${originalReportPath}/index.html`).toLocaleString();

    //     let htmlHead = '<head>';
    //     for(const cssFile of fs.readdirSync(`${originalReportPath}/css`)) {
    //         let cssContent = fs.readFileSync(`${originalReportPath}/css/${cssFile}`).toLocaleString();
    //         let regexResult;

    //         while(regexResult = /url\((\..*?)\)/.exec(cssContent)) {
    //             const split = regexResult[1].split('/');
    //             const fileName = split[split.length - 1];
    //             const fileNameSplit = fileName.split('.');
    //             const imageExtension = fileNameSplit[fileNameSplit.length - 1];
    //             const bitmap = fs.readFileSync(`${originalReportPath}/img/${fileName}`);
    //             const base64 = new Buffer(bitmap).toString('base64');

    //             cssContent = cssContent.replace(regexResult[1], `data:image/${imageExtension};base64,${base64}`);
    //         }
            
    //         htmlHead += cssContent;
    //         // // convert binary data to base64 encoded string
    //         // return new Buffer(bitmap).toString('base64');
        
    //     }

    //     const generatedReport = html.replace('<div class="tests-tree"></div>', `<div class="tests-tree">${this.getJsonAsHtml(json)}</div>`)
    //     .replace('startTime', json.startTime)
    //     .replace(/\<head\>.*\<\/head\>/g, htmlHead);

    //     fs.writeFileSync(`${newReportDir}/index.html`, generatedReport);
    // },

    generateReport: function () {
        const fs = require('fs');
        const copydir = require('copy-dir');
        const json = JSON.parse(fs.readFileSync(this.getResultFileName()).toLocaleString());
        const newReportDir = this.getReportPath();

        let originalReportPath = 'src/report';

        if (!fs.existsSync(originalReportPath))
            originalReportPath = 'node_modules/testcafe-reporter-acd-html-reporter/report';
        
        copydir.sync(originalReportPath, newReportDir, {
            utimes: true,

            mode: true,

            cover: true
        });
        
        const html = fs.readFileSync(`${newReportDir}/index.html`).toLocaleString();
        const generatedReport = html.replace('<div class="tests-tree"></div>', `<div class="tests-tree">${this.getJsonAsHtml(json)}</div>`).replace('startTime', json.startTime);

        fs.writeFileSync(`${newReportDir}/index.html`, generatedReport);
    },

    getJsonAsHtml: function (json) {
        let generatedReport = '';
        
        generatedReport += '<div class="fixtures">';
        json.fixtures.forEach(fixture => {
            generatedReport += `<div class="fixture"><div class="summary"></div><div class="fixtureName" onclick="onFixtureClick(this)">${fixture.name}</div>`;
            generatedReport += '<div class="tests">';
            fixture.tests.forEach(test => {
                generatedReport += `<div class="test" status="${test.status}" onclick="testOnClick(this)">${test.name}</div>`;
                stepsArray.push({
                    fixture: fixture.name,

                    test: test.name,

                    steps: this.stepsToString(test.steps),

                    screenshot: test[this.jsonNames.screenshotOnFail] ? test[this.jsonNames.screenshotOnFail] : '',

                    durationMs: test[this.jsonNames.testDuration],

                    userAgent: test[this.jsonNames.testUserAgents],

                    stackTrace: test[this.jsonNames.testStackTrace]
                });
            });
            generatedReport += '</div></div>';
        }); 
        generatedReport += '</div>';
        stepsArray.forEach(stepsData => {
            generatedReport += stepsData.steps.replace('<step>', 
                `<div fixture="${stepsData.fixture}" test="${stepsData.test}" screenshot="${stepsData.screenshot}" durationMs="${stepsData.durationMs}" userAgent="${stepsData.userAgent}">`);
            if (stepsData.stackTrace && stepsData.stackTrace.length)
                generatedReport += `<div traceFixture="${stepsData.fixture}" traceTest="${stepsData.test}">${JSON.stringify(stepsData.stackTrace)}</div>`;
        });

        return generatedReport;
    },


    stepsToString: function (steps) {
        let stepsString = '<step>';

        steps.forEach(step => {
            stepsString += '<div class="step">';
            if (step.name)
                stepsString += `<div class="stepName">${step.name}</div>`;
            step.actions.forEach(action => {
                stepsString += `<div class="subStep">${action}</div>`;
            });
            stepsString += '</div>';
        });
        return stepsString + '</div>';
    }
};

// ad.generateReport();
