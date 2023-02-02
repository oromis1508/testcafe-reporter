const fs = require('fs');

const testsFile = 'node_modules/testcafe/lib/utils/handle-errors.js';
const testsContent = fs.readFileSync(testsFile).toLocaleString();
const testInfoObj = 'const runningTests = {};';
const testInfoObjReplaced = `const _runningTests = {};
const runningTests = new Proxy(_runningTests, {
    set: function (target, key, value) {
        if(value.ctx && value?.test?.name) {
            try {
                value.ctx.testId = require('testcafe-reporter-acd-html-reporter/lib/Logger').__reporter.obj.getId(value.test.name);    
            } catch (err) {/*ignore*/}
        }
        target[key] = value;
        return value;
    }
});`;

if (testsContent.includes(testInfoObj)) fs.writeFileSync(testsFile, testsContent.replace(testInfoObj, testInfoObjReplaced));

const concurencyBlockFile = 'node_modules/testcafe/lib/runner/browser-job.js';
const concurencyContent = fs.readFileSync(concurencyBlockFile).toLocaleString();
const concurencyBlockStr = 'isBlocked || (hasIncompleteTestRuns || needWaitLastTestInFixture) && !isConcurrency';
const concurencyBlockReplace = 'isBlocked || (hasIncompleteTestRuns && needWaitLastTestInFixture)';

if (concurencyContent.includes(concurencyBlockStr)) fs.writeFileSync(concurencyBlockFile, concurencyContent.replace(concurencyBlockStr, concurencyBlockReplace));
