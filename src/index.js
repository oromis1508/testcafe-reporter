let maxTestId = 0;

module.exports = function () {
    return {
        noColors: false,

        chalk:        require('chalk'), 
        testStatuses: {
            passed:  'passed', 
            failed:  'failed',
            broken:  'broken',   
            skipped: 'skipped' 
        },
        chalkStyles: {
            passed:     'green',
            failed:     'red',
            broken:     'yellow',
            skipped:    'gray',
            borderLine: 'gray',
            borderText: 'bold',
            stackTrace: [254, 109, 90],
            report:     'cyan',
            screenPath: 'cyan'
        },
        testsCount:         0,
        taskStartTime:      0,
        testStartTime:      0,
        userAgent:          '',
        skippedCount:       0,
        brokenCount:        0,
        isScreensAsBase64:  false,
        appendLogs:         false,
        currentFixtureName: '',
        warnError:          null,

        /**
     * @type {{id: number, fixture: string, name: string}[]}
     */
        testsInfo: [],

        testRunId: Infinity,

        getResultFileName () {
            const fileName = this.reportUtil.getResultFileName();
            const getNewName = () => fileName.replace('.json', `_${this.testRunId}${this.appendLogs ? 't' : ''}.json`);

            if (!this.appendLogs) return fileName;
            if (this.testRunId === Infinity) {
                do 
                    this.testRunId = Math.floor(Math.random() * 900000) + +process.pid.toString().slice(-5);
                while (this.fs.existsSync(getNewName()));
            }
            return getNewName();
        },
        
        getTestName (testName) {
            return testName ? testName : this.testName;
        },

        getId (testName) {
            return this.testsInfo.find(test => test.name === this.getTestName(testName) && test.fixture === this.currentFixtureName)?.id;
        },

        getTestRunId () {
            return this.appendLogs ? ` ${this.testRunId}` : '';
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

        fs:         require('fs'),
        reportUtil: require('./jsonToHtml'),

        writeToJson (object) {
            try {
                this.fs.writeFileSync(this.getResultFileName(), JSON.stringify(object, null, 2));
            }
            catch { /** ignore */}
        },

        getJsonAsObject () {
            return JSON.parse(this.fs.readFileSync(this.getResultFileName()).toLocaleString());
        },

        writeToReportOnStart (data, field) {
            let json;

            if (this.fs.existsSync(this.getResultFileName())) json = this.getJsonAsObject(); else json = JSON.parse(this.reportUtil.jsonNames.baseJsonContent);

            if (field === this.reportUtil.jsonNames.fixture && !json.fixtures.find(el => el.name === data.name)) json.fixtures.push(data);
            else if (field === this.reportUtil.jsonNames.test) {
                data[this.reportUtil.jsonNames.testTime] = new Date().toLocaleString();
                json.fixtures.find(fixt => fixt.name === this.currentFixtureName).tests.push(data);
            }
            else if (field) json[field] = data;
            return this.writeToJson(json);
        },

        /**
     * @param {number} id 
     * @param {{name: string, value: any} | {name: string, value: any}[]} properties 
     */
        setTestProperties (id, properties) {
            const json = this.getJsonAsObject();
            const fixtures = json.fixtures;
            const tests = fixtures.find(fixt => fixt.name === this.currentFixtureName).tests;

            if (!properties.length) properties = [properties];

            for (const {
                name,
                value
            } of properties) {
                tests.find(test => test.id === id)[name] = value;
                this.writeToJson(json);
            }
        },

        getTestStatus (id) {
            const json = this.getJsonAsObject();
            const fixtures = json.fixtures;
            const tests = fixtures.find(fixt => fixt.name === this.currentFixtureName).tests;

            return tests.find(test => test.id === id).status;
        },

        setTestStatus (id, status, brokenMessage, isForceBroken) {
            if (this.isForceBroken) {
                if (this.getTestStatus(id) !== this.testStatuses.broken) this.isForceBroken = false;
                else return;
            }

            if (status === this.testStatuses.failed || this.getTestStatus(id) !== this.testStatuses.broken) {
                if (status === null) {
                    try {
                        throw new Error(brokenMessage);
                    }
                    catch (ex) {
                        this.warnError = ex;
                    }
                }
                this.setTestProperties(id, {
                    name:  this.reportUtil.jsonNames.testStatus,
                    value: status === null ? this.testStatuses.broken : status
                });
            }

            this.isForceBroken = isForceBroken;
        },

        logBorder (info) {
            console.log(this.chalk[this.chalkStyles.borderLine](`-------------------------------------------${info ? this.chalk[this.chalkStyles.borderText](info) : ''}-------------------------------------------`));
        },

        addTestInfo (testName, testStatus, screenPath, userAgent, durationMs, stackTrace) {
            this.setTestStatus(this.getId(testName), testStatus);
            this.setTestProperties(this.getId(testName), [{
                name:  this.reportUtil.jsonNames.screenshotOnFail,
                value: screenPath
            }, {
                name:  this.reportUtil.jsonNames.testUserAgents,
                value: userAgent
            }, {
                name:  this.reportUtil.jsonNames.testDuration,
                value: durationMs
            }, {
                name:  this.reportUtil.jsonNames.testStackTrace,
                value: stackTrace
            }]);
        },

        addStep (id, message) {
            const json = this.getJsonAsObject();
            const fixtures = json.fixtures;
            const tests = fixtures.find(fixt => fixt.name === this.currentFixtureName).tests;

            id = id ? id : this.getId();
            tests.find(test => test.id === id).steps.push(this.reportUtil.jsonNames.baseStepContent(message));
            this.writeToJson(json);
        },

        addStepInfo (id, message) {
            const json = this.getJsonAsObject();
            const fixtures = json.fixtures;
            const tests = fixtures.find(fixt => fixt.name === this.currentFixtureName).tests;

            id = id ? id : this.getId();
            
            const steps = tests.find(test => test.id === id).steps;

            if (!steps.length) {
                this.addStep(id, '');
                this.addStepInfo(id, message);
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
      
                if (err.errMsg) errName = err.errMsg; 
                else if (err.message) errName = err.message; 
                else if (err.code) {
                    const errorsTypes = require('testcafe/lib/errors/types');
                    const errorMsgs = require('testcafe/lib/errors/test-run/templates');
                    const runtimeKey = Object.keys(errorsTypes.RUNTIME_ERRORS).find(key => errorsTypes.RUNTIME_ERRORS[key] === err.code);
                    const testRunKey = Object.keys(errorsTypes.TEST_RUN_ERRORS).find(key => errorsTypes.TEST_RUN_ERRORS[key] === err.code);

                    errName = runtimeKey ? runtimeKey : testRunKey;
                  
                    if (errorMsgs[err.code]) errName += `: ${errorMsgs[err.code](err)}`;
                    else {
                        if (err.apiFnChain) errName += `: ${err.apiFnChain.join ? err.apiFnChain.join('') : err.apiFnChain}`;
                        if (err.filePaths) errName += `(Files: ${err.filePaths.join ? err.filePaths.join('') : err.filePaths})`;      
                    }
                    errName = errName.trim().replace(/\n{2,}/g, '\n');
                }
                else errName = 'Unknown error';
      
                stackTrace.push([]);
      
                const filterArr = ['node:internal', 'node_modules', 'process._tickCallback', '__awaiter'];
                const isMessageSuite = (msg) => filterArr.every(f => !msg.includes(f)) && msg.includes(':');

                stackTrace[index].push(errName);

                if (errs[index].stack) {
                    const stackArr = errs[index].stack.split('\n').slice(1);

                    for (const stackStr of stackArr) 
                        if (isMessageSuite(stackStr)) stackTrace[index].push(stackStr);
          
                }
                else if (errs[index].callsite) {
                    errs[index].callsite.stackFrames.forEach(stackFrame => {
                        const msg = stackFrame.toString();

                        if (isMessageSuite(msg)) stackTrace[index].push(msg);
                    });
      
                    const errorFile = errs[index].callsite.filename + ':' + (errs[index].callsite.lineNum + 1);

                    if (!stackTrace[index][1].includes(errorFile)) stackTrace[index].splice(1, 0, errorFile);
      
                }
                else stackTrace[index].push(...errName.split('\n'));
            }
      
            return stackTrace;
        },
      
        getStartArgObject () {
            const obj = { odd: [] };
            const args = process.argv.slice(2);

            for (let i = 0; i < args.length; i++) {
                const arg = args[i];
                const argNameReg = /^--?(.*?)(=|$)/;
                const argName = argNameReg.exec(arg);

                if (argName) {
                    const argValue = /.+=(.*)$/.exec(arg);

                    if (argValue) obj[argName[1]] = argValue[1];
                    else if (args[i + 1] && !argNameReg.exec(args[i + 1])) {
                        obj[argName[1]] = args[i + 1];
                        i++;
                    }
                    else obj[argName[1]] = true;
                }
                else obj.odd.push(arg);
            }
            return obj;
        },

        parseStartArguments () {
            const args = this.getStartArgObject();
            const reportFileArg = args.reportFile ? args.reportFile : '';
            const base64screens = args.base64screens;

            this.appendLogs = args.appendLogs;
            this.logWarnings = args.logWarnings;
            if (base64screens) this.isScreensAsBase64 = true;

            if (reportFileArg) {
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

        createReportPath (path) {
            path = path ? path : this.reportUtil.getReportPath();
            if (!this.fs.existsSync(path)) {
                this.fs.mkdirSync(path, {
                    recursive: true
                });
            }  
        },

        getMaxTestId () {
            try {
                const testIds = this.getJsonAsObject().fixtures.map(fixture => fixture.tests.map(test => test.id)).flat();

                return Math.max(maxTestId, ...testIds) + 1;
            }
            catch {
                return maxTestId;
            }
        },

        prepareResultFile () {
            try {
                if (!this.appendLogs) this.fs.unlinkSync(this.getResultFileName());
                else if (this.fs.existsSync(this.getResultFileName())) 
                    maxTestId = this.getMaxTestId();
            }
            catch {
            /*file doesn't exist*/
            }  
        },

        parseAgents (userAgents) {
            if (typeof userAgents === 'object') {
                if (userAgents.every) {
                    if (userAgents.every(el => el === userAgents[0])) {
                        this.userAgent = userAgents[0];
                        if (userAgents.length > 1) this.userAgent += ` (${userAgents.length} browser(-s))`;
                    }
                    else {
                        const set = userAgents.filter((val, index) => !userAgents.slice(index + 1).find(el => el === val));

                        for (const item of set) {
                            const browsersC = userAgents.filter(el => el === item).length;

                            this.userAgent += item;
                            if (browsersC > 1) this.userAgent += ` (${browsersC} browser(-s))`;
                        }
                    }
                }
                else this.userAgent = userAgents;
            }
            else this.userAgent = userAgents;
        },

        reportTaskStart (startTime, userAgents, testsCount) {
            try {
                const time = this.moment(startTime).format('YYYY/MM/DD HH:mm:ss');

                this.reportUtil.startTime = new Date(startTime);
                require('./Logger').__reporters.push(this);
                this.parseStartArguments();
                this.createReportPath();
                this.prepareResultFile();
                this.parseAgents(userAgents);

                this.testsCount = testsCount;
                this.taskStartTime = startTime;
                this.logBorder('Task start');
                console.log(`Tests run${this.getTestRunId()}: ${testsCount} on ${this.userAgent}`);
                console.log(`Start time: ${time}`);
                this.logBorder();
                if (this.appendLogs && !this.fs.existsSync(this.getResultFileName()) || !this.appendLogs) this.writeToReportOnStart(time, this.reportUtil.jsonNames.startTime);
            }
            catch (err) {
                console.log(err.message ? err.message : err.msg);
            }
        },

        reportFixtureStart (name) {
            try {
                this.currentFixtureName = name;
                this.logBorder('Fixture start');
                console.log(`Fixture started${this.getTestRunId()}: ${name}`);
                this.writeToReportOnStart(this.reportUtil.jsonNames.baseFixtureContent(name), this.reportUtil.jsonNames.fixture);
            }
            catch (err) {
                console.log(err.message ? err.message : err.msg);
            }
        },

        reportTestStart (name) {
            try {
                this.warnError = null;
                this.testName = name;
                this.testStartTime = new Date().valueOf();
                const time = this.moment(this.testStartTime).format('M/DD/YYYY HH:mm:ss');
                const id = this.getMaxTestId();

                this.testsInfo.push({
                    id,
                    name,
                    fixture: this.currentFixtureName
                });
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
                const errorsCount = testRunInfo.errs.length;
                const hasErr = !!errorsCount || !!this.warnError;
                const screenPath = hasErr && testRunInfo.screenshots && testRunInfo.screenshots.length ? (testRunInfo.screenshots[testRunInfo.screenshots.length - errorsCount] ?? testRunInfo.screenshots[0]).screenshotPath : null;
                const stackTrace = hasErr ? this.getStackTraceAsStringsArray(errorsCount ? testRunInfo.errs : [this.warnError]) : [];
                const duration = this.moment.duration(testRunInfo.durationMs).format('h[h] mm[m] ss[s]');

                let result = hasErr ? this.testStatuses.failed : this.testStatuses.passed;
                const testId = this.getId(name);
                const testAgent = testRunInfo?.browsers?.map(b => b.prettyUserAgent)?.join();

                if (this.isScreensAsBase64 && screenPath) {
                    try {
                        const bitmap = this.fs.readFileSync(screenPath);
                        const base64 = Buffer.from(bitmap).toString('base64');
                        var base64screenshot = `data:image/png;base64,${base64}`;
                    }
                    catch { 
                        //skip and continue
                    }
                }

                if (this.getTestStatus(testId) === this.testStatuses.broken && !errorsCount) {
                    result = this.testStatuses.broken;
                    this.brokenCount++;
                }
                const chalkColor = this.chalkStyles[result];

                this.logBorder(`Test ${testId} done`);
                console.log(`Duration: ${duration}`);

                if (testRunInfo.skipped) {
                    this.skippedCount++;
                    this.testsCount++;
                    console.log(this.chalk[this.chalkStyles.skipped](`Test skipped: ${this.currentFixtureName} - ${name}`));
                }
                else {
                    let msg = this.chalk[chalkColor](`Test ${result}: ${this.currentFixtureName} - ${name}\n`);

                    for (const error of stackTrace) {
                        for (let index = 0; index < error.length; index++) {
                            msg += 
                            (result === this.testStatuses.broken ? this.chalk[this.chalkStyles.broken] : this.chalk.rgb(...this.chalkStyles.stackTrace))(' '.repeat(index) + error[index] + '\n');
                        }
                    }

                    if (screenPath) msg += this.chalk[this.chalkStyles.screenPath](`Screenshot: ${screenPath}`);
                    console.log(msg);
                }

                this.logBorder();
                this.addTestInfo(name, testRunInfo.skipped ? this.testStatuses.skipped : result, base64screenshot ? base64screenshot : screenPath, testAgent ? testAgent : this.userAgent, duration, stackTrace);
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
                const path = require('path');
                const reportPath = `${this.reportUtil.getReportPath()}/${this.reportUtil.singleHtmlFileName}`;

                passed -= this.brokenCount;

                let summary = this.chalk[this.chalkStyles.passed](`${passed}/${this.testsCount} ${this.testStatuses.passed}`);

                if (this.brokenCount) 
                    summary += ', ' + this.chalk[this.chalkStyles.broken](`${this.brokenCount}/${this.testsCount} ${this.testStatuses.broken}`); 
                    
                const failedCount = this.testsCount - passed - this.skippedCount - this.brokenCount;

                if (failedCount)
                    summary +=  ', ' + this.chalk[this.chalkStyles.failed](`${failedCount}/${this.testsCount} ${this.testStatuses.failed}`);
                    
                if (this.skippedCount) 
                    summary +=  ', ' + this.chalk[this.chalkStyles.skipped](`${this.skippedCount}/${this.testsCount} ${this.testStatuses.skipped}`);

                this.logBorder('Task done');
                console.log(`Test run${this.getTestRunId()} finished: ${time}`);
                console.log(`Duration: ${durationStr}`);
                console.log(`Run results: ${summary}`);
                if (this.logWarnings && warnings.length) console.log(warnings);
                require('child_process').execSync(`npx acd-html-combine ${this.reportUtil.testResultsPath} --dest ${reportPath} --last ${this.getResultFileName()} ${this.appendLogs ? '' : '--single'}`);
                console.log(this.chalk[this.chalkStyles.report](`Test report generated: ${path.resolve(reportPath)}`));
            }
            catch (err) {
                console.log(err.message ? err.message : err.msg);
            }
        }

    };
};
