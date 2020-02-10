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

function onSearch (searchValue) {
    this.document.querySelectorAll('.fixture').forEach(fixture => {
        fixture.querySelectorAll('.test').forEach(test => {
            const isTestExactSearch = test.textContent.toLowerCase().includes(searchValue.toLowerCase());
            
            test.classList[isTestExactSearch ? 'remove' : 'add']('search-hidden');
        });

        const isFixtureTestsHidden = fixture.querySelectorAll('.test:not(.hidden):not(.search-hidden)').length === 0;
        
        fixture.classList[isFixtureTestsHidden ? 'add' : 'remove']('search-hidden');
    });
}

/* eslint-enable no-unused-vars */
