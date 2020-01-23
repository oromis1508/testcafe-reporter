var stepsData = [];

/* eslint-disable no-unused-vars */

function onFixtureHover (element) {
    if (this.document.querySelectorAll('.selected').length > 0) return;
    element.parentElement.querySelectorAll('.test').forEach(el => {
        el.classList.add('visible');
    });
}

function onFixtureLeave (element) {
    element.parentElement.querySelectorAll('.test').forEach(el => {
        el.classList.remove('visible');
    });
}

function onFixtureClick (element) {
    this.document.querySelectorAll('.fixture').forEach(el => {
        el.classList.remove('selected');
    });
    element.parentElement.classList.add('selected');
}

function testOnClick (element) {
    const testName = element.textContent.trim();
    const fixtureName = element.parentElement.parentElement.querySelector('.fixtureName').textContent.trim();

    this.document.querySelectorAll('div.stepsContent, #screenshot img').forEach(el => {
        el.remove();
    });

    stepsData.forEach(data => {
        if (data.fixture === fixtureName && data.test === testName) {
            var child = this.document.createElement('div');
            child.classList.add('stepsContent');
            child.innerHTML = data.steps;
            this.document.querySelector('.steps').appendChild(child);

            if(data.screenshot) {
                var screen = this.document.createElement('img');
                screen.src = data.screenshot;
                screen.onclick = screenOnClick;
                this.document.querySelector('#screenshot').appendChild(screen);    
            }
            return;
        }
    });
}

function filterTests(event) {
    const status = event.target.classList[0];
    const methodName = event.target.classList.contains('selected') ? 'remove' : 'add';

    event.target.classList[methodName]('selected');
    document.querySelectorAll('.fixture').forEach(fixture => {
        if(fixture.querySelectorAll(`.test[status='${status}']`).length === 0) {
            fixture.classList[methodName]('hidden');
        } else {
            fixture.querySelectorAll(`.test:not([status='${status}'])`).forEach(test => {
                test.classList[methodName]('hidden');
            })
        }
    })
}

function addSummary() {
    const testStatuses = Array();
    this.document.querySelectorAll('.test').forEach(test => {
        const currentStatus = test.getAttribute('status');
        const statusIndex = testStatuses.findIndex(status => status.name === currentStatus);
        if(statusIndex === -1) {
            testStatuses.push({ name: currentStatus, count: 1 });
        } else {
            testStatuses[statusIndex].count++;
        }
    });
    for (const status of testStatuses) {
        const statusEl = this.document.createElement('div');
        statusEl.classList.add(status.name);
        statusEl.onclick = filterTests;
        statusEl.textContent = `${status.name.charAt(0).toUpperCase() + status.name.slice(1)}: ${status.count}`;
        this.document.querySelector('.summary').appendChild(statusEl);    
    }
}

function onLoad () {
    if (stepsData.length === 0) {
        this.document.querySelectorAll('tr[fixture]').forEach(el => {
            stepsData.push({
                fixture: el.getAttribute('fixture'),

                test: el.getAttribute('test'),

                steps: el.outerHTML,

                screenshot: el.getAttribute('screenshot')
            });
            el.remove();
        });    
    }
    addSummary();
}

/* eslint-enable no-unused-vars */

if (this.window.onload) 
    this.window.onload += onLoad;
else
    this.window.onload = onLoad;
