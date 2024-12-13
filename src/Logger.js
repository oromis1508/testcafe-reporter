/* eslint-disable-next-line prefer-const */
let __reporters = [];

const getCurrentDateTime = function (dateSeparator = '/', timeSeparator = ':', dateTimeSeparator = '|--|') {
    const currentdate = new Date();

    return currentdate.getDate() + dateSeparator + (currentdate.getMonth() + 1) + dateSeparator + currentdate.getFullYear() + dateTimeSeparator + currentdate.getHours() + timeSeparator + currentdate.getMinutes() + timeSeparator + currentdate.getSeconds();
};

const warnPrefix = 'WARN --- : ';
const log = function (message, isStep, isWarn, isBroken) {
    const ctx = require('testcafe').t.ctx;
    const isReportUsed = __reporters.length && typeof ctx.runId === 'number';

    try {
        if (isReportUsed) {
            __reporters[ctx.runId][isStep ? 'addStep' : 'addStepInfo'](ctx.testId, message);

            if (isWarn) __reporters[ctx.runId].setTestStatus(ctx.testId, null, message.replace(warnPrefix, ''), isBroken);
        }
    }
    catch (err) {
        console.log(err.message ?? err.msg);
    }
    finally {
        const testRunId = isReportUsed ? `${__reporters[ctx.runId].testRunId}/` : '';

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
        log(`${warnPrefix}${message}`, false, true);
    }

    static broken (message) {
        log(`${warnPrefix}${message}`, false, true, true);
    }
}

module.exports = {
    Logger,
    __reporters
};
