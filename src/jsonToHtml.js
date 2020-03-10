var stepsArray = [];
const fs = require('fs');

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

        baseStepContent: (name) => {
            return { name: name, actions: [] };
        },

        startTime: 'startTime',

        screenshotOnFail: 'screenshot',

        testUserAgents: 'userAgent',

        testDuration: 'durationMs',

        testStackTrace: 'stackTrace',

        testStatus: 'status'
    },

    singleHtmlFileName: 'report.html',

    getFormattedDate: function () {
        const curDate = new Date();
        const month = curDate.getMonth() + 1 < 10 ? `0${curDate.getMonth() + 1}` : curDate.getMonth() + 1;
        
        return `${curDate.getDate()}.${month}`;
    },

    getResultFileName: function () {       
        return `${this.getReportPath()}/report_${this.getFormattedDate()}.json`;
    },

    getReportPath: function () {        
        return `test-results/report_${this.getFormattedDate()}`;
    },

    getOriginalReportPath: function () {
        const originalReportPath = 'src/report';

        if (!fs.existsSync(originalReportPath))
            return 'node_modules/testcafe-reporter-acd-html-reporter/report';
        return originalReportPath;
    },

    getReportFilesAsHtmlTags: function (originalReportPath) {
        let result = '';

        for (const cssFile of fs.readdirSync(`${originalReportPath}/css`)) {
            const imageRegex = /url\((\..*?)\)/;

            let cssContent = fs.readFileSync(`${originalReportPath}/css/${cssFile}`).toLocaleString();
            
            for (let regexResult = imageRegex.exec(cssContent); regexResult; regexResult = imageRegex.exec(cssContent)) {
                const split = regexResult[1].split('/');
                const fileName = split[split.length - 1];
                const fileNameSplit = fileName.split('.');
                const imageExtension = fileNameSplit[fileNameSplit.length - 1];
                const bitmap = fs.readFileSync(`${originalReportPath}/img/${fileName}`);
                const base64 = new Buffer(bitmap).toString('base64');

                cssContent = cssContent.replace(regexResult[1], `data:image/${imageExtension};base64,${base64}`);
                regexResult = imageRegex.exec(cssContent);
            }
            result += `<style>${cssContent}</style>`;
        }

        for (const jsFile of fs.readdirSync(`${originalReportPath}/js`)) {
            const jsContent = fs.readFileSync(`${originalReportPath}/js/${jsFile}`).toLocaleString();

            result += `<script>${jsContent}</script>`;
        }

        return result;
    },

    generateReportAsHtml: function () {
        const json = JSON.parse(fs.readFileSync(this.getResultFileName()).toLocaleString());
        const originalReportPath = this.getOriginalReportPath();
        const html = fs.readFileSync(`${originalReportPath}/index.html`).toLocaleString();
        const htmlHead = `<head>${this.getReportFilesAsHtmlTags(originalReportPath)}</head>`;
        const generatedReport = html.replace('<div class="tests-tree"></div>', `<div class="tests-tree">${this.getJsonAsHtml(json)}</div>`)
            .replace('startTime', json.startTime)
            .replace(/<head>.*<\/head>/gs, htmlHead);

        fs.writeFileSync(`${this.getReportPath()}/${this.singleHtmlFileName}`, generatedReport);
    },
    
    generateReport: function () {
        const copydir = require('copy-dir');
        const json = JSON.parse(fs.readFileSync(this.getResultFileName()).toLocaleString());
        const newReportDir = this.getReportPath();
        const originalReportPath = this.getOriginalReportPath();
        
        copydir.sync(originalReportPath, newReportDir, { utimes: true, mode: true, cover: true });
        
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
                generatedReport += `<div class="test" status="${test.status}" onclick="testOnClick(this)">${test.name}<img class="tag" onclick="tagOnClick(this)"></div>`;
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
                `<div fixture="${stepsData.fixture}" test="${stepsData.test.replace(/"/g, '&#34;')}" screenshot="${stepsData.screenshot}" durationMs="${stepsData.durationMs}" userAgent="${stepsData.userAgent}">`);
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
