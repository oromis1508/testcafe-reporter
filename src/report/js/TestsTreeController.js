/* eslint-disable no-unused-vars */

function onFixtureClick (element) {
    const isCurrentFixtureSelected = element.parentElement.classList.contains('selected');
    const fixtureWidth = element.getBoundingClientRect().width;

    element.parentElement.classList[isCurrentFixtureSelected ? 'remove' : 'add']('selected');

    const widthOffset = element.getBoundingClientRect().width - fixtureWidth;
    
    this.document.querySelectorAll('.fixture .summary').forEach(summary => {
        const currentLeft = summary.computedStyleMap().get('left');

        summary.style.left = widthOffset < 0 ? `${currentLeft.substr(0, currentLeft.length - 2) + widthOffset}px` : '';
    });
}

function testOnClick (element) {   
    const testName = element.textContent.trim();
    const fixtureName = element.parentElement.parentElement.querySelector('.fixtureName').textContent.trim();
    const testInfo = this.document.querySelector('.test-info');

    this.document.querySelectorAll('.test.selected').forEach(el => {
        el.classList.remove('selected');
    });
    element.classList.add('selected');

    this.document.querySelectorAll('div.stepsContent, #screenshot img').forEach(el => {
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

            if (data.screenshot) {
                var screen = this.document.createElement('img');

                screen.src = data.screenshot;
                screen.onclick = this.screenOnClick;
                this.document.querySelector('#screenshot').appendChild(screen);    
            }
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

        // if (fixture.querySelectorAll(`.test:not([status='${status}'])`).length === 0 || fixture.querySelectorAll('.test:not(.hidden)').length === 0 === event.target.classList.contains('filtered'))
        //     fixture.classList[methodName]('hidden');
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
