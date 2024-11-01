var stepsArray = [];
const fs = require('fs');

// var ad = {
module.exports = {
    jsonNames: {
        baseJsonContent: '{"fixtures": []}',

        test: 'test',

        baseTestContent: (name, id) => {
            return { id: id, name: name, steps: [] };
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

        testStatus: 'status',
        
        testTime: 'time'
    },

    get singleHtmlFileName () {
        return console.singleHtmlFileName ? console.singleHtmlFileName : 'report.html';
    },

    startTime: new Date(),

    getFormattedDate: function () {
        const month = this.startTime.getMonth() < 9 ? `0${this.startTime.getMonth() + 1}` : this.startTime.getMonth() + 1;
        
        return `${this.startTime.getFullYear()}.${this.startTime.getDate()}.${month}`;
    },

    getResultFileName: function () {       
        return console.resultFileName ? console.resultFileName : `${this.getReportPath()}/report_${this.getFormattedDate()}.json`;
    },

    get testResultsPath () {
        return console.reportPath ? console.reportPath.split(/[/\\]/g)[0] : 'test-results'; 
    },

    getReportPath: function () {
        return console.reportPath ? console.reportPath : `${this.testResultsPath}/report_${this.getFormattedDate()}`;
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
                const base64 = Buffer.from(bitmap).toString('base64');

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

    generateReportAsHtml: function (...args) {
        const json = args[0] ? args[0] : JSON.parse(fs.readFileSync(this.getResultFileName()).toLocaleString());
        const originalReportPath = this.getOriginalReportPath();
        const html = fs.readFileSync(`${originalReportPath}/index.html`).toLocaleString();
        const htmlHead = `<head>${this.getReportFilesAsHtmlTags(originalReportPath)}</head>`;
        const path = args[1] ? args[1] : `${this.getReportPath()}/${this.singleHtmlFileName}`;

        let htmlData = this.getJsonAsHtml(json);

        if (typeof htmlData === 'string') {
            try {
                const generatedReport = html.replace('<div class="tests-tree"></div>', `<div class="tests-tree">${htmlData}</div>`)
                    .replace('startTime', json.startTime)
                    .replace(/<head>.*<\/head>/gs, htmlHead);
                
                fs.writeFileSync(path, generatedReport);
                
                return path;
            } 
            catch {
                //ignore and write by parts
                htmlData = [htmlData];
            }
        } 
        
        for (let index = 0; index < htmlData.length; index++) {
            const data = htmlData[index];
            const strLen = Math.floor(data.length / 2);

            htmlData[index] = [data.substring(0, strLen), data.substring(strLen)];
        }
        
        const lastHtmlPartFlag = 'html-next-replace-flag';
        const replacedHtml = html.replace('<div class="tests-tree"></div>', `<div class="tests-tree">${htmlData[0][0]}${lastHtmlPartFlag}</div>`)
            .replace('startTime', json.startTime)
            .replace(/<head>.*<\/head>/gs, htmlHead);
        const flagIndex = replacedHtml.indexOf(lastHtmlPartFlag);
        const firstReportPart = replacedHtml.substring(0, flagIndex);
        const secondReportPart = replacedHtml.substring(flagIndex);

        fs.writeFileSync(path, firstReportPart);

        for (let index = 0; index < htmlData.length; index++) {
            for (let index2 = 0; index2 < htmlData[index].length; index2++) {
                if (index === 0 && index2 === 0) continue;

                const isLastIndex = index === htmlData.length - 1;
                const isInnerLastIndex = index2 === htmlData[index].length - 1;
                
                if (isLastIndex && isInnerLastIndex)
                    fs.appendFileSync(path, secondReportPart.replace(lastHtmlPartFlag, htmlData[index][index2]));
                else
                    fs.appendFileSync(path, htmlData[index][index2]);
            }
        }
        
        return path;
    },
    
    compressImageSync (inputBuffer, quality = 80) {
        try {
            // Create a temporary input file path
            const tempInputPath = require('path').join(require('os').tmpdir(), 'input_image.jpg');
            const tempOutputPath = require('path').join(require('os').tmpdir(), 'output_image.jpg');
    
            // Write the input buffer to the temporary input file
            fs.writeFileSync(tempInputPath, inputBuffer);
    
            // Call the imageProcessor.js script and capture its output (base64-encoded image)
            require('child_process').execFileSync(
                'node', 
                ['node_modules/testcafe-reporter-acd-html-reporter/lib/imageProcessor.js', tempInputPath, tempOutputPath, quality],
                { encoding: 'utf-8' } // Capture stdout as string (base64-encoded image)
            );
    
            // Convert the base64 output back to a Buffer (bitmap)
            const compressedBuffer = fs.readFileSync(tempOutputPath);
    
            // Clean up the temporary input file
            fs.unlinkSync(tempInputPath);
            fs.unlinkSync(tempOutputPath);
            
            return compressedBuffer;
        }
        catch (error) {
            console.error('Error compressing image synchronously:', error);
            return inputBuffer;
        }
    },
    

    getJsonAsHtml: function (json) {
        let generatedReport = '';

        generatedReport += '<div class="fixtures">';
        json.fixtures.forEach(fixture => {
            generatedReport += `<div class="fixture"><div class="summary"></div><div class="fixtureName">${fixture.name}</div>`;
            generatedReport += '<div class="tests">';
            fixture.tests.forEach(test => {
                const isLastTestRun = !fixture.tests.find(another => test.name === another.name && new Date(another[this.jsonNames.testTime]) > new Date(test[this.jsonNames.testTime]));

                if (test[this.jsonNames.testTime] && isLastTestRun) generatedReport += `<div id="${test.id}" class="test" status="${test.status}">${test.name}<div class="tag"></div></div>`;
                stepsArray.push({
                    id: test.id,

                    fixture: fixture.name,

                    test: test.name,

                    steps: this.stepsToString(test.steps),

                    screenshot: (() => {
                        const screenValue = test[this.jsonNames.screenshotOnFail];
                        const base64prefix = 'data:image/png;base64,';

                        if (screenValue) {
                            if (screenValue.startsWith(base64prefix)) {
                                const buffer = Buffer.from(screenValue.replace(base64prefix, ''), 'base64');
                                const compressedBuffer = this.compressImageSync(buffer, 50); // Compress with 50% quality
                                const base64 = compressedBuffer.toString('base64');

                                return `data:image/png;base64,${base64}`;
                            }

                            return screenValue;
                        }
                        return '';
                    })(),

                    durationMs: test[this.jsonNames.testDuration],

                    userAgent: test[this.jsonNames.testUserAgents],

                    stackTrace: test[this.jsonNames.testStackTrace],

                    time: test[this.jsonNames.testTime],

                    status: test[this.jsonNames.testStatus],
                });
            });
            generatedReport += '</div></div>';
        }); 
        generatedReport += '</div>';
        generatedReport += '<div steps style="display: none;">';

        const reportParts = [];

        stepsArray.forEach((stepsData, i) => {
            const testData = `<div fixtureId="${stepsData.id}" status="${stepsData.status}" screenshot="${stepsData.screenshot}" durationMs="${stepsData.durationMs}" userAgent="${stepsData.userAgent}" time="${stepsData.time}" f="${stepsData.fixture.replace(/([\t\n\f />"'=]+)/, '')}" t="${stepsData.test.replace(/([\t\n\f />"'=]+)/, '')}">`;
            const replacedData = stepsData.steps.replace('<step>', testData);
            
            let curentString = generatedReport;
            
            try {
                curentString += replacedData;
                generatedReport = curentString;
            }
            catch {
                reportParts.push(generatedReport);
                curentString = replacedData;
            }
                
            if (stepsData.stackTrace && stepsData.stackTrace.length) {
                const trace = `<div traceId="${stepsData.id}">${JSON.stringify(stepsData.stackTrace)}</div>`;

                try {
                    curentString += trace;
                    generatedReport = curentString;
                }
                catch {
                    reportParts.push(generatedReport);
                    curentString = trace;
                }
            }

            if (i === stepsArray.length - 1 && reportParts.length) reportParts.push(curentString);
        });

        if (reportParts.length) {
            reportParts.push('</div>');
            return reportParts;
        }

        return generatedReport + '</div>';
    },


    stepsToString: function (steps) {
        let stepsString = '<step>';

        steps.forEach(step => {
            stepsString += '<div class="step" hiddeninfo>';
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

// ad.generateReportAsHtml();
