/* eslint-disable no-unused-vars, no-undef */

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
    this.document.querySelector('img[id=sort]').onclick = onSortClick;
    this.addRadioEvents();
}

function addFixtureSummary () {
    this.document.querySelectorAll('.fixture').forEach(fixture => {
        addSummary(fixture, fixture.querySelector('.summary'));
    });
}

function onSearch (searchValue) {
    const isSearchByFixtureEnabled = document.querySelector('#searchFixture').getAttribute('enabled') === 'true';
    
    this.document.querySelectorAll('.fixture').forEach(fixture => {
        const isFixtureExactSearch = isSearchByFixtureEnabled && fixture.querySelector('.fixtureName').textContent.toLowerCase().includes(searchValue.toLowerCase());

        fixture.querySelectorAll('.test').forEach(test => {
            const isTestExactSearch = test.textContent.toLowerCase().includes(searchValue.toLowerCase());

            test.classList[isTestExactSearch || isFixtureExactSearch ? 'remove' : 'add']('search-hidden');
        });

        const isFixtureTestsHidden = fixture.querySelectorAll('.test:not([class*=hidden])').length === 0;
        
        fixture.classList[isFixtureTestsHidden ? 'add' : 'remove']('hidden');    
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

function addTooltip (id, text, positionX, positionY) {
    if (!document.querySelector(`#${id}`)) {
        const tooltip = document.createElement('div');

        tooltip.id = id;
        document.querySelector('body > .summary').appendChild(tooltip);
    }
    const tooltip = document.querySelector(`#${id}`);

    tooltip.style.position = 'absolute';
    tooltip.textContent = text;
    tooltip.style.top = `${positionY}px`;
    tooltip.style.left = `${positionX}px`;

    const setOpacity = (value) => {
        if (value <= 1) {
            tooltip.style.opacity = value;
            value += 0.1;
            setTimeout(() => setOpacity(value), 25);
        }
    };

    setOpacity(0.1);
}

function onSearchButtonMove (event) {
    addTooltip('searchFixtureTooltip', document.querySelector('#searchFixture').getAttribute('enabled') === 'false' ? 'Search by fixture and test' : 'Search only by test', event.clientX, event.clientY);
}

function addSearchByFixtureListeners () {
    const btnSearchByFixture = document.querySelector('#searchFixture');
    
    btnSearchByFixture.onclick = (event) => {
        event.target.setAttribute('enabled', event.target.getAttribute('enabled') !== 'true');
        this.onSearchButtonMove(event);
    };
    btnSearchByFixture.onmouseleave = () => {
        const tooltip = document.querySelector('#searchFixtureTooltip');
    
        if (tooltip) tooltip.remove();
    };
    btnSearchByFixture.onmouseenter = onSearchButtonMove;
}

function onSortClick (event) {
    // eslint-disable-next-line no-use-before-define
    if (!this.originSort) {
        this.originSort = document.querySelectorAll('.fixture');

        this.sorted = [...this.originSort].sort((one, two) => one.querySelector('.fixtureName').textContent.localeCompare(two.querySelector('.fixtureName').textContent));    
    }

    const cl = event.target.getAttribute('class');

    for (const el of this.originSort) el.remove();
    if (cl === 'default') {
        event.target.setAttribute('class', 'name');
        document.querySelector('.fixtures').append(...this.sorted);
    }
    else {
        event.target.setAttribute('class', 'default');
        document.querySelector('.fixtures').append(...this.originSort);
    }
}

function onShowInfoSwitch (event, isPassed) {
    clearTestInfo();
    document.querySelector('#singleType').style.visibility = 'hidden';

    const showTypeForm = document.querySelector('#runsShowType');
    const showPassed = document.querySelector('#linePassShow').parentElement;

    if (!isShowTimeStats() && !isShowAsTable())
        document.querySelector('#lineShow').checked = true;

    showPassed.style.visibility = 'hidden';
    if (event.target.id.includes('single')) {
        const testElement = document.querySelector('.test.selected');

        showTypeForm.style.visibility = 'hidden';
        if (testElement) testOnClick(testElement, +testElement.getAttribute('selected-run'), true);
    }
    else {
        showTypeForm.style.visibility = 'visible';
        
        if (event.target.id.includes('time')) showPassed.style.visibility = 'visible';

        if (isShowAsTable()) onShowAsSwitch();
        else {
            document.querySelectorAll('.fixture.selected:not([class*=hidden])').forEach(fix => {
                addRunsForFixture(fix, event.target.id.includes('time'), isPassed);
            });
        }
    }
}

function addRadioEvents () {
    document.querySelectorAll('[name=showInfo]').forEach(el => {
        el.onchange = this.onShowInfoSwitch;
    });
}

function isShowDateStats () {
    return document.querySelector('#dateShow').checked;
}

function isShowTimeStats () {
    return document.querySelector('#timeShow').checked;
}

function isShowPassed () {
    return document.querySelector('#linePassShow').checked;
}

function onExpandCollapseButtonMove (event) {
    addTooltip('collexFixtureTooltip', document.querySelector('#expandFixtures').style.transform ? 'Collapse all fixtures' : 'Expand all fixtures', event.clientX, event.clientY);
}

function addExpandCollapseAllFixturesListeners () {
    const btnExpandCollapseFixtures = document.querySelector('#expandFixtures');
        
    btnExpandCollapseFixtures.onclick = (event) => {
        document.querySelectorAll('.fixture:not([class*=hidden]) .fixtureName').forEach(fix => onFixtureClick(fix, !event.target.style.transform, event.target.style.transform));
        event.target.style.transform = event.target.style.transform ? '' : 'rotate(180deg)';

        this.onExpandCollapseButtonMove(event);
    };
    btnExpandCollapseFixtures.onmouseleave = () => {
        const tooltip = document.querySelector('#collexFixtureTooltip');
        
        if (tooltip) tooltip.remove();
    };
    btnExpandCollapseFixtures.onmouseenter = onExpandCollapseButtonMove;
}

function onShowAsSwitch (event) {
    const isShowAsTime = isShowTimeStats();
    const eventToSend = {
        target: {
            id: isShowAsTime ? '#timeShow' : '#dateShow'
        }
    };

    if (event?.target?.id?.includes('line')) onShowInfoSwitch(eventToSend, event?.target?.id?.includes('Pass'));
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
