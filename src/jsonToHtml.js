var stepsArray = [];

module.exports = {
    getResultFileName: function () {
        const curDate = new Date();
        const month = curDate.getMonth() + 1 < 10 ? `0${curDate.getMonth() + 1}` : curDate.getMonth() + 1;
        
        return `testResults_${curDate.getDate()}.${month}.json`;
    },

    generateReport: function () {
        const fs = require('fs');
        const json = JSON.parse(fs.readFileSync(this.getResultFileName()).toLocaleString());
        const html = fs.readFileSync('src/report/index.html').toLocaleString();
        const generatedReport = html.replace('<div class="content"></div>', `<div class="content">${this.getJsonAsHtml(json)}</div>`);
        const curDate = new Date();
        const month = curDate.getMonth() + 1 < 10 ? `0${curDate.getMonth() + 1}` : curDate.getMonth() + 1;
        const newReportDir = `report_${curDate.getDate()}.${month}`;
        
        var copydir = require('copy-dir');
 
        copydir.sync('src/report', newReportDir, {
            utimes: true,

            mode: true,
            
            cover: true
        });

        fs.writeFileSync(`${newReportDir}/index.html`, generatedReport);
    },

    getJsonAsHtml: function (json) {
        let generatedReport = `<input type="datetime-local" value="${json.startTime}" disabled="true">`;
        
        generatedReport += '<div class="fixtures"><table><tbody>';
        json.fixtures.forEach(fixture => {
            generatedReport += `<tr class="fixture"><td class="fixtureName" onmouseover="onFixtureHover(this)" onmouseleave="onFixtureLeave(this)" onclick="onFixtureClick(this)">${fixture.name}</td>`;
            generatedReport += '<td>';
            fixture.tests.forEach(test => {
                generatedReport += `<div class="test" status="${test.status}" onclick="testOnClick(this)">${test.name}</div>`;
                stepsArray.push({
                    fixture: fixture.name,

                    test: test.name,

                    steps: this.stepsToString(test.steps)
                });
            });
            generatedReport += '</td></tr>';
        }); 
        stepsArray.forEach(stepsData => {
            generatedReport += stepsData.steps.replace('<tr>', 
                `<tr fixture="${stepsData.fixture}" test="${stepsData.test}">`);
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
