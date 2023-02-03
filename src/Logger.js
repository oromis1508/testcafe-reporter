/* eslint-disable-next-line prefer-const */
let __reporter = {};

const getCurrentDateTime = function (dateSeparator = '/', timeSeparator = ':', dateTimeSeparator = '|--|') {
    const currentdate = new Date();

    return currentdate.getDate() + dateSeparator + (currentdate.getMonth() + 1) + dateSeparator + currentdate.getFullYear() + dateTimeSeparator + currentdate.getHours() + timeSeparator + currentdate.getMinutes() + timeSeparator + currentdate.getSeconds();
};

const log = function (message, isStep, isBroken) {
    const ctx = require('testcafe').t.ctx;

    try {
        if (console.isReportUsed) {
            __reporter.obj[isStep ? 'addStep' : 'addStepInfo'](ctx.testId, message);

            if (isBroken) __reporter.obj.setTestStatus(ctx.testId, null);
        }
    }
    catch (err) {
        console.log(err.message ?? err.msg);
    }
    finally {
        const testRunId = this.__reporter.obj.appendLogs ? `${this.__reporter.obj.testRunId}/` : '';

        console.log(`${getCurrentDateTime()} ---- ${testRunId}${ctx.testId} ---- ${message}`);
    }
};

class Logger {
    static step (stepNum, message) {
        stepNum = typeof stepNum === 'number' ? stepNum : `${stepNum[0]}-${stepNum[stepNum.length - 1]}`;
        log(`Step ${stepNum}: ${message}`, true);
    }

    static info (message) {
        log(`INFO --- ${message}`, false);
    }

    static preconditions () {
        log('Preconditions', true);
    }

    static cleanUp () {
        log('Clean up', true);
    }

    static warn (message) {
        log(`WARN --- : ${message}`, false, true);
    }
}

module.exports = {
    Logger,
    __reporter
};
