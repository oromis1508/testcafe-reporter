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
const v138Replaced = `const _runningTests = {};
const runningTests = new Proxy(_runningTests, {
    set: function (target, key, value) {
        if(value.ctx && value?.test?.name) {
            try {
                const tests = Object.values(target);
                const theSameRunId = tests.find(t => t.testRunCtx === value.testRunCtx);
                const reporters = require('testcafe-reporter-acd-html-reporter/lib/Logger').__reporters;
                value.ctx.runId = theSameRunId ? theSameRunId.ctx.runId : Math.max(-1, ...tests.map(t => t.ctx.runId)) + 1;

                value.ctx.testId = reporters.length ? reporters[value.ctx.runId].getId(value.test.name) : value.id;
            } catch {/*ignore*/}
        }

        target[key] = value;
        return value;
    }
});`;
const v139Replaced = `const _runningTests = {};
const runningTests = new Proxy(_runningTests, {
    set: function (target, key, value) {
        if(value.ctx && value?.test?.name) {
            try {
                const tests = Object.values(target);
                const reporters = require('testcafe-reporter-acd-html-reporter/lib/Logger').__reporters;
                
                value.ctx.runId = typeof value.testRunCtx?.runId === 'number' ? value.testRunCtx.runId : Math.max(-1, ...tests.map(t => t.ctx.runId)) + 1;
                value.testRunCtx.runId = value.ctx.runId;

                const report = reporters[value.ctx.runId];

                value.ctx.testId = reporters.length ? report.getId(value.test.name) : value.id;
                report.addStep(value.ctx.testId, 'Url: ' + value?.test?.pageUrl);
            } catch {/*ignore*/}
        }

        target[key] = value;
        return value;
    }
});`;
const v1312Replaced = `const _runningTests = {};
const runningTests = new Proxy(_runningTests, {
    set: function (target, key, value) {
        if(value.ctx && value?.test?.name) {
            try {
                const tests = Object.values(target);
                const reporters = require('testcafe-reporter-acd-html-reporter/lib/Logger').__reporters;
                
                value.ctx.runId = typeof value.testRunCtx?.runId === 'number' ? value.testRunCtx.runId : Math.max(-1, ...tests.map(t => t.ctx.runId)) + 1;
                value.testRunCtx.runId = value.ctx.runId;

                let report = reporters[value.ctx.runId];

                value.ctx.testId = reporters.length ? report.getId(value.test.name) : value.id;
                if(value.ctx.testId === undefined) {
                    report = reporters.find(rep => rep.getId(value.test.name) !== undefined);
                    value.ctx.testId = report.getId(value.test.name);
                }

                report.addStep(value.ctx.testId, 'Url: ' + value?.test?.pageUrl);
            } catch (err) {console.log(err)}
        }

        target[key] = value;
        return value;
    }
});`;
const v1313Replaced = `const _runningTests = {};
const runningTests = new Proxy(_runningTests, {
    set: function (target, key, value) {
        if(value.ctx && value?.test?.name) {
            try {
                const tests = Object.values(target);
                const reporters = require('testcafe-reporter-acd-html-reporter/lib/Logger').__reporters;
                
                value.ctx.runId = typeof value.testRunCtx?.runId === 'number' ? value.testRunCtx.runId : Math.max(-1, ...tests.map(t => t.ctx.runId)) + 1;
                value.testRunCtx.runId = value.ctx.runId;

                let report = reporters[value.ctx.runId];

                value.ctx.testId = reporters.length ? report.getId(value.test.name) : value.id;
                if(value.ctx.testId === undefined) {
                    report = reporters.find(rep => rep.getId(value.test.name) !== undefined);
                    value.ctx.testId = report.getId(value.test.name);
                }
                if(value.ctx.testId === undefined) {
                    console.log("Cur test: " + value.test.name);
                    reporters.forEach(rep => console.log(JSON.stringify(rep.testsInfo)));
                }

                report.addStep(value.ctx.testId, 'Url: ' + value?.test?.pageUrl);
            } catch (err) {console.log(err)}
        }

        target[key] = value;
        return value;
    }
});`;
const v1314Replaced = `const _runningTests = {};
const runningTests = new Proxy(_runningTests, {
    set: function (target, key, value) {
        if(value.ctx && value?.test?.name) {
            try {
                const tests = Object.values(target);
                const reporters = require('testcafe-reporter-acd-html-reporter/lib/Logger').__reporters;
                
                value.ctx.runId = typeof value.testRunCtx?.runId === 'number' ? value.testRunCtx.runId : 
                    reporters.findIndex(rep => rep.getId(value.test.name) !== undefined);
                value.testRunCtx.runId = value.ctx.runId;

                let report = reporters[value.ctx.runId];

                value.ctx.testId = reporters.length ? report.getId(value.test.name) : value.id;

                report?.addStep(value.ctx.testId, 'Url: ' + value?.test?.pageUrl);
            } catch (err) {console.log(err)}
        }

        target[key] = value;
        return value;
    }
});`;
const oldVersions = [
    testInfoObj,
    testInfoObjReplaced,
    v137Replaced,
    v138Replaced,
    v139Replaced,
    v1312Replaced,
    v1313Replaced,
];

if (oldVersions.some((v) => testsContent.includes(v))) {
    fs.writeFileSync(
        testsFile,
        oldVersions.reduce(
            (val, ver) => val.replace(ver, v1314Replaced),
            testsContent
        )
    );
}

const concurencyBlockFile = 'node_modules/testcafe/lib/runner/browser-job.js';
const concurencyContent = fs.readFileSync(concurencyBlockFile).toLocaleString();
const concurencyBlockStr =
    'isBlocked || (hasIncompleteTestRuns || needWaitLastTestInFixture) && !isConcurrency';
const concurencyBlockReplace =
    'isBlocked || (hasIncompleteTestRuns && needWaitLastTestInFixture)';

const featureCheckText =
    'this._reportsPending.some(controller => controller.test.fixture !== testRunController.test.fixture)';
const featureCheckReplace =
    'this._reportsPending.some(controller => controller.test.fixture.name !== testRunController.test.fixture.name)';

if (
    concurencyContent.includes(concurencyBlockStr) ||
    concurencyContent.includes(featureCheckText)
) {
    fs.writeFileSync(
        concurencyBlockFile,
        concurencyContent
            .replace(concurencyBlockStr, concurencyBlockReplace)
            .replace(featureCheckText, featureCheckReplace)
    );
}
