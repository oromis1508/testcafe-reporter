var stepsData = [];

/* eslint-disable no-unused-vars */

function onLoad () {
    if (stepsData.length === 0) {
        this.document.querySelectorAll('div[fixtureId]').forEach(el => {
            stepsData.push({
                id: el.getAttribute('fixtureId'),

                steps: el.outerHTML,

                screenshot: el.getAttribute('screenshot'),

                durationMs: el.getAttribute('durationMs'),

                userAgent: el.getAttribute('userAgent'),

                stackTrace: '',

                time: el.getAttribute('time'),

                t: el.getAttribute('t'),

                f: el.getAttribute('f'),
            });
        });
        
        for (let index = 0; index < stepsData.length; index++) {
            const stackTraceElement = this.document.querySelector(`div[traceId='${stepsData[index].id}']`);
            
            if (stackTraceElement) {
                try {
                    stepsData[index].stackTrace = JSON.parse(stackTraceElement.textContent);
                }
                catch (e) {
                    console.log(`Error of parsing ${stackTraceElement.textContent} as JSON`);
                }
            }
        }
    }
    this.addSummary();
    this.addFixtureSummary();
    this.addSearchByFixtureListeners();
    this.document.querySelector('select').onchange = this.selectOnSelect;
}

/* eslint-enable no-unused-vars */

if (this.window.onload) 
    this.window.onload += onLoad;
else
    this.window.onload = onLoad;
