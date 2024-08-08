var stepsData = [];

/* eslint-disable no-unused-vars */

function getRunTimeSeconds (durationMs) {
    const time = /((\d+)h )?((\d+)m )?(\d+)s/.exec(durationMs);

    if (!time) return 0;
    const minutes = time[4] ?? 0 * 60;

    return time[2] ?? 0 * 3600 + minutes + +time[5];
}

function onLoad () {
    if (stepsData.length === 0) {
        this.document.querySelectorAll('div[fixtureId]').forEach((el) => {
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
        });

        for (let index = 0; index < stepsData.length; index++) {
            const stackTraceElement = this.document.querySelector(
                `div[traceId='${stepsData[index].id}']`
            );

            if (stackTraceElement) {
                try {
                    stepsData[index].stackTrace = JSON.parse(
                        stackTraceElement.textContent
                    );
                }
                catch (e) {
                    console.log(
                        `Error of parsing ${stackTraceElement.textContent} as JSON`
                    );
                }
            }
        }
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

/* eslint-enable no-unused-vars */

if (this.window.onload) this.window.onload += onLoad;
else this.window.onload = onLoad;
