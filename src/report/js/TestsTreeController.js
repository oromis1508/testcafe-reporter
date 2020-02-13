/* eslint-disable no-unused-vars */

function onFixtureClick (element) {
    const isCurrentFixtureSelected = element.parentElement.classList.contains('selected');

    element.parentElement.classList[isCurrentFixtureSelected ? 'remove' : 'add']('selected');
}

function addStackTrace (stackTrace) {
    const testInfoNode = this.document.querySelector('.test-info');
    
    let errorsNode = this.document.querySelector('#error-info');

    if (!errorsNode) {
        const trace = this.document.createElement('div');
        
        trace.id = 'error-info';
        testInfoNode.insertBefore(trace, testInfoNode.childNodes[0]);
        errorsNode = this.document.querySelector('#error-info');
    }


    for (const error of stackTrace) {
        const errorName = this.document.createElement('div');
        const errorBlock = this.document.createElement('div');
    
        errorBlock.classList.add('error');
        errorName.classList.add('error-name');
        errorName.textContent = error[0];
        errorName.onclick = this.errorOnClick;
        errorBlock.appendChild(errorName);
    
        for (let index = 1; index < error.length; index++) {
            const stackLineText = error[index];
            const stackLine = this.document.createElement('div');
            
            stackLine.classList.add('stack-line');
            stackLine.innerHTML = stackLineText.replace('()@', ' ').replace(/((\w:)?\\.*?:\d*:\d*)/g, '<a href="vscode://file/$1">$1</a>');

            errorBlock.appendChild(stackLine);
        }

        errorsNode.appendChild(errorBlock);
    }
}

function addTestInfo (testData) {
    if (testData.screenshot) {
        const screen = this.document.createElement('img');

        screen.src = testData.screenshot;
        screen.onclick = this.screenOnClick;
        screen.onmouseover = this.screenOnHover;
        screen.onmouseleave = this.screenOnLeave;
        this.document.querySelector('#screenshot').appendChild(screen);
    }

    if (testData.stackTrace)
        this.addStackTrace(testData.stackTrace);
    else {
        const el = this.document.querySelector('#error-info');

        if (el) el.remove();
    }
        
    const duration = this.document.createElement('div');
    const userAgent = this.document.createElement('div');
    const durationMs = parseInt(testData.durationMs, 10);
    const min = Math.floor(durationMs / (1000 * 60));
    const sec = Math.floor(durationMs / 1000) - min * 60;
    const msec = durationMs % 1000;

    duration.textContent = `Test duration: ${min ? `min: ${min}, ` : ''}sec: ${sec}, msec: ${msec}`;
    duration.classList.add('duration');
    userAgent.textContent = `Completed on: ${testData.userAgent}`;
    userAgent.classList.add('userAgent');

    this.document.querySelector('#run-info').appendChild(duration);
    this.document.querySelector('#run-info').appendChild(userAgent);    
}

function testOnClick (element) {   
    const testName = element.textContent.trim();
    const fixtureName = element.parentElement.parentElement.querySelector('.fixtureName').textContent.trim();
    const testInfo = this.document.querySelector('.test-info');

    this.document.querySelector('body').style.height = '';
    testInfo.style.height = '';
    testInfo.classList.remove('error-expanded');

    this.document.querySelectorAll('.test.selected').forEach(el => {
        el.classList.remove('selected');
    });
    element.classList.add('selected');

    this.document.querySelectorAll('div.stepsContent, #screenshot img, #run-info *, #error-info *').forEach(el => {
        el.remove();
    });
    testInfo.classList.remove('selected');

    if (element.getAttribute('status') === 'skipped') return;

    this.stepsData.forEach(data => {
        if (data.fixture === fixtureName && data.test === testName) {
            const child = this.document.createElement('div');
            

            child.classList.add('stepsContent');
            child.innerHTML = data.steps;
            testInfo.appendChild(child);
            testInfo.classList.add('selected');

            this.addTestInfo(data);
            return;
        }
    });
}

/* eslint-disable no-undef */

function filterTests (event) {
    const status = event.target.classList[0];
    const methodName = event.target.classList.contains('filtered') ? 'remove' : 'add';
    const isFixture = event.target.parentElement.parentElement.classList.contains('fixture');
    const filterFunction = (fixture) => {
        fixture.querySelectorAll(`.test[status='${status}']`).forEach(test => {
            test.classList[methodName]('hidden');
        });

        fixture.classList[fixture.querySelectorAll('.test:not(.hidden)').length === 0 ? 'add' : 'remove']('hidden');
    };

    if (isFixture) {
        filterFunction(event.target.parentElement.parentElement);
        event.target.classList[methodName]('filtered');

        const filteredCount = document.querySelectorAll(`.fixture .${status}.filtered`).length;
        
        if (filteredCount === 0)
            document.querySelector(`body > .summary .${status}`).classList.remove('filtered');
        else if (filteredCount === document.querySelectorAll(`.fixture .${status}`).length)
            document.querySelector(`body > .summary .${status}`).classList.add('filtered');
    }
    else {
        document.querySelectorAll('.fixture').forEach(fixture => filterFunction(fixture));
        document.querySelectorAll(`.summary .${status}`).forEach(el => el.classList[methodName]('filtered'));
    }
}

/* eslint-enable no-undef */
/* eslint-enable no-unused-vars */
