export class Logger {
    private static testsResultsFile = require('./jsonToHtml').getResultFileName();
    private static fs = require('fs');

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
        const json = JSON.parse(this.fs.readFileSync(this.testsResultsFile).toLocaleString());

        console.log(`${this.getCurrentDateTime()} --- ${message}`);

        const fixtures = json.fixtures;
        const tests = json.fixtures[fixtures.length - 1].tests;
        const steps = json.fixtures[fixtures.length - 1].tests[tests.length - 1].steps;
        
        if(isStep) {
            json.fixtures[fixtures.length - 1].tests[tests.length - 1].steps.push({name: message, actions: []});
        } else {
            json.fixtures[fixtures.length - 1].tests[tests.length - 1].steps[steps.length - 1].actions.push(message);
        }

        this.fs.writeFileSync(this.testsResultsFile, JSON.stringify(json));
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
        require('./index')().setTestStatus('broken');
    }
}
