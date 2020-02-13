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

            stackTrace: [254, 109, 90]
        },

        testsCount: 0,

        startTime: 0,

        userAgent: '',

        currentFixtureName: '',

        skippedCount: 0,

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
      
        writeToReportSomething (data, field) {
            let content = this.reportUtil.jsonNames.baseJsonContent;

            if (this.fs.existsSync(this.reportUtil.getResultFileName()))
                content = this.fs.readFileSync(this.reportUtil.getResultFileName()).toLocaleString();

            const json = JSON.parse(content);

            if (field === this.reportUtil.jsonNames.fixture) 
                json.fixtures.push(data);
            else if (field === this.reportUtil.jsonNames.test) 
                json.fixtures[json.fixtures.length - 1].tests.push(data);
            else if (field) 
                json[field] = data;

            this.fs.writeFileSync(this.reportUtil.getResultFileName(), JSON.stringify(json));
        },

        /**
         * @param {{name: string, value: any} | {name: string, value: any}[]} properties 
         */
        setLastTestProperties (properties) {
            const json = JSON.parse(this.fs.readFileSync(this.reportUtil.getResultFileName()).toLocaleString());
            const fixtures = json.fixtures;
            const tests = fixtures[fixtures.length - 1].tests;

            if (!properties.length) 
                properties = [properties];
            
            for (const { name, value } of properties) {
                json.fixtures[fixtures.length - 1].tests[tests.length - 1][name] = value;
                this.fs.writeFileSync(this.reportUtil.getResultFileName(), JSON.stringify(json));    
            }
        },

        setTestStatus (status) {
            const json = JSON.parse(this.fs.readFileSync(this.reportUtil.getResultFileName()).toLocaleString());
            const fixtures = json.fixtures;
            const tests = fixtures[fixtures.length - 1].tests;
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

        reportTaskStart (startTime, userAgents, testsCount) {
            const time = this.moment(startTime).format('YYYY-MM-DDTHH:mm:ss');
            const reportPath = this.reportUtil.getResultFileName().split('/');

            try {
                this.fs.unlinkSync(this.reportUtil.getResultFileName());
            }
            catch (e) {
                //file doesn't exist
            }

            reportPath.pop();
            if (!this.fs.existsSync(reportPath.join('/')))
                this.fs.mkdirSync(reportPath.join('/'), { recursive: true });
            
            this.testsCount = testsCount;
            this.startTime = startTime;
            this.userAgent = userAgents;
            this.logBorder('Task start');

            console.log(`Tests run: ${testsCount} on ${userAgents}`);
            console.log(`Start time: ${time}`);
            this.logBorder();
            this.writeToReportSomething(time, this.reportUtil.jsonNames.startTime);
        },

        reportFixtureStart (name) {
            if (this.currentFixtureName !== name) {
                this.currentFixtureName = name;
                this.logBorder('Fixture start');
                console.log(`Fixture started: ${name}`);
                this.writeToReportSomething(this.reportUtil.jsonNames.baseFixtureContent(name), this.reportUtil.jsonNames.fixture);    
            }
        },

        reportTestStart (name) {
            this.logBorder('Test start');
            console.log(`Test started: ${this.currentFixtureName} - ${name}`);
            this.writeToReportSomething(this.reportUtil.jsonNames.baseTestContent(name), this.reportUtil.jsonNames.test);
        },

        reportTestDone (name, testRunInfo) {
            const hasErr = !!testRunInfo.errs.length;
            const stackTrace = [];

            let result = hasErr ? this.testStatuses.failed : this.testStatuses.passed;

            const chalkColor = this.chalkStyles[result];

            if (testRunInfo.skipped) {
                result = this.testStatuses.skipped;                
                this.skippedCount++;
            }

            this.logBorder('Test done');
            console.log(this.chalk[chalkColor](`Test ${result}: ${this.currentFixtureName} - ${name}`));
            
            if (hasErr) {
                for (let index = 0; index < testRunInfo.errs.length; index++) {
                    const err = testRunInfo.errs[index];
                    
                    let errName;
                    
                    if (err.errMsg)
                        errName = err.errMsg;
                    else if (err.apiFnChain && err.apiFnChain.some(val => val.includes('Selector')))
                        errName = `Element not found: ${err.apiFnChain.join('')}`;
                    else
                        errName = 'Unknown error';

                    stackTrace.push([]);
                    stackTrace[index].push(errName);          
                    testRunInfo.errs[index].callsite.stackFrames.forEach(stackFrame => {
                        const msg = stackFrame.toString();

                        if (!msg.includes('node_modules') && !msg.includes('process._tickCallback') && !msg.includes('__awaiter') && msg.includes(':') && msg.includes('('))
                            stackTrace[index].push(msg);
                    });    
                }
            }

            for (const error of stackTrace) {
                for (let index = 0; index < error.length; index++)
                    console.log(this.chalk.rgb(...this.chalkStyles.stackTrace)(' '.repeat(index) + error[index]));
            }

            this.logBorder();
            this.addTestInfo(result, 
                hasErr && testRunInfo.screenshots ? testRunInfo.screenshots[testRunInfo.screenshots.length - 1].screenshotPath : null,
                this.userAgent,
                testRunInfo.durationMs,
                stackTrace);
        },

        reportTaskDone (endTime, passed, warnings) {
            const time = this.moment(endTime).format('M/DD/YYYY HH:mm:ss');
            const durationMs = endTime - this.startTime;
            const durationStr = this.moment.duration(durationMs).format('h[h] mm[m] ss[s]');
      
            let summary = this.chalk[this.chalkStyles.passed](`${passed}/${this.testsCount} ${this.testStatuses.passed}`) + ', ';
      
            if (passed !== this.testsCount) {
                summary += this.chalk[this.chalkStyles.failed](`${this.testsCount - passed}/${this.testsCount} ${this.testStatuses.failed}`) + ', ' + 
                this.chalk[this.chalkStyles.skipped](`${this.skippedCount ? this.skippedCount : 0} ${this.testStatuses.skipped}`);
            }
      
            this.logBorder('Task done');
            console.log(`Test run finished: ${time}`);
            console.log(`Duration: ${durationStr}`);
            console.log(`Run results: ${summary}`);
            if (warnings.length) console.log(warnings);
            this.reportUtil.generateReport();
        }
    };
};
