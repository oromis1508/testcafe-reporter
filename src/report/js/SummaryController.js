/* eslint-disable no-unused-vars */

function appendSummaryElement (testStatuses, elementToAppend, withName) {
    ['passed', 'failed', 'broken', 'skipped'].forEach(statusName => {
        const statusesObject = testStatuses.find(el => el.name === statusName);
        const statusesCount = statusesObject ? statusesObject.count : 0;

        if (statusesCount) {
            const statusEl = this.document.createElement('div');

            statusEl.classList.add(statusName);
            statusEl.onclick = this.filterTests;
            statusEl.textContent = `${withName ? `${statusName.charAt(0).toUpperCase() + statusName.slice(1)}: ` : ''}${statusesCount}`;
            elementToAppend.appendChild(statusEl);    
        }
    });
}

function addSummary (elementWithTests, elementToAppend) {
    const testStatuses = [];

    elementWithTests = elementWithTests ? elementWithTests : this.document;
    elementWithTests.querySelectorAll('.test').forEach(test => {
        const currentStatus = test.getAttribute('status');
        const statusIndex = testStatuses.findIndex(status => status.name === currentStatus);

        if (statusIndex === -1)
            testStatuses.push({ name: currentStatus, count: 1 });
        else
            testStatuses[statusIndex].count++;
    });
    appendSummaryElement(testStatuses, elementToAppend ? elementToAppend : this.document.querySelector('body > .summary'), !elementToAppend);
}

function addFixtureSummary () {
    this.document.querySelectorAll('.fixture').forEach(fixture => {
        addSummary(fixture, fixture.querySelector('.summary'));
    });
}

/* eslint-disable no-undef */

function onSearch (searchValue) {
    const isSearchByFixtureEnabled = document.querySelector('#searchFixture').getAttribute('enabled') === 'true';
    
    this.document.querySelectorAll('.fixture').forEach(fixture => {
        const isFixtureExactSearch = isSearchByFixtureEnabled && fixture.querySelector('.fixtureName').textContent.toLowerCase().includes(searchValue.toLowerCase());

        fixture.querySelectorAll('.test').forEach(test => {
            const isTestExactSearch = test.textContent.toLowerCase().includes(searchValue.toLowerCase());

            test.classList[isTestExactSearch || isFixtureExactSearch ? 'remove' : 'add']('search-hidden');
        });

        if (!fixture.classList.contains('hidden')) {
            const isFixtureTestsHidden = fixture.querySelectorAll('.test:not([class*=hidden])').length === 0;
        
            fixture.classList[isFixtureTestsHidden ? 'add' : 'remove']('hidden');    
        }
    });
}

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
    onSearch(document.querySelector('#search').value);
}

function filterByTag (element) {
    const isFilteredOnClick = element.classList.contains('filtered');
    const methodName = isFilteredOnClick ? 'remove' : 'add';
    
    element.classList[methodName]('filtered');

    document.querySelectorAll('.fixture').forEach(fixture => {
        fixture.querySelectorAll('.test').forEach(test => {
            if (test.querySelector('.tag.hidden')) test.classList[methodName]('tag-hidden');
        });
        if (fixture.querySelector(".test:not([class*='hidden'])") && isFilteredOnClick || !fixture.querySelector(".test:not([class*='hidden'])") && !isFilteredOnClick)
            fixture.classList[methodName]('hidden');
    });
}

function onSearchButtonMove (event) {
    if (!document.querySelector('#searchFixtureTooltip')) {
        const tooltip = document.createElement('div');

        tooltip.id = 'searchFixtureTooltip';
        document.querySelector('body > .summary').appendChild(tooltip);
    }
    const tooltip = document.querySelector('#searchFixtureTooltip');

    tooltip.textContent = document.querySelector('#searchFixture').getAttribute('enabled') === 'false' ? 'Search by fixture and test' : 'Search only by test';
    tooltip.style.top = `${event.clientY}px`;
    tooltip.style.left = `${event.clientX}px`;
}

function onSearchButtonLeave () {
    const tooltip = document.querySelector('#searchFixtureTooltip');

    if (tooltip) tooltip.remove();
}

function onSearchButtonClick (event) {
    event.target.setAttribute('enabled', event.target.getAttribute('enabled') !== 'true');
    this.onSearchButtonMove(event);
}

function addSearchByFixtureListeners () {
    const btnSearchByFixture = document.querySelector('#searchFixture');
    
    btnSearchByFixture.onclick = onSearchButtonClick;
    btnSearchByFixture.onmouseleave = onSearchButtonLeave;
    btnSearchByFixture.onmousemove = onSearchButtonMove;
}

/* eslint-enable no-undef */
/* eslint-enable no-unused-vars */
