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

    this.document.querySelectorAll('steps').forEach(el => {
        el.remove();
    });

    stepsData.forEach(data => {
        if (data.fixture === fixtureName && data.test === testName) {
            var child = this.document.createElement('steps');

            child.innerHTML = data.steps;
            this.document.querySelector('.content').appendChild(child);
            return;
        }
    });
}

function onLoad () {
    if (stepsData.length === 0) {
        this.document.querySelectorAll('tr[fixture]').forEach(el => {
            stepsData.push({
                fixture: el.getAttribute('fixture'),

                test: el.getAttribute('test'),

                steps: el.outerHTML
            });
            el.remove();
        });    
    }
}

/* eslint-enable no-unused-vars */

if (this.window.onload) 
    this.window.onload += onLoad;
else
    this.window.onload = onLoad;
