const fs = require('fs');
const testsFile = 'node_modules/testcafe/lib/utils/handle-errors.js';
const content = fs.readFileSync(testsFile).toLocaleString();

const testInfoObj = 'const runningTests = {};';
const testInfoObjReplaced = `const _runningTests = {};
const runningTests = new Proxy(_runningTests, {
    set: function (target, key, value) {
        if(value.ctx && value?.test?.name) {
            value.ctx.testName = value?.test?.name;
            value.ctx.fixtureName = value?.test?.fixture?.name;
            try {
                value.ctx.id = require('testcafe-reporter-acd-html-reporter/lib/Logger').__reporter.obj.getId(value.ctx.testName);    
            } catch (err) {/*ignore*/}
        }
        target[key] = value;
        return true;
    }
});`;

if (content.includes(testInfoObj))
    fs.writeFileSync(testsFile, content.replace(testInfoObj, testInfoObjReplaced));
