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
const v137Replaced = `const _runningTests = {};
const runningTests = new Proxy(_runningTests, {
    set: function (target, key, value) {
        if(value.ctx && value?.test?.name) {
            try {
                const tests = Object.values(target);
                const theSameRunId = tests.find(t => t.testRunCtx === value.testRunCtx);

                value.ctx.runId = theSameRunId ? theSameRunId.ctx.runId : Math.max(-1, ...tests.map(t => t.ctx.runId)) + 1;
                value.ctx.testId = require('testcafe-reporter-acd-html-reporter/lib/Logger').__reporters[value.ctx.runId].getId(value.test.name);    
            } catch (err) {/*ignore*/}
        }
        target[key] = value;
        return value;
    }
});`;

if (testsContent.includes(testInfoObj) || testsContent.includes(testInfoObjReplaced)) fs.writeFileSync(testsFile, testsContent.replace(testInfoObj, v137Replaced).replace(testInfoObjReplaced, v137Replaced));

const concurencyBlockFile = 'node_modules/testcafe/lib/runner/browser-job.js';
const concurencyContent = fs.readFileSync(concurencyBlockFile).toLocaleString();
const concurencyBlockStr = 'isBlocked || (hasIncompleteTestRuns || needWaitLastTestInFixture) && !isConcurrency';
const concurencyBlockReplace = 'isBlocked || (hasIncompleteTestRuns && needWaitLastTestInFixture)';

const featureCheckText = 'this._reportsPending.some(controller => controller.test.fixture !== testRunController.test.fixture)';
const featureCheckReplace = 'this._reportsPending.some(controller => controller.test.fixture.name !== testRunController.test.fixture.name)';

if (concurencyContent.includes(concurencyBlockStr) || concurencyContent.includes(featureCheckText)) 
    fs.writeFileSync(concurencyBlockFile, concurencyContent.replace(concurencyBlockStr, concurencyBlockReplace).replace(featureCheckText, featureCheckReplace));
