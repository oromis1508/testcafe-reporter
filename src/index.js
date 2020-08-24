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

        testsNumber: 0,
        
        isSaveAsFile: false,

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

        writeToReportSomething (data, field) {
            let json;

            if (this.fs.existsSync(this.reportUtil.getResultFileName())) json = this.getJsonAsObject();
            else json = JSON.parse(this.reportUtil.jsonNames.baseJsonContent);

            if (field === this.reportUtil.jsonNames.fixture) {
                if (!json.fixtures.find(el => el.name === data.name)) json.fixtures.push(data);
            }
            else if (field === this.reportUtil.jsonNames.test)
                json.fixtures.find(fixt => fixt.name === console.currentFixtureName).tests.push(data);
            else if (field) 
                json[field] = data;

            this.writeToJson(json);    
        },

        /**
         * @param {{name: string, value: any} | {name: string, value: any}[]} properties 
         */
        setLastTestProperties (properties) {
            const json = this.getJsonAsObject();
            const fixtures = json.fixtures;
            const tests = fixtures.find(fixt => fixt.name === console.currentFixtureName).tests;

            if (!properties.length) 
                properties = [properties];
            
            for (const { name, value } of properties) {
                tests[tests.length - 1][name] = value;
                this.writeToJson(json);    
            }
        },

        setTestStatus (status) {
            const json = this.getJsonAsObject();
            const fixtures = json.fixtures;
            const tests = fixtures.find(fixt => fixt.name === console.currentFixtureName).tests;
            const currentStatus = tests[tests.length - 1].status;

            if (currentStatus !== this.testStatuses.broken) 
                this.setLastTestProperties({ name: this.reportUtil.jsonNames.testStatus, value: status });
        },

        logBorder (info) {
            console.log(this.chalk[this.chalkStyles.borderLine](`-------------------------------------------${info ? this.chalk[this.chalkStyles.borderText](info) : ''}-------------------------------------------`));
        },

        addTestInfo (testStatus, screenPath, userAgent, durationMs, stackTrace) {
            this.setTestStatus(testStatus);
            this.setLastTestProperties([
                { name: this.reportUtil.jsonNames.screenshotOnFail, value: screenPath },
                { name: this.reportUtil.jsonNames.testUserAgents, value: userAgent },
                { name: this.reportUtil.jsonNames.testDuration, value: durationMs },
                { name: this.reportUtil.jsonNames.testStackTrace, value: stackTrace }
            ]);
        },

        addStep (message) {
            const json = this.getJsonAsObject();
            const fixtures = json.fixtures;
            const tests = fixtures.find(fixt => fixt.name === console.currentFixtureName).tests;
            
            tests[tests.length - 1].steps.push(this.reportUtil.jsonNames.baseStepContent(message));
            this.writeToJson(json);    
        },

        addStepInfo (message) {
            const json = this.getJsonAsObject();
            const fixtures = json.fixtures;
            const tests = fixtures.find(fixt => fixt.name === console.currentFixtureName).tests;
            const steps = tests[tests.length - 1].steps;

            if (!steps.length) {
                this.addStep('');
                this.addStepInfo(message);
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
            const reportFileArg = args.reportFile;

            if (reportPathArg) {
                if (this.fs.existsSync(reportPathArg) && this.fs.statSync(reportPathArg).isFile()) {
                    console.log(this.chalk.red(`Report warning: ${reportPathArg} - is file! The report will be generated in the base directory.`));
                    return;
                }

                this.reportUtil.getResultFileName = () => `${reportPathArg}.json`;
                this.reportUtil.getReportPath = () => reportPathArg;
            }
            else if (reportFileArg) {
                this.isSaveAsFile = true;
                if (typeof reportFileArg !== 'string') return;

                let reportPath = reportFileArg;

                if (reportFileArg.endsWith('.html')) {
                    const split = reportFileArg.split(/[/\\]/g);

                    this.reportUtil.singleHtmlFileName = split.pop();
                    reportPath = split.join('/');
                }

                this.reportUtil.getReportPath = () => reportPath;
            }
        },

        reportTaskStart (startTime, userAgents, testsCount) {
            const time = this.moment(startTime).format('YYYY-MM-DDTHH:mm:ss');

            console.isReportUsed = true;
            this.parseStartArguments();
            if (!this.fs.existsSync(this.reportUtil.getReportPath())) 
                this.fs.mkdirSync(this.reportUtil.getReportPath(), { recursive: true });

            try {
                this.fs.unlinkSync(this.reportUtil.getResultFileName());
            }
            catch (e) { /*file doesn't exist*/ }
            
            this.testsCount = testsCount;
            this.taskStartTime = startTime;
            this.userAgent = userAgents;
            this.logBorder('Task start');

            console.log(`Tests run: ${testsCount} on ${userAgents}`);
            console.log(`Start time: ${time}`);
            this.logBorder();
            this.writeToReportSomething(time, this.reportUtil.jsonNames.startTime);
        },

        reportFixtureStart (name) {
            if (console.currentFixtureName !== name) {
                console.currentFixtureName = name;
                this.logBorder('Fixture start');
                console.log(`Fixture started: ${name}`);
                this.writeToReportSomething(this.reportUtil.jsonNames.baseFixtureContent(name), this.reportUtil.jsonNames.fixture);    
            }
        },

        reportTestStart (name) {
            this.testStartTime = new Date().valueOf();
            const time = this.moment(this.testStartTime).format('M/DD/YYYY HH:mm:ss');

            this.testsNumber++;
            this.logBorder('Test start');
            console.log(`Test started (${this.testsNumber}/${this.testsCount}): ${console.currentFixtureName} - ${name}`);
            console.log(`Start time: ${time}`);
            this.writeToReportSomething(this.reportUtil.jsonNames.baseTestContent(name), this.reportUtil.jsonNames.test);
        },

        reportTestDone (name, testRunInfo) {
            const hasErr = !!testRunInfo.errs.length;
            const screenPath = hasErr && testRunInfo.screenshots && testRunInfo.screenshots.length ? testRunInfo.screenshots[testRunInfo.screenshots.length - 1].screenshotPath : null;
            const stackTrace = this.getStackTraceAsStringsArray(testRunInfo.errs);
            const duration = this.moment.duration(testRunInfo.durationMs).format('h[h] mm[m] ss[s]');
            const result = hasErr ? this.testStatuses.failed : this.testStatuses.passed;
            const chalkColor = this.chalkStyles[result];

            this.logBorder('Test done');
            if (testRunInfo.skipped) {
                this.skippedCount++;
                this.testsCount++;
                console.log(this.chalk[this.chalkStyles.skipped](`Test skipped: ${console.currentFixtureName} - ${name}`));
            }
            else console.log(this.chalk[chalkColor](`Test ${result}: ${console.currentFixtureName} - ${name}`));

            console.log(`Duration: ${duration}`);

            for (const error of stackTrace) {
                for (let index = 0; index < error.length; index++)
                    console.log(this.chalk.rgb(...this.chalkStyles.stackTrace)(' '.repeat(index) + error[index]));
            }

            if (screenPath) console.log(this.chalk[this.chalkStyles.screenPath](`Screenshot: ${screenPath}`));
            this.logBorder();

            this.addTestInfo(testRunInfo.skipped ? this.testStatuses.skipped : result, screenPath, this.userAgent, duration, stackTrace);
        },

        reportTaskDone (endTime, passed, warnings) {
            const time = this.moment(endTime).format('M/DD/YYYY HH:mm:ss');
            const durationMs = endTime - this.taskStartTime;
            const durationStr = this.moment.duration(durationMs).format('h[h] mm[m] ss[s]');
      
            let summary = this.chalk[this.chalkStyles.passed](`${passed}/${this.testsCount} ${this.testStatuses.passed}`);
      
            if (passed !== this.testsCount) {
                summary += ', ' + this.chalk[this.chalkStyles.failed](`${this.testsCount - passed}/${this.testsCount} ${this.testStatuses.failed}`) + ', ' + 
                this.chalk[this.chalkStyles.skipped](`${this.skippedCount ? this.skippedCount : 0} ${this.testStatuses.skipped}`);
            }
      
            this.logBorder('Task done');
            console.log(`Test run finished: ${time}`);
            console.log(`Duration: ${durationStr}`);
            console.log(`Run results: ${summary}`);
            if (warnings.length) console.log(warnings);
            console.log(this.chalk[this.chalkStyles.report](`Test report generated: ${require('path').resolve(this.reportUtil.getReportPath())}/index.html`));
            
            if (this.isSaveAsFile) this.reportUtil.generateReportAsHtml();
            else this.reportUtil.generateReport();
        }
    };
};
