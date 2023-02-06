/* eslint-disable no-unused-vars */

function onFixtureClick (element) {
    const isCurrentFixtureSelected = element.parentElement.classList.contains('selected');

    element.parentElement.classList[isCurrentFixtureSelected ? 'remove' : 'add']('selected');
    if (!isCurrentFixtureSelected) this.setTagsPosition(element.parentElement);
}

function setTagsPosition (fixture) {
    fixture.querySelectorAll('.test .tag').forEach(tag => {
        if (!tag.style.top) {
            const parentRect = tag.parentElement.getBoundingClientRect();
            const tagRect = tag.getBoundingClientRect();
            const expectedY = parentRect.top + parentRect.height / 2 - tagRect.height / 2;
            
            tag.style.top = `${expectedY - tagRect.top}px`;
        }
    });
}

function addStackTrace (stackTrace) {
    const testInfoNode = this.document.querySelector('.test-info');
    const trace = this.document.createElement('div');
        
    trace.id = 'error-info';
    testInfoNode.insertBefore(trace, testInfoNode.childNodes[0]);
    
    const errorsNode = this.document.querySelector('#error-info');

    for (const error of stackTrace) {
        const errorName = this.document.createElement('div');
        const errorBlock = this.document.createElement('div');
    
        errorBlock.classList.add('error');
        errorName.classList.add('error-name');
        errorName.innerHTML = error[0].replace(/\n/g, '<br>');
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
    setErrorFont();
}

function setErrorFont () {
    const errorNames = this.document.querySelectorAll('.error-name');

    let errorNamesLength = 0;

    errorNames.forEach(err => {
        errorNamesLength += err.textContent.trim().length;
    });
    
    const contentLengthOffset = errorNamesLength / 550;

    if (contentLengthOffset > 1) {
        const fontSize = this.document.querySelector('#error-info').getBoundingClientRect().height / 14;

        errorNames.forEach(err => {
            err.style.fontSize = `${Math.round(fontSize / contentLengthOffset)}px`;
        });
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

    const el = this.document.querySelector('#error-info');

    if (el) el.remove();
    if (testData.stackTrace) this.addStackTrace(testData.stackTrace);
        
    const duration = this.document.createElement('div');
    const userAgent = this.document.createElement('div');
    const result = this.document.createElement('div');

    duration.textContent = `Test duration: ${testData.durationMs}`;
    duration.classList.add('duration');
    userAgent.textContent = `Completed on: ${testData.userAgent}`;
    userAgent.classList.add('userAgent');
    result.innerHTML = `Result: <span class="${testData.status}">${testData.status}</span> on ${testData.time}`;
    result.classList.add('result');
    
    this.document.querySelector('#run-info').appendChild(duration);
    this.document.querySelector('#run-info').appendChild(userAgent);    
    this.document.querySelector('#run-info').appendChild(result);    
}

function clearTestInfo (testInfoElement) {
    this.document.querySelector('body').style.height = '';
    testInfoElement.style.height = '';
    testInfoElement.classList.remove('error-expanded');
    testInfoElement.classList.remove('selected');

    this.document.querySelectorAll('.test.selected').forEach(el => {
        el.classList.remove('selected');
    });
    this.document.querySelectorAll('div.stepsContent, #screenshot img, #run-info *, #error-info *, select option').forEach(el => {
        el.remove();
    });
}

function testOnClick (element, indexToShow) {
    if (!indexToShow && element.classList.contains('selected')) return;

    const testInfo = this.document.querySelector('.test-info');
    const status = element.getAttribute('status');

    this.clearTestInfo(testInfo);
    element.classList.add('selected');
    if (status === 'skipped') return;

    const child = this.document.createElement('div');
    const elementData = this.stepsData.find(data => data.id === element.id);
    const testRuns = this.stepsData.filter(data => data.t === elementData.t && data.f === elementData.f);
    const testData = indexToShow ? testRuns[indexToShow - 1] : elementData;
    const select = this.document.querySelector('select');

    for (let i = 0; i < testRuns.length; i++) {
        const option = this.document.createElement('option');

        option.textContent = (i + 1).toString();
        if (!indexToShow && i === 0 || i + 1 === indexToShow) option.selected = true;
        select.appendChild(option);
    }

    testData.status = status;
    child.classList.add('stepsContent');
    child.innerHTML = testData.steps;
    testInfo.appendChild(child);
    testInfo.classList.add('selected');

    this.addTestInfo(testData);
}

function tagOnClick (element) {
    const methodName = element.classList.contains('hidden') ? 'remove' : 'add';

    element.classList[methodName]('hidden');
    if (this.document.querySelector('.summary .tag.filtered')) {
        element.parentElement.classList.add('tag-hidden');
        if (!element.parentElement.parentElement.parentElement.querySelector('.test:not([class*=hidden])'))
            element.parentElement.parentElement.parentElement.classList.add('hidden');
    }
}

/* eslint-enable no-unused-vars */
