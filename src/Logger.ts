export class Logger {
    private static reporter = require('../lib/index')();

    private static getCurrentDateTime(dateSeparator: string = '/', timeSeparator: string = ':', dateTimeSeparator: string = '|--|'): string {
        const currentdate = new Date(); 
        return currentdate.getDate() + dateSeparator
                + (currentdate.getMonth()+1)  + dateSeparator 
                + currentdate.getFullYear() + dateTimeSeparator
                + currentdate.getHours() + timeSeparator
                + currentdate.getMinutes() + timeSeparator
                + currentdate.getSeconds();
    }

    private static log(message: string, isStep: boolean) {
        console.log(`${this.getCurrentDateTime()} --- ${message}`);

        if((<any>console).isReportUsed) this.reporter[isStep ? 'addStep' : 'addStepInfo'](message);
    }

    static step(num: number | number[], message: string) {
        let stepNum = typeof num === 'number' ? num : `${num[0]}-${num[num.length - 1]}`;
        this.log(`Step ${stepNum}: ${message}`, true);
    }

    static info(message: string) {
        this.log(`INFO --- ${message}`, false);
    }

    static preconditions() {
        this.log('Preconditions', true);
    }

    static cleanUp() {
        this.log('Clean up', true);
    }

    static warn(message: string) {
        this.log(`WARN --- : ${message}`, false);
        if((<any>console).isReportUsed) this.reporter.setTestStatus(this.reporter.testStatuses.broken);
    }
}

module.exports;
