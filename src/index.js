let maxTestId = 1;

//getTestStatus, getId, setTestStatus, setTestProperties
module.exports = function () {
    return {
        noColors: false,

        chalk: require('chalk'),

        testStatuses: {
            passed: 'passed',

            failed: 'failed',

            broken: 'broken',

            skipped: 'skipped'
        },

        chalkStyles: {
            passed: 'green',

            failed: 'red',

            broken: 'yellow',

            skipped: 'gray',

            borderLine: 'gray',

            borderText: 'bold',

            stackTrace: [254, 109, 90],

            report: 'cyan',

            screenPath: 'cyan'
        },

        testsCount: 0,

        taskStartTime: 0,
        
        testStartTime: 0,

        userAgent: '',

        skippedCount: 0,

        brokenCount: 0,
        
        isSaveAsFile: false,

        isScreensAsBase64: false,

        appendLogs: false,

        currentFixtureName: '',

        /**
         * @type {{id: number, fixture: string, name: string}[]}
         */
        testsInfo: [],

        getFixtureName (testName) {
            if (testName) return this.testsInfo.find(test => test.name === testName).fixture;
            return this.currentFixtureName;
        },

        getTestName (testName) {
            return testName ? testName : this.testName;
        },

        getId (testName) {
            return this.testsInfo.find(test => test.name === this.getTestName(testName) && test.fixture === this.getFixtureName(testName)).id;
        },

        createErrorDecorator () {
            return {
                'span category':       () => '',
                'span step-name':      str => `"${str}"`,
                'span user-agent':     str => this.chalk.gray(str),
                'div screenshot-info': str => str,
                'a screenshot-path':   str => this.chalk.underline(str),
                'code':                str => this.chalk.yellow(str),
                'code step-source':    str => this.chalk.magenta(this.indentString(str, 4)),
                'span code-line':      str => `${str}\n`,
                'span last-code-line': str => str,
                'code api':            str => this.chalk.yellow(str),
                'strong':              str => this.chalk.cyan(str),
                'a':                   str => this.chalk.yellow(`"${str}"`)
            };
        },
        
        fs: require('fs'),

        reportUtil: require('./jsonToHtml'),
      
        writeToJson (object) {
            this.fs.writeFileSync(this.reportUtil.getResultFileName(), JSON.stringify(object, null, 2));
        },

        getJsonAsObject () {
            return JSON.parse(this.fs.readFileSync(this.reportUtil.getResultFileName()).toLocaleString());
        },

        writeToReportOnStart (data, field) {
            let json;

            if (this.fs.existsSync(this.reportUtil.getResultFileName())) json = this.getJsonAsObject();
            else json = JSON.parse(this.reportUtil.jsonNames.baseJsonContent);

            if (field === this.reportUtil.jsonNames.fixture) {
                if (!json.fixtures.find(el => el.name === data.name)) json.fixtures.push(data);
            }
            else if (field === this.reportUtil.jsonNames.test)
                json.fixtures.find(fixt => fixt.name === this.currentFixtureName).tests.push(data);
            else if (field) 
                json[field] = data;

            this.writeToJson(json);    
        },

        /**
         * @param {string} testName 
         * @param {{name: string, value: any} | {name: string, value: any}[]} properties 
         */
        setTestProperties (testName, properties) {
            const json = this.getJsonAsObject();
            const fixtures = json.fixtures;
            const tests = fixtures.find(fixt => fixt.name === this.getFixtureName(testName)).tests;

            if (!properties.length) 
                properties = [properties];
            
            for (const { name, value } of properties) {
                tests.find(test => test.id === this.getId(testName))[name] = value;
                this.writeToJson(json);    
            }
        },

        getTestStatus (testName) {
            const json = this.getJsonAsObject();
            const fixtures = json.fixtures;
            const tests = fixtures.find(fixt => fixt.name === this.getFixtureName(testName)).tests;

            return tests.find(test => test.id === this.getId(testName, testName)).status;
        },

        setTestStatus (testName, status) {
            if (status === this.testStatuses.failed || this.getTestStatus(this.getTestName(testName)) !== this.testStatuses.broken) 
                this.setTestProperties(this.getTestName(testName), { name: this.reportUtil.jsonNames.testStatus, value: status === null ? this.testStatuses.broken : status });
        },

        logBorder (info) {
            console.log(this.chalk[this.chalkStyles.borderLine](`-------------------------------------------${info ? this.chalk[this.chalkStyles.borderText](info) : ''}-------------------------------------------`));
        },

        addTestInfo (testName, testStatus, screenPath, userAgent, durationMs, stackTrace) {
            this.setTestStatus(this.getTestName(testName), testStatus);
            this.setTestProperties(this.getTestName(testName), [
                { name: this.reportUtil.jsonNames.screenshotOnFail, value: screenPath },
                { name: this.reportUtil.jsonNames.testUserAgents, value: userAgent },
                { name: this.reportUtil.jsonNames.testDuration, value: durationMs },
                { name: this.reportUtil.jsonNames.testStackTrace, value: stackTrace }
            ]);
        },

        updateTestFixture (testName, fixture) {
            if (!this.testsInfo.find(test => test.name === testName && test.fixture === fixture))
                this.testsInfo.find(test => test.name === testName).fixture = fixture;
        },

        addStep (testName, message, fixture) {
            this.updateTestFixture(testName, fixture);

            const json = this.getJsonAsObject();
            const fixtures = json.fixtures;
            const tests = fixtures.find(fixt => fixt.name === this.currentFixtureName).tests;

            tests.find(test => test.id === this.getId(testName)).steps.push(this.reportUtil.jsonNames.baseStepContent(message));
            this.writeToJson(json);    
        },

        addStepInfo (testName, message, fixture) {
            this.updateTestFixture(testName, fixture);

            const json = this.getJsonAsObject();
            const fixtures = json.fixtures;
            const tests = fixtures.find(fixt => fixt.name === this.currentFixtureName).tests;
            const steps = tests.find(test => test.id === this.getId(testName)).steps;

            if (!steps.length) {
                this.addStep(testName, '');
                this.addStepInfo(testName, message);
            }
            else {
                steps[steps.length - 1].actions.push(message);
                this.writeToJson(json);    
            }
        },

        getStackTraceAsStringsArray (errs) {
            const stackTrace = [];

            for (let index = 0; index < errs.length; index++) {
                const err = errs[index];
                
                let errName;
                
                try {
                    const errorMarkup = err.getErrorMarkup();

                    errName = />(.*?)\n/.exec(errorMarkup)[1].replace('</div>', '');
                }
                catch (ignoreErr) {
                    console.log('getErrorMarkup not available. Will be used another name');
                }

                if (!errName) {
                    if (err.errMsg)
                        errName = err.errMsg;
                    else if (err.code) {
                        const errorsTypes = require('testcafe/lib/errors/types');
                        const runtimeKey = Object.keys(errorsTypes.RUNTIME_ERRORS).find(key => errorsTypes.RUNTIME_ERRORS[key] === err.code);
                        const testRunKey = Object.keys(errorsTypes.TEST_RUN_ERRORS).find(key => errorsTypes.TEST_RUN_ERRORS[key] === err.code);
                        
                        errName = runtimeKey ? runtimeKey : testRunKey;
                    }
                    else
                        errName = 'Unknown error';
                }

                if (err.apiFnChain)
                    errName += `: ${err.apiFnChain.join ? err.apiFnChain.join('') : err.apiFnChain}`;
                if (err.filePaths)
                    errName += `(Files: ${err.filePaths.join ? err.filePaths.join('') : err.filePaths})`;

                stackTrace.push([]);
                if (errs[index].callsite) {
                    stackTrace[index].push(errName);          
                    errs[index].callsite.stackFrames.forEach(stackFrame => {
                        const msg = stackFrame.toString();
    
                        if (!msg.includes('node_modules') && !msg.includes('process._tickCallback') && !msg.includes('__awaiter') && msg.includes(':'))
                            stackTrace[index].push(msg);
                    });
                } 
                else
                    stackTrace[index].push(...errName.split('\n'));
            }

            return stackTrace;
        },

        parseStartArguments () {
            const minimist = require('minimist');
            const args = minimist(process.argv.slice(2));
            const reportPathArg = args.reportPath;
            const reportFileArg = args.reportFile ? args.reportFile : true;
            const base64screens = args.base64screens;
            
            this.appendLogs = args.appendLogs;

            if (base64screens)
                this.isScreensAsBase64 = true;

            if (reportPathArg) {
                if (this.fs.existsSync(reportPathArg) && this.fs.statSync(reportPathArg).isFile()) {
                    console.log(this.chalk.red(`Report warning: ${reportPathArg} - is file! The report will be generated in the base directory.`));
                    return;
                }

                console.resultFileName = `${reportPathArg}.json`;
                console.reportPath = reportPathArg;
            }
            else if (reportFileArg) {
                this.isSaveAsFile = true;
                if (typeof reportFileArg !== 'string') return;

                let reportPath = reportFileArg;

                if (reportFileArg.endsWith('.html')) {
                    const split = reportFileArg.split(/[/\\]/g);

                    console.singleHtmlFileName = split.pop();
                    reportPath = split.join('/');
                }

                console.reportPath = reportPath;
            }
        },

        reportTaskStart (startTime, userAgents, testsCount) {
            try {
                const time = this.moment(startTime).format('YYYY-MM-DDTHH:mm:ss');

                console.isReportUsed = true;
                this.reportUtil.startTime = new Date(startTime);
                require('./Logger').__reporter.obj = this;

                this.parseStartArguments();
                
                if (!this.fs.existsSync(this.reportUtil.getReportPath())) 
                    this.fs.mkdirSync(this.reportUtil.getReportPath(), { recursive: true });

                try {
                    if (!this.appendLogs) this.fs.unlinkSync(this.reportUtil.getResultFileName());
                    else if (this.fs.existsSync(this.reportUtil.getResultFileName())) {
                        const json = JSON.parse(this.fs.readFileSync(this.reportUtil.getResultFileName()).toLocaleString());
                        const testIds = json.fixtures.map(fixture => fixture.tests.map(test => test.id)).flat();

                        maxTestId = Math.max(...testIds) + 1;
                    }
                }
                catch (e) { /*file doesn't exist*/ }
                
                this.testsCount = testsCount;
                this.taskStartTime = startTime;
                this.userAgent = userAgents;
                this.logBorder('Task start');

                console.log(`Tests run: ${testsCount} on ${userAgents}`);
                console.log(`Start time: ${time}`);
                this.logBorder();
                if (this.appendLogs && !this.fs.existsSync(this.reportUtil.getResultFileName()) || !this.appendLogs) 
                    this.writeToReportOnStart(time, this.reportUtil.jsonNames.startTime);
            } 
            catch (err) {
                console.log(err.message ? err.message : err.msg);
            }
        },

        reportFixtureStart (name) {
            try {
                this.currentFixtureName = name;
                this.logBorder('Fixture start');
                console.log(`Fixture started: ${name}`);
                this.writeToReportOnStart(this.reportUtil.jsonNames.baseFixtureContent(name), this.reportUtil.jsonNames.fixture);    
            } 
            catch (err) {
                console.log(err.message ? err.message : err.msg);
            }
        },

        reportTestStart (name) {
            try {
                this.testName = name;
                this.testStartTime = new Date().valueOf();
                
                const time = this.moment(this.testStartTime).format('M/DD/YYYY HH:mm:ss');
                const id = maxTestId++;

                this.testsInfo.push({ id, name, fixture: this.currentFixtureName });

                this.logBorder('Test start');
                console.log(`Test started (${id}/${this.testsCount}): ${this.currentFixtureName} - ${name}\nStart time: ${time}`);
                this.writeToReportOnStart(this.reportUtil.jsonNames.baseTestContent(name, id), this.reportUtil.jsonNames.test);
            } 
            catch (err) {
                console.log(err.message ? err.message : err.msg);
            }
        },

        reportTestDone (name, testRunInfo) {
            try {
                const fixture = this.getFixtureName(name);
                const errorsCount = testRunInfo.errs.length;
                const hasErr = !!errorsCount;
                const screenPath = hasErr && testRunInfo.screenshots && testRunInfo.screenshots.length ? testRunInfo.screenshots[testRunInfo.screenshots.length - errorsCount].screenshotPath : null;
                const stackTrace = this.getStackTraceAsStringsArray(testRunInfo.errs);
                const duration = this.moment.duration(testRunInfo.durationMs).format('h[h] mm[m] ss[s]');
                
                let result = hasErr ? this.testStatuses.failed : this.testStatuses.passed;

                const chalkColor = this.chalkStyles[result];

                if (this.isScreensAsBase64 && screenPath) {
                    const bitmap = this.fs.readFileSync(screenPath);
                    const base64 = Buffer.from(bitmap).toString('base64');
    
                    var base64screenshot = `data:image/png;base64,${base64}`;
                }

                if (this.getTestStatus(name) === this.testStatuses.broken && !hasErr) {
                    result = this.testStatuses.broken;
                    this.brokenCount++;
                }

                this.logBorder(`Test ${this.getId(name)} done`);
                console.log(`Duration: ${duration}`);

                if (testRunInfo.skipped) {
                    this.skippedCount++;
                    this.testsCount++;
                    console.log(this.chalk[this.chalkStyles.skipped](`Test skipped: ${fixture} - ${name}`));
                }
                else {
                    let msg = this.chalk[chalkColor](`Test ${result}: ${fixture} - ${name}\n`);

                    for (const error of stackTrace) {
                        for (let index = 0; index < error.length; index++)
                            msg += this.chalk.rgb(...this.chalkStyles.stackTrace)(' '.repeat(index) + error[index] + '\n');
                    }
                    if (screenPath) msg += this.chalk[this.chalkStyles.screenPath](`Screenshot: ${screenPath}`);
                    console.log(msg);
                }

                this.logBorder();

                this.addTestInfo(name, testRunInfo.skipped ? this.testStatuses.skipped : result, base64screenshot ? base64screenshot : screenPath, this.userAgent, duration, stackTrace);
                
                const index = this.testsInfo.findIndex(test => test.name === name);
                    
                this.testsInfo.splice(index, 1);    
            } 
            catch (err) {
                console.log(err.message ? err.message : err.msg);
            }
        },

        reportTaskDone (endTime, passed, warnings) {
            try {
                const time = this.moment(endTime).format('M/DD/YYYY HH:mm:ss');
                const durationMs = endTime - this.taskStartTime;
                const durationStr = this.moment.duration(durationMs).format('h[h] mm[m] ss[s]');
                const fileName = this.isSaveAsFile ? this.reportUtil.singleHtmlFileName : 'index.html';

                let summary = this.chalk[this.chalkStyles.passed](`${passed - this.brokenCount}/${this.testsCount} ${this.testStatuses.passed}`);
        
                if (passed !== this.testsCount) {
                    summary += ', ' + this.chalk[this.chalkStyles.broken](`${this.brokenCount ? this.brokenCount : 0} ${this.testStatuses.broken}`) + ', ' + 
                    this.chalk[this.chalkStyles.failed](`${this.testsCount - passed - this.skippedCount}/${this.testsCount} ${this.testStatuses.failed}`) + ', ' + 
                    this.chalk[this.chalkStyles.skipped](`${this.skippedCount ? this.skippedCount : 0} ${this.testStatuses.skipped}`);
                }
        
                this.logBorder('Task done');
                console.log(`Test run finished: ${time}`);
                console.log(`Duration: ${durationStr}`);
                console.log(`Run results: ${summary}`);
                if (warnings.length) console.log(warnings);

                console.log(this.chalk[this.chalkStyles.report](`Test report generated: ${require('path').resolve(this.reportUtil.getReportPath())}/${fileName}`));
                
                if (this.isSaveAsFile) this.reportUtil.generateReportAsHtml();
                else this.reportUtil.generateReport();
            } 
            catch (err) {
                console.log(err.message ? err.message : err.msg);
            }
        }
    };
};
