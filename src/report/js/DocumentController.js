var stepsData = [];

/* eslint-disable no-unused-vars, no-undef */

function getRunTimeSeconds (durationMs) {
    const time = /((\d+)h )?((\d+)m )?(\d+)s/.exec(durationMs);

    if (!time) return 0;
    /* eslint-disable no-extra-parens */
    const hours = +(time[2] ?? 0) * 3600;
    const minutes = +(time[4] ?? 0) * 60;
    /* eslint-enable no-extra-parens */

    return hours + minutes + +time[5];
}

function onLoad () {
    if (stepsData.length === 0) {
        this.document.querySelectorAll('div[fixtureId]').forEach((el, index) => {
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

                status: el.getAttribute('status'),

                runtime: getRunTimeSeconds(el.getAttribute('durationMs'))
            });

            stepsData[index].stackTrace = function () {
                const stackTraceElement = document.querySelector(
                    `div[traceId='${this.id}']`
                );

                if (stackTraceElement) {
                    try {
                        JSON.parse(
                            stackTraceElement.textContent.replace(/\n/g, '').replace(/\\/g, '\\\\').replace(/="(.*?)"/g, '=\\"$1\\"')
                        );        
                    }
                    catch (e) {
                        console.log(
                            `Error of parsing ${stackTraceElement.textContent} as JSON`
                        );
                    }            
                }
            };
        });

        stepsData.sort(
            (data1, data2) =>
                new Date(data2.time).valueOf() - new Date(data1.time).valueOf()
        );
    }
    this.addSummary();
    this.addFixtureSummary();
    this.addSearchByFixtureListeners();
    this.addExpandCollapseAllFixturesListeners();
    this.addShowAsListeners();
    this.addTreeScrollListener();
    this.addSingleModeListeners();
}

/* eslint-enable no-unused-vars, no-undef */

if (this.window.onload) this.window.onload += onLoad;
else this.window.onload = onLoad;
