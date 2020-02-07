var stepsData = [];

/* eslint-disable no-unused-vars */

function onLoad () {
    if (stepsData.length === 0) {
        this.document.querySelectorAll('div[fixture]').forEach(el => {
            stepsData.push({
                fixture: el.getAttribute('fixture'),

                test: el.getAttribute('test'),

                steps: el.outerHTML,

                screenshot: el.getAttribute('screenshot')
            });
            el.remove();
        });    
    }
    this.addSummary();
    this.addFixtureSummary();
}

/* eslint-enable no-unused-vars */

if (this.window.onload) 
    this.window.onload += onLoad;
else
    this.window.onload = onLoad;
