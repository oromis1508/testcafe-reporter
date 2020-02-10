module.exports = function () {
    return {
        noColors: false,

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
            var content = '{"fixtures": []}';

            if (this.fs.existsSync(this.reportUtil.getResultFileName()))
                content = this.fs.readFileSync(this.reportUtil.getResultFileName()).toLocaleString();

            const json = JSON.parse(content);

            if (field === 'fixture') 
                json.fixtures.push(data);
            else if (field === 'test') 
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

            if (currentStatus !== 'broken') 
                this.setLastTestProperties({ name: 'status', value: status });
        },

        logBorder (info) {
            console.log(this.chalk.gray(`-------------------------------------------${info ? this.chalk.bold(info) : ''}-------------------------------------------`));
        },

        addTestInfo (testStatus, screenPath, userAgent, durationMs, stackTrace) {
            this.setTestStatus(testStatus);
            this.setLastTestProperties([
                { name: 'screenshot', value: screenPath },
                { name: 'userAgent', value: userAgent },
                { name: 'durationMs', value: durationMs },
                { name: 'stackTrace', value: stackTrace }
            ]);
        },

        reportTaskStart (startTime, userAgents, testsCount) {
            const time = this.moment(startTime).format('YYYY-MM-dTh:mm:ss');
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
            
            this.testCount = testsCount;
            this.startTime = startTime;
            this.userAgent = userAgents;
            this.logBorder('Task start');
            console.log(`Tests run: ${testsCount} on ${userAgents}`);
            console.log(`Start time: ${time}`);
            this.logBorder();
            this.writeToReportSomething(time, 'startTime');
        },

        reportFixtureStart (name) {
            if (this.currentFixtureName !== name) {
                const fixtureContent = { name: name, tests: [] };

                this.currentFixtureName = name;
                this.logBorder('Fixture start');
                console.log(`Fixture started: ${name}`);
                this.writeToReportSomething(fixtureContent, 'fixture');    
            }
        },

        reportTestStart (name) {
            const testContent = { name: name, steps: [] };

            this.logBorder('Test start');
            console.log(`Test started: ${this.currentFixtureName} - ${name}`);
            this.writeToReportSomething(testContent, 'test');
        },

        reportTestDone (name, testRunInfo) {
            const hasErr = !!testRunInfo.errs.length;
           
            let result = hasErr ? 'failed' : 'passed';

            if (testRunInfo.skipped) {
                result = 'skipped';                
                this.skippedCount = this.skippedCount ? this.skippedCount + 1 : 1;
            }
            this.logBorder('Test done');

            let chalkColor;

            switch (result) {
            case 'skipped':
                chalkColor = 'gray'; break;
            case 'passed':
                chalkColor = 'green'; break;
            case 'failed':
                chalkColor = 'red'; break;
            case 'broken':
                chalkColor = 'yellow'; break;
            }
            //this.symbols
            console.log(this.chalk[chalkColor](`Test ${result}: ${this.currentFixtureName} - ${name}`));
            // var info = {
            //     "errs":[
            //         {
            //             "userAgent":"Chrome 79.0.3945 / Windows 10.0.0",
            //             "screenshotPath":"D:\\autotests\\luminata-test\\screenshots\\2020-02-06_14-47-44\\test-1\\Chrome_79.0.3945_Windows_10.0.0\\errors\\1.png",
            //             "testRunPhase":"inFixtureBeforeEachHook",
            //             "code":"E24",
            //             "isTestCafeError":true,
            //             "callsite":{
            //                 "filename":"d:\\autotests\\luminata-test\\page-objects\\panels\\header.ts",
            //                 "lineNum":106,
            //                 "callsiteFrameIdx":6,
            //                 "stackFrames":[{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}],
            //                 "isV8Frames":true
            //             },
            //             "apiFnChain":["Selector('.com-acdlabs-luminata-client-mvp-main-recordsetpicker-RecordSetPickerView_BinderImpl_GenCss_style-recordSetPickerLabel')"],
            //             "apiFnIndex":0
            //         }
            //     ],
            //     "warnings":[],
            //     "durationMs":18947,
            //     "screenshotPath":"D:\\autotests\\luminata-test\\screenshots\\2020-02-06_14-47-44\\test-1\\Chrome_79.0.3945_Windows_10.0.0\\errors\\1.png",
            //     "screenshots":[
            //         {
            //             "screenshotPath":"D:\\autotests\\luminata-test\\screenshots\\2020-02-06_14-47-44\\test-1\\Chrome_79.0.3945_Windows_10.0.0\\errors\\1.png",
            //             "thumbnailPath":"D:\\autotests\\luminata-test\\screenshots\\2020-02-06_14-47-44\\test-1\\Chrome_79.0.3945_Windows_10.0.0\\errors\\thumbnails\\1.png",
            //             "userAgent":"Chrome_79.0.3945_Windows_10.0.0",
            //             "quarantineAttempt":null,
            //             "takenOnFail":true
            //         }
            //     ],
            //     "quarantine":null,
            //     "skipped":false
            // }
            
            this.logBorder();
            this.addTestInfo(result, 
                hasErr && testRunInfo.screenshots ? testRunInfo.screenshots[testRunInfo.screenshots.length - 1].screenshotPath : null,
                this.userAgent,
                testRunInfo.durationMs,
                hasErr ? this.formatError(testRunInfo.errs[0]) : '');
        },

        reportTaskDone (endTime, passed, warnings) {
            const time = this.moment(endTime).format('M/DD/YYYY HH:mm:ss');
            const durationMs = endTime - this.startTime;
            const durationStr = this.moment.duration(durationMs).format('h[h] mm[m] ss[s]');
      
            let summary = `${passed}/${this.testsCount} passed, `;
      
            if (passed !== this.testsCount)
                summary += `${this.testsCount - passed}/${this.testsCount} failed, ${this.skippedCount ? this.skippedCount : 0} skipped`;
      
            this.logBorder('Task done');
            console.log(`Test run finished: ${time}`);
            console.log(`Duration: ${durationStr}`);
            console.log(`Run results: ${summary}`);
            if (warnings.length) console.log(warnings);
            this.reportUtil.generateReport();
        }
    };
};
