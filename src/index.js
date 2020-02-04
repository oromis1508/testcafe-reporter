module.exports = function () {
    return {
        noColors: true,
        
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

        setTestStatus (status) {
            const json = JSON.parse(this.fs.readFileSync(this.reportUtil.getResultFileName()).toLocaleString());
            const fixtures = json.fixtures;
            const tests = fixtures[fixtures.length - 1].tests;
            const currentStatus = tests[tests.length - 1].status;

            json.fixtures[fixtures.length - 1].tests[tests.length - 1].status = currentStatus === 'broken' ? currentStatus : status;
            this.fs.writeFileSync(this.reportUtil.getResultFileName(), JSON.stringify(json));
        },

        logBorder (info) {
            console.log(`-------------------------------------------${info ? info : ''}-------------------------------------------`);
        },

        addSreenshotPath (path) {
            const json = JSON.parse(this.fs.readFileSync(this.reportUtil.getResultFileName()).toLocaleString());
            const fixtures = json.fixtures;
            const tests = fixtures[fixtures.length - 1].tests;

            json.fixtures[fixtures.length - 1].tests[tests.length - 1].screenshot = path;
            this.fs.writeFileSync(this.reportUtil.getResultFileName(), JSON.stringify(json));
        },

        reportTaskStart (startTime, userAgents, testCount) {
            const time = this.moment(startTime).format('M/D/YYYY h:mm:ss a');
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
            
            this.testCount = testCount;
            this.logBorder('Task start');
            console.log(`Tests run: ${testCount} on ${userAgents}`);
            console.log(`Start time: ${time}`);
            this.logBorder();
            this.writeToReportSomething(time, 'startTime');
        },

        reportFixtureStart (name) {
            const fixtureContent = { name: name, tests: [] };

            this.currentFixtureName = name;
            this.logBorder('Fixture start');
            console.log(`Fixture started: ${name}`);
            this.writeToReportSomething(fixtureContent, 'fixture');
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

            if (testRunInfo.skipped)
                result = 'skipped';                
            this.logBorder('Test done');
            console.log(`Test finished: ${this.currentFixtureName} - ${name}`);
            console.log(`Test result: ${result}`);
            this.logBorder();
            this.setTestStatus(result);
            if (hasErr)
                this.addSreenshotPath(testRunInfo.screenshotPath);
        },

        reportTaskDone (endTime, passed, warnings) {
            const time = this.moment(endTime).format('M/D/YYYY h:mm:ss a');
            const durationMs = endTime - this.startTime;
            const durationStr = this.moment.duration(durationMs).format('h[h] mm[m] ss[s]');
      
            let summary = `${passed}/${this.testCount} passed`;
      
            if (passed !== this.testCount)
                summary += `\n${this.testCount - passed}/${this.testCount} failed`;
      
            this.logBorder('Task done');
            console.log(`Test run finished: ${time}`);
            console.log(`Duration: ${durationStr}`);
            console.log(`Run results: ${summary}`);
            console.log(warnings);
            this.reportUtil.generateReport();
        }
    };
};
