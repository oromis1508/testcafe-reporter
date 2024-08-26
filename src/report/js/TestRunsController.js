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
        minTime = Math.min(...testRuns.map(r => r.runtime).filter(r => r));
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

    document.querySelector(notClickable ? '.tests-tree' : '.test-info').appendChild(runsBlock);
    if (notClickable) {
        const testRect = testElement.getBoundingClientRect();

        setRunsPostition();
        runsBlock.style.left = `${fixturesRight + 10}px`;
        runsBlock.style.width = '47vw';
        runsBlock.style.height = `${testRect.height}px`;
    }
}

function addRunsForFixture (fixture, isDuration, isShowPassed) {
    fixture.querySelectorAll('.test:not([class*=hidden])').forEach(tst => addTestRuns(tst, isDuration, true, isShowPassed));
}

function removeRunsForFixture (fixture) {
    fixture.querySelectorAll('.test:not([class*=hidden])').forEach(tst => {
        const runs = document.querySelector(`.tests-tree runs[id='${tst.id}']`);
        
        if (runs) runs.remove();
    });
}

function isShowAsTable () {
    return document.querySelector('#runsShowType').style.visibility === 'visible' && document.querySelector('#tableShow').checked;
}

/* eslint-enable no-unused-vars, no-undef */
