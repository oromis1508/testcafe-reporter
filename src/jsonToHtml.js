var stepsArray = [];

// var ad = {
module.exports = {
    getFormattedDate: function () {
        const curDate = new Date();
        const month = curDate.getMonth() + 1 < 10 ? `0${curDate.getMonth() + 1}` : curDate.getMonth() + 1;
        
        return `${curDate.getDate()}.${month}`;
    },

    getResultFileName: function () {       
        return `test-results/report_${this.getFormattedDate()}.json`;
    },

    getReportPath: function () {        
        return `test-results/report_${this.getFormattedDate()}`;
    },

    generateReport: function () {
        const fs = require('fs');
        const copydir = require('copy-dir');
        const json = JSON.parse(fs.readFileSync(this.getResultFileName()).toLocaleString());
        const newReportDir = this.getReportPath();

        let originalReportPath = 'src/report';

        if (!fs.existsSync(originalReportPath))
            originalReportPath = 'node_modules/testcafe-reporter-acd-html-reporter/lib/report';
        
        copydir.sync(originalReportPath, newReportDir, {
            utimes: true,

            mode: true,

            cover: true
        });
        
        const html = fs.readFileSync(`${newReportDir}/index.html`).toLocaleString();
        const generatedReport = html.replace('<div class="content"></div>', `<div class="content">${this.getJsonAsHtml(json)}</div>`);

        fs.writeFileSync(`${newReportDir}/index.html`, generatedReport);
    },

    getJsonAsHtml: function (json) {
        let generatedReport = `<input type="datetime-local" value="${json.startTime}" disabled="true">`;
        
        generatedReport += '<div class="fixtures"><table><tbody>';
        json.fixtures.forEach(fixture => {
            generatedReport += `<tr class="fixture"><td class="fixtureName" onmouseover="onFixtureHover(this)" onmouseleave="onFixtureLeave(this)" onclick="onFixtureClick(this)">${fixture.name}</td>`;
            generatedReport += '<td class="tests">';
            fixture.tests.forEach(test => {
                generatedReport += `<div class="test" status="${test.status}" onclick="testOnClick(this)">${test.name}</div>`;
                stepsArray.push({
                    fixture: fixture.name,

                    test: test.name,

                    steps: this.stepsToString(test.steps),

                    screenshot: test.screenshot ? test.screenshot : ''
                });
            });
            generatedReport += '</td></tr>';
        }); 
        stepsArray.forEach(stepsData => {
            generatedReport += stepsData.steps.replace('<tr>', 
                `<tr fixture="${stepsData.fixture}" test="${stepsData.test}" screenshot="${stepsData.screenshot}">`);
        });
        return generatedReport + '</tbody></table></div>';
    },


    stepsToString: function (steps) {
        let stepsString = '<tr><td>';

        steps.forEach(step => {

            stepsString += `<div class="step"><div class="stepName">${step.name}</div>`;
            step.actions.forEach(action => {
                stepsString += `<div class="subStep">${action}</div>`;
            });
            stepsString += '</div>';
        });
        return stepsString + '</td></tr>';
    }
};

// ad.generateReport();
