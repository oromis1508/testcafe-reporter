var stepsData = [];

/* eslint-disable no-unused-vars */

function onLoad () {
    if (stepsData.length === 0) {
        this.document.querySelectorAll('div[fixture]').forEach(el => {
            stepsData.push({
                fixture: el.getAttribute('fixture'),

                test: el.getAttribute('test'),

                steps: el.outerHTML,

                screenshot: el.getAttribute('screenshot'),

                durationMs: el.getAttribute('durationMs'),

                userAgent: el.getAttribute('userAgent'),

                stackTrace: ''
            });
            el.remove();
        });
        
        for (let index = 0; index < stepsData.length; index++) {
            const stackTraceElement = this.document.querySelector(`div[traceFixture='${stepsData[index].fixture}'][traceTest='${stepsData[index].test}']`);
            
            if (stackTraceElement) {
                stepsData[index].stackTrace = JSON.parse(stackTraceElement.textContent);
                stackTraceElement.remove();
            }
        }
    }
    this.addSummary();
    this.addFixtureSummary();
    this.addSearchByFixtureListeners();
}

/* eslint-enable no-unused-vars */

if (this.window.onload) 
    this.window.onload += onLoad;
else
    this.window.onload = onLoad;
