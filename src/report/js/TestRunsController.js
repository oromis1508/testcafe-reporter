/* eslint-disable no-unused-vars, no-undef */

function getSelectedRun (testElement) {
    return testElement.getAttribute('selected-run');
}

function addTestRuns (testElement, isDuration, notClickable, isShowPassed) {
    const elementData = this.stepsData.find(data => data.id === testElement.id);
    const runsBlock = document.createElement('runs');
    const selectedRun = getSelectedRun(testElement);
    const fixturesRight = document.querySelector('.fixtures').getBoundingClientRect().right;

    let testRuns = this.stepsData.filter(data => data.t === elementData.t && data.f === elementData.f);

    runsBlock.id = testElement.id;

    runsBlock.addEventListener('wheel', function (e) {
        if (e.deltaY > 0) {
            runsBlock.scrollLeft += 100;
            e.preventDefault();
        }
        else {
            runsBlock.scrollLeft -= 100;
            e.preventDefault();
        }
    });

    let minTime = 0; 

    if (isShowPassed) {
        testRuns = testRuns.filter(r => r.status === 'passed');
        minTime = Math.min(...testRuns.map(r => r.runtime));
    }

    for (let i = 1; i <= testRuns.length; i++) {
        const runData = testRuns[i - 1];
        const runStatus = runData.status;

        const run = document.createElement('button');

        if (document.querySelector('#singleShow').checked && (selectedRun === i.toString() || !selectedRun && i === 1)) run.classList.add('selected');

        if (!isShowPassed) run.classList.add(runStatus);
        else {
            const overtimePercent = Math.min(Math.floor(100 * (runData.runtime - minTime) / minTime), 100);
            const red = Math.floor(2.55 * overtimePercent);

            run.style.backgroundColor = `rgb(${red}, ${255 - red}, 0)`;
        }

        run.textContent = isDuration ? runData.durationMs : runData.time;
        
        if (!notClickable) {
            /* eslint-disable no-loop-func */
            run.onclick = () => {
                if (i === getSelectedRun(testElement)) return;
                testOnClick(testElement, i);
                document.querySelectorAll('runs button.selected').forEach(itm => itm.classList.remove('selected'));
                testElement.setAttribute('selected-run', i.toString());
                run.classList.add('selected');
            };
            /* eslint-enable no-loop-func */
        }
        
        runsBlock.appendChild(run);
    }

    if (notClickable) {
        const testRect = testElement.getBoundingClientRect();

        runsBlock.style.left = `${fixturesRight + 10}px`;
        runsBlock.style.width = '47vw';
        runsBlock.style.top = `${testRect.top}px`;
        runsBlock.style.height = `${testRect.height}px`;
    }

    document.querySelector(notClickable ? '.tests-tree' : '.test-info').appendChild(runsBlock);
}

function addRunsForFixture (fixture, isDuration, isShowPassed) {
    fixture.querySelectorAll('.test:not([class*=hidden])').forEach(tst => addTestRuns(tst, isDuration, true, isShowPassed));
}

function removeRunsForFixture (fixture) {
    fixture.querySelectorAll('.test:not([class*=hidden])').forEach(tst => {
        const runs = document.querySelector(`runs[id='${tst.id}']`);
        
        if (runs) runs.remove();
    });
}

function isShowAsTable () {
    return document.querySelector('#runsShowType').style.visibility === 'visible' && document.querySelector('#tableShow').checked;
}

function onShowAsSwitch (event) {
    const isShowAsTime = isShowTimeStats();
    const eventToSend = {
        target: {
            id: isShowAsTime ? '#timeShow' : '#dateShow'
        }
    };

    if (event?.target?.id?.includes('line')) onRadioSwitch(eventToSend, event?.target?.id?.includes('Pass'));
    else {
        clearTestInfo();

        let allRuns = [];

        const table = document.createElement('table');
        const makeForEachTest = (action) => {
            document.querySelectorAll('.fixture.selected:not([class*=hidden])').forEach(fix => {
                fix.querySelectorAll('.test:not([class*=hidden])').forEach(tst => {
                    action(tst);
                });
            });
        };

        makeForEachTest((tst) => allRuns.push(...stepsData.filter(data => data.f === stepsData.find(d => d.id === tst.id).f && data.t === stepsData.find(d => d.id === tst.id).t)));
        allRuns = Object.assign([], allRuns);
        allRuns.forEach(r => {
            r.time = new Date(r.time).toDateString();
        });
        allRuns.sort((r1, r2) => r2.time.valueOf() - r1.time.valueOf());

        let column;

        let colRuns = [];

        allRuns.forEach((itm, i) => {
            if (itm.time !== allRuns[i - 1]?.time) {
                colRuns.forEach(run => column.appendChild(run));
                if (column) table.appendChild(column);
                column = document.createElement('col');
                colRuns = [];
                const header = document.createElement('th');

                header.textContent = itm.time;
                column.appendChild(header);
            }
            let curRun = colRuns.find(el => el.f === itm.f && el.t === itm.t);

            if (!curRun) {
                curRun = document.createElement('runs');
                curRun.f = itm.f;
                curRun.t = itm.t;
                colRuns.push(curRun);
            }
            const button = document.createElement('button');

            // button.style.height = `${testRect.height - 8}px`;
            
            button.classList.add(itm.status);
            button.textContent = isShowAsTime ? itm.durationMs : '';
            curRun.appendChild(button);

        });
        // table.appendChild(headerRow);

        // makeForEachTest((tst) => {
        //     const testRuns = allRuns.filter(data => data.f === stepsData.find(d => d.id === tst.id).f && data.t === stepsData.find(d => d.id === tst.id).t);
        //     const testRow = document.createElement('tr');
        //     const testRect = tst.getBoundingClientRect();

        //     for (let index = 0; index < headerRow.children.length; index++) {
        //         const head = headerRow.children[index];
        //         const curDateItems = testRuns.filter(r => r.time === head.textContent);
        //         const cell = document.createElement('td');
        //         const runsElement = document.createElement('runs');

        //         for (let index2 = 0; index2 < curDateItems.length; index2++) {
        //             const button = document.createElement('button');

        //             button.style.height = `${testRect.height - 8}px`;
                    
        //             button.classList.add(curDateItems[index2].status);
        //             button.textContent = isShowAsTime ? curDateItems[index2].durationMs : "";

        //             runsElement.appendChild(button);
        //         }
        //         cell.appendChild(runsElement);
        //         testRow.appendChild(cell);
        //     }

        //     testRow.style.top = `${testRect.top + 4}px`;
        //     table.appendChild(testRow);
        // });

        document.querySelector('.tests-tree').appendChild(table);

    }
}

function addShowAsListeners () {
    document.querySelectorAll('[name=showType]').forEach(el => {
        el.onchange = onShowAsSwitch;
    });
}

/* eslint-enable no-unused-vars, no-undef */
