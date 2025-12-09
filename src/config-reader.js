const ConfigFileName = 'areport-config.json';
const TestStatuses = {
    passed:  'passed', 
    failed:  'failed',
    broken:  'broken',   
    skipped: 'skipped' 
};
const DefaultExcelColumns = [
    'Fixture',
    'TestName',
    'Status',
    'Error1',
    'Error2',
    'ChangedLast2',
    'ChangedLast3',
    'IsLastWithoutStatus',
];
const DefaultConfig = {
    _info: 'This property is ignored. All properties names, statuses names and columns names can\'t be changed. Only can be changed count and/or order of them. Colors are only in hex style with ARGB format',
    excel: {
        disable:           false,
        showStatuses:      [TestStatuses.passed, TestStatuses.failed, TestStatuses.broken, TestStatuses.skipped],
        showColumns:       DefaultExcelColumns,
        useErrorsWrapText: false,
        fillColors:        {
            passed: 'FFCCFFCC',
            failed: {
                same2runs:      'FFFF9999',
                same3runs:      'FFFFCCCC',
                diffentResults: 'FFFF6666'
            },
            broken:      'FFFFFF99',
            skipped:     'FFDDDDDD',
            emptyStatus: 'FFFFFFFF'
        }
    },
    html: {
        keepFullCount:  3,
        days:           14,
        reportFile:     true,
        reportFileName: 'report.html',
        base64screens:  true,
    },
    appendLogs:  true,
    logWarnings: false
};
const fs = require('fs');
const path = require('path');
const configPath = path.join(process.cwd(), ConfigFileName);
/** @type {typeof DefaultConfig} */
const CurrentConfig = (() => {
    if (fs.existsSync(configPath)) {
        try {
            const current = JSON.parse(fs.readFileSync(configPath));

            applyDefaultsToConfig(current, DefaultConfig);
            checkColorsCorrect(current);
            return current;
        }
        catch (err) {
            console.log('Error of reading reporter config: ' + err);
        }
    }
    return DefaultConfig;
})();

function applyDefaultsToConfig (target, defaults) {
    for (const [key, defValue] of Object.entries(defaults)) {

        const hasKey = Object.prototype.hasOwnProperty.call(target, key);
        const curValue = target[key];

        // Если ключ отсутствует — просто ставим дефолт
        if (!hasKey) {
            target[key] = defValue;
            continue;
        }

        // Если типы отличаются → заменяем дефолтом
        if (typeof curValue !== typeof defValue) {
            target[key] = defValue;
            continue;
        }

        // Если это объект (не null, не массив) → рекурсивно
        if (
            defValue &&
      typeof defValue === 'object' &&
      !Array.isArray(defValue)
        ) {
            // если target[key] не объект — заменяем
            if (!curValue || typeof curValue !== 'object' || Array.isArray(curValue)) 
                target[key] = {};
            

            applyDefaultsToConfig(target[key], defValue);
            continue;
        }

        // Для массивов — если тип совпадает, но target[key] не массив → заменяем на default
        if (Array.isArray(defValue)) {
            if (!Array.isArray(curValue)) 
                target[key] = defValue;
            
            continue;
        }

    // Примитивы — всё ок, ничего делать не нужно
    }

    return target;
}

/**
 * 
 * @param {typeof DefaultConfig} target 
 */
function checkColorsCorrect (target) {
    replaceObjectColors(target.excel.fillColors);
    replaceObjectColors(target.excel.fillColors.failed);
}

function replaceObjectColors (obj) {
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' && value.length !== 8) 
            obj[key] = DefaultConfig.excel.fillColors[key];
    }
}
module.exports = {
    ConfigFileName,
    TestStatuses,
    DefaultConfig,
    CurrentConfig,
    DefaultExcelColumns
};
