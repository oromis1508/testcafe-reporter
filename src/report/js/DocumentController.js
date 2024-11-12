'use strict';
/* eslint-disable no-undef, no-use-before-define, no-unused-expressions */
// Encapsulate the code to avoid global namespace pollution
(() => {
    // Constants for frequently used selectors and classes
    window.CLASS_SEARCH_HIDDEN = 'search-hidden';
    window.CLASS_TAG_HIDDEN = 'tag-hidden';
    window.CLASS_STABLE_HIDDEN = 'stable-hidden';
    window.CLASS_HIDDEN = 'hidden';
    window.CLASS_FILTERED = 'filtered';
    window.CLASS_SELECTED = 'selected';
    window.CLASS_TOOLTIP = 'tooltip';
    window.STATUS_CLASSES = ['passed', 'failed', 'broken', 'skipped'];
    window.QUERY_FIXTURE = '.fixture';
    window.QUERY_TEST_INFO = '.test-info';
    window.QUERY_TEST = '.test';
    window.QUERY_FIXTURE_NAME = '.fixtureName';

    // Steps data storage
    const stepsData = [];

    // Cached DOM elements
    const getFixturesContainer = () => document.querySelector('.fixtures');
    const getSearchInput = () => document.querySelector('#search');
    const getSearchFixtureButton = () => document.querySelector('#searchFixture');
    const getSortButton = () => document.querySelector('img#sort');
    const getTagButton = () => document.querySelector('.summary .tag');
    const getExpandCollapseButton = () => document.querySelector('#expandFixtures');
    const getShowChartRadio = () => document.querySelector('#singleChart');
    const getFilterIcon = () => document.getElementById('filter-icon');
    const getRunCountInput = () => document.getElementById('run-count');
    const getContextMenu = () => document.querySelector('.context-menu');
    
    // Tooltip element
    let tooltip;

    // Original and sorted fixtures
    let originalFixtures = [];

    let sortedFixtures = [];
    
    // Get runtime in seconds from duration string
    const getRunTimeSeconds = (durationStr) => {
        const timeMatch = /((\d+)h )?((\d+)m )?(\d+)s/.exec(durationStr);

        if (!timeMatch) return 0;
        const hours = parseInt(timeMatch[2] ?? '0', 10) * 3600;
        const minutes = parseInt(timeMatch[4] ?? '0', 10) * 60;
        const seconds = parseInt(timeMatch[5], 10);

        return hours + minutes + seconds;
    };

    // Initialize steps data from the DOM
    const initializeStepsData = () => {
        if (stepsData.length > 0) return;

        document.querySelectorAll('div[fixtureId]').forEach((el) => {
            const id = el.getAttribute('fixtureId');
            const time = el.getAttribute('time');
            const durationMs = el.getAttribute('durationMs');
            const userAgent = el.getAttribute('userAgent');
            const status = el.getAttribute('status');
            const testTitle = el.getAttribute('t');
            const fixtureTitle = el.getAttribute('f');
            const runtime = getRunTimeSeconds(durationMs);

            stepsData.push({
                id,
                durationMs,
                userAgent,
                time,
                t:          testTitle,
                f:          fixtureTitle,
                status,
                runtime,
                steps:      () => document.querySelector(`div[fixtureId='${id}']`)?.outerHTML ?? '',
                screenshot: () => document.querySelector(`div[fixtureId='${id}']`)?.getAttribute('screenshot') ?? '',
                stackTrace: () => {
                    const stackTraceElement = document.querySelector(`div[traceId='${id}']`);

                    if (stackTraceElement) {
                        try {
                            const textContent = stackTraceElement.textContent
                                .replace(/\n/g, '')
                                .replace(/\\/g, '\\\\')
                                .replace(/="(.*?)"/g, '=\\"$1\\"');

                            return JSON.parse(textContent);
                        }
                        catch (e) {
                            console.error(`Error parsing stack trace for ID ${id}:`, e);
                        }
                    }
                    return [];
                }
            });
        });

        stepsData.sort((a, b) => new Date(b.time) - new Date(a.time));
    };

    // Calculate test statuses within a container
    const calculateStatuses = (container) => {
        const statuses = {};
    
        container.querySelectorAll(QUERY_TEST).forEach((test) => {
            const status = test.getAttribute('status');
    
            statuses[status] = (statuses[status] || 0) + 1;
        });
        return statuses;
    };
    
    // Capitalize a string
    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

    // Append summary elements to a container
    const appendSummaryElements = (statuses, container, includeName, id) => {
        STATUS_CLASSES.forEach((statusName) => {
            const count = statuses[statusName] || 0;

            if (count > 0) {
                const statusElement = document.createElement('div');

                statusElement.classList.add(statusName);
                if (includeName) statusElement.textContent = `${capitalize(statusName)}: ${count}`;
                else {
                    container.id = id.toString();
                    const style = document.createElement('style');

                    document.head.appendChild(style);
            
                    // Add a CSS rule for the ::after pseudo-element dynamically
                    style.sheet.insertRule(`
                        .summary[id='${id}'] .${statusName}::after {
                            content: '${count}'
                        }
                    `, style.sheet.cssRules.length);
                }
                statusElement.addEventListener('click', filterTests);
                container.appendChild(statusElement);
            }
        });
    };

    // Add summary elements to the page
    const addSummary = () => {
        const summaryElement = document.querySelector('body > .summary > .statuses');
        const testStatuses = calculateStatuses(document);

        appendSummaryElements(testStatuses, summaryElement, true);
        getSortButton().addEventListener('click', onSortClick);
        window.summaryBottom = summaryElement.getBoundingClientRect().bottom;
    };

    // Add summary for each fixture
    const addFixtureSummary = () => {
        document.querySelectorAll(QUERY_FIXTURE).forEach((fixture, id) => {
            const testStatuses = calculateStatuses(fixture);
            const fixtureSummary = fixture.querySelector('.summary');

            appendSummaryElements(testStatuses, fixtureSummary, false, id);
        });
    };

    // Add event listeners to controls
    const addEventListeners = () => {
        getSearchInput().addEventListener('input', debounce(onSearch, 300));
        getSearchFixtureButton().addEventListener('click', toggleSearchByFixture);
        getSearchFixtureButton().addEventListener('mouseenter', showSearchTooltip);
        getSearchFixtureButton().addEventListener('mouseleave', removeTooltip);

        getSortButton().addEventListener('mouseenter', showSortTooltip);
        getSortButton().addEventListener('mouseleave', removeTooltip);

        getTagButton().addEventListener('click', filterByTag);
        getTagButton().addEventListener('mouseenter', showTagTooltip);
        getTagButton().addEventListener('mouseleave', removeTooltip);

        getExpandCollapseButton().addEventListener('click', toggleExpandCollapseFixtures);
        getExpandCollapseButton().addEventListener('mouseenter', showExpandCollapseTooltip);
        getExpandCollapseButton().addEventListener('mouseleave', removeTooltip);

        document.querySelectorAll('[name=showInfo]').forEach((radio) => {
            radio.addEventListener('change', onShowInfoSwitch);
        });

        document.querySelectorAll('[name=showType]').forEach((radio) => {
            radio.addEventListener('change', onShowAsSwitch);
        });

        document.querySelectorAll('[name=singleShow]').forEach((radio) => {
            radio.addEventListener('change', onShowSingleSwitch);
        });

        getFixturesContainer().addEventListener('scroll', setRunsPosition);
        new ResizeObserver(setRunsPosition).observe(getFixturesContainer());

        document.querySelectorAll(QUERY_FIXTURE_NAME).forEach((fixtureName) => {
            fixtureName.addEventListener('click', (event) => onFixtureClick(fixtureName, event));
        });

        document.querySelectorAll(QUERY_TEST).forEach((test) => {
            test.addEventListener('click', () => testOnClick(test));
            const tag = test.querySelector('.tag');

            if (tag) {
                tag.addEventListener('click', (e) => {
                    e.stopPropagation();
                    tagOnClick(tag);
                });
            }
        });

        // Add event listeners for info interactions
         
        document.querySelector(QUERY_TEST_INFO)?.addEventListener('click', (event) => {
            if (event.target.closest('.error')) 
                errorOnClick(event);
            else if (event.target.closest('.step')) 
                stepOnClick(event.target);
            else if (event.target.matches('#screenshot img')) 
                screenOnClick();
            
        });

        document.querySelector(QUERY_TEST_INFO)?.addEventListener('contextmenu', function (event) {
            if (!event.target.closest('.error')) return;
            event.preventDefault();
            const contextMenu = getContextMenu();

            contextMenu.style.top = `${event.clientY}px`;
            contextMenu.style.left = `${event.clientX}px`;
            contextMenu.style.display = 'block';
        });
    
        // Close the context menu when clicking outside
        document.addEventListener('click', function () {
            getContextMenu().style.display = 'none';
        });

        document.getElementById('copy-name').addEventListener('click', function () {
            const nameText = document.querySelector('.error-name').textContent.trim();

            navigator.clipboard.writeText(nameText);
        });
    
        // Copy Full Error content to clipboard with newlines between tags
        document.getElementById('copy-full').addEventListener('click', function () {
            let errorText = '';

            document.querySelector('.error').childNodes.forEach((child) => {
                if (child.nodeType === Node.ELEMENT_NODE) 
                    errorText += child.textContent.trim() + '\n';
                
            });
            navigator.clipboard.writeText(errorText.trim());
        });
    
        // Show error in context (modal)
        document.getElementById('show-context').addEventListener('click', function () {
            showDialog(document.querySelector('.error'));
        });

        document.querySelector('body')?.addEventListener('wheel', (event) => {
            if (event.target.closest('.runs')) 
                event.target.closest('.runs').scrollLeft += event.deltaY;
            else if (event.target.closest('.chart-wrapper')) 
                document.querySelector('.chart-wrapper').scrollLeft += event.deltaY;
        });
		
        // Toggle filter on icon click
        getFilterIcon().addEventListener('click', (event) => {
            getFilterIcon().classList.toggle('active');
            if (getFilterIcon().classList.contains('active')) {
                getFilterIcon().title = 'Show tests with stable result';
                applyStableFilter();
            }
            else {
                // Show all tests when filter is deactivated
                getFilterIcon().title = 'Hide tests with stable result by passed runs count';
                document.querySelectorAll(`.${CLASS_STABLE_HIDDEN}`).forEach(testEl => {
                    testEl.classList.remove(CLASS_STABLE_HIDDEN);
                });
                document.querySelectorAll(QUERY_FIXTURE).forEach(f => checkAndHideFixture(f));
            }
            showStableTooltip(getFilterIcon().title, event);
        });
        getFilterIcon().addEventListener('mouseenter', showStableTooltip);
        getFilterIcon().addEventListener('mouseleave', removeTooltip);

        // Update filter on numeric input change if filter is active
        getRunCountInput().addEventListener('change', () => {
            if (getFilterIcon().classList.contains('active')) 
                applyStableFilter();
			
        });
    };

    const showDialog = (errorContent) => {
        // Create overlay and dialog elements
        const overlay = document.createElement('div');

        overlay.classList.add('dialog-overlay');
        const dialogBox = document.createElement('div');

        dialogBox.classList.add('dialog-box');
        dialogBox.innerHTML = `
            <button class="close-button">&times;</button>
            <h3>Error Context</h3>
            <pre class="error-expanded">${errorContent.innerHTML}</pre>
        `;
        
        overlay.appendChild(dialogBox);
        document.body.appendChild(overlay);

        // Show dialog
        overlay.style.display = 'block';

        // Close the dialog on close button click
        dialogBox.querySelector('.close-button').addEventListener('click', function () {
            overlay.remove();
        });

        // Close the dialog when clicking outside of the dialog box
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) 
                overlay.remove();
        });
    };

    // Debounce function to limit function calls
    const debounce = (func, delay) => {
        let timer;

        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => func.apply(this, args), delay);
        };
    };

    const checkAndHideFixture = (fixture) => {
        const fixtureHasVisibleTests = fixture.querySelectorAll(`${QUERY_TEST}:not(.${CLASS_HIDDEN}):not(.${CLASS_TAG_HIDDEN}):not(.${CLASS_SEARCH_HIDDEN}):not(.${CLASS_STABLE_HIDDEN})`).length > 0;

        if (fixtureHasVisibleTests)
            fixture.classList.remove(CLASS_HIDDEN);
        else
            fixture.classList.add(CLASS_HIDDEN);
    };

    // Handle search input
    const onSearch = () => {
        const searchValue = getSearchInput().value.trim().toLowerCase();
        const searchByFixture = getSearchFixtureButton().getAttribute('enabled') === 'true';

        document.querySelectorAll(QUERY_FIXTURE).forEach((fixture) => {
            const fixtureName = fixture.querySelector(QUERY_FIXTURE_NAME).textContent.trim().toLowerCase();
            const fixtureMatches = searchByFixture && fixtureName.includes(searchValue);


            fixture.querySelectorAll(QUERY_TEST).forEach((test) => {
                const testContent = test.textContent.trim().toLowerCase();
                const testMatches = testContent.includes(searchValue);
                const isVisible = testMatches || fixtureMatches;

                if (!isVisible) test.classList.add(CLASS_SEARCH_HIDDEN);
                else test.classList.remove(CLASS_SEARCH_HIDDEN);
            });

            checkAndHideFixture(fixture);
        });
    };

    // Toggle search by fixture
    const toggleSearchByFixture = () => {
        const isEnabled = getSearchFixtureButton().getAttribute('enabled') === 'true';

        getSearchFixtureButton().setAttribute('enabled', isEnabled ? 'false' : 'true');
        onSearch();
    };

    // Filter tests by status
    const filterTests = (event) => {
        const status = event.currentTarget.classList[0];
        const isFiltered = event.currentTarget.classList.contains(CLASS_FILTERED);
        const closestFixture = event.currentTarget.closest(QUERY_FIXTURE);
        const fixtures = closestFixture ? [closestFixture] : document.querySelectorAll(QUERY_FIXTURE);
		
        fixtures.forEach((fixture) => {
            fixture.querySelectorAll(`${QUERY_TEST}[status='${status}']`).forEach((test) => {
                if (isFiltered) {
                    test.classList.remove(CLASS_HIDDEN);
                    if (!closestFixture) document.querySelectorAll(`.fixture .summary .${status}.${CLASS_FILTERED}`).forEach(el => el.classList.remove(CLASS_FILTERED));
                }
                else test.classList.add(CLASS_HIDDEN);
            });

            checkAndHideFixture(fixture);
        });

        event.currentTarget.classList.toggle(CLASS_FILTERED);
        onSearch();
    };

    // Filter tests by tag
    const filterByTag = () => {
        const isFiltered = getTagButton().classList.contains(CLASS_FILTERED);

        getTagButton().classList.toggle(CLASS_FILTERED);

        document.querySelectorAll(QUERY_FIXTURE).forEach((fixture) => {
            fixture.querySelectorAll(QUERY_TEST).forEach((test) => {
                if (!isFiltered && test.querySelector(`.tag.${CLASS_FILTERED}`)) test.classList.add(CLASS_TAG_HIDDEN);
                else test.classList.remove(CLASS_TAG_HIDDEN);
            });

            checkAndHideFixture(fixture);
        });
    };
	
    function tagOnClick (element) {
        element.classList.toggle(CLASS_FILTERED);
		
        if (element.classList.contains(CLASS_FILTERED) && document.querySelector(`.summary .tag.${CLASS_FILTERED}`))
            element.parentElement.classList.add(CLASS_TAG_HIDDEN);
	
        checkAndHideFixture(element.parentElement.parentElement.parentElement);
    }

    // Handle sort button click
    const onSortClick = () => {
        if (originalFixtures.length === 0) {
            originalFixtures = Array.from(document.querySelectorAll(QUERY_FIXTURE));
            sortedFixtures = [...originalFixtures].sort((a, b) => {
                const nameA = a.querySelector(QUERY_FIXTURE_NAME).textContent.trim();
                const nameB = b.querySelector(QUERY_FIXTURE_NAME).textContent.trim();

                return nameA.localeCompare(nameB);
            });
        }

        const isDefault = getSortButton().classList.toggle('default');

        getFixturesContainer().innerHTML = '';
        getFixturesContainer().append(...isDefault ? originalFixtures : sortedFixtures);
    };

    // Show tooltip for search button
    const showSearchTooltip = (event) => {
        const isEnabled = getSearchFixtureButton().getAttribute('enabled') === 'true';
        const message = isEnabled ? 'Search only by test' : 'Search by fixture and test';

        showTooltip(message, event);
    };

    // Show tooltip for sort button
    const showSortTooltip = (event) => {
        const isDefault = getSortButton().classList.contains('default');
        const message = isDefault ? 'Sort fixtures by name' : 'Sort fixtures by default (run time)';

        showTooltip(message, event);
    };

    // Show tooltip for tag button
    const showTagTooltip = (event) => {
        const isFiltered = getTagButton().classList.contains(CLASS_FILTERED);
        const message = isFiltered ? 'Show filtered by tag tests' : 'Hide filtered by tag tests';

        showTooltip(message, event);
    };

    // Show tooltip for expand/collapse button
    const showExpandCollapseTooltip = (event) => {
        const isExpanded = getExpandCollapseButton().style.transform === 'rotate(180deg)';
        const message = isExpanded ? 'Collapse all fixtures' : 'Expand all fixtures';

        showTooltip(message, event);
    };

    const showStableTooltip = (event) => {
        showTooltip(getFilterIcon().title, event);
    };
	
    // Show tooltip at mouse position
    const showTooltip = (message, event) => {
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.classList.add(CLASS_TOOLTIP);
            document.body.appendChild(tooltip);
        }
        tooltip.textContent = message;
        tooltip.style.left = `${event.clientX + 10}px`;
        tooltip.style.top = `${event.clientY + 10}px`;
        tooltip.classList.add('show');
    };

    // Remove tooltip
    const removeTooltip = () => {
        if (tooltip) tooltip.classList.remove('show');
    };

    // Toggle expand/collapse of all fixtures
    const toggleExpandCollapseFixtures = () => {
        const isExpanded = getExpandCollapseButton().style.transform === 'rotate(180deg)';

        getExpandCollapseButton().style.transform = isExpanded ? '' : 'rotate(180deg)';

        document.querySelectorAll(`${QUERY_FIXTURE}:not(.${CLASS_HIDDEN}) ${QUERY_FIXTURE_NAME}`).forEach((fixtureName) => {
            const fixture = fixtureName.parentElement;
            const isSelected = fixture.classList.contains(CLASS_SELECTED);

            if (isExpanded && isSelected) {
                fixture.classList.remove(CLASS_SELECTED);
                removeRunsForFixture(fixture);
            }
            else if (!isExpanded && !isSelected) {
                fixture.classList.add(CLASS_SELECTED);
                setTagsPosition(fixture);
                if (isShowDateStats() || isShowTimeStats()) {
                    if (isShowAsTable()) onShowAsSwitch();
                    else {
                        addRunsForFixture(
                            fixture,
                            isShowTimeStats(),
                            isShowPassed()
                        );
                    }
                }
            }
        });
    };

    // Handle fixture click
    const onFixtureClick = (fixtureName, event) => {
        if (!event.target.classList.contains(QUERY_FIXTURE_NAME.substring(1))) return;
        
        const fixture = fixtureName.parentElement;
        const isSelected = fixture.classList.contains(CLASS_SELECTED);

        if (isSelected) {
            fixture.classList.remove(CLASS_SELECTED);
            removeRunsForFixture(fixture);
        }
        else {
            fixture.classList.add(CLASS_SELECTED);
            setTagsPosition(fixture);
            if (isShowDateStats() || isShowTimeStats()) {

                if (isShowAsTable()) onShowAsSwitch();
                else {
                    addRunsForFixture(
                        fixture,
                        isShowTimeStats(),
                        isShowPassed()
                    );
                }
            }
        }
    };

    // Set positions for tags within tests
    const setTagsPosition = (fixture) => {
        fixture.querySelectorAll(`${QUERY_TEST} .tag`).forEach((tag) => {
            if (!tag.style.top) {
                const parentRect = tag.parentElement.getBoundingClientRect();
                const tagRect = tag.getBoundingClientRect();
                const offsetY = parentRect.top + parentRect.height / 2 - tagRect.height / 2 - tagRect.top;

                tag.style.top = `${offsetY}px`;
            }
        });
    };

    // Handle test click
    const testOnClick = (testElement, indexToShow = getSelectedRun(testElement), forceShow = false) => {		
        const isSelected = testElement.classList.contains(CLASS_SELECTED);

        if (isSelected && !forceShow && getSelectedRun(testElement) === indexToShow) return;

        document.querySelectorAll(`${QUERY_TEST}.${CLASS_SELECTED}`).forEach((test) => test.classList.remove(CLASS_SELECTED));
        testElement.classList.add(CLASS_SELECTED);

        if (getShowChartRadio()?.checked) {
            onShowSingleSwitch({ target: getShowChartRadio() });
            return;
        }
        if (isShowDateStats() || isShowTimeStats()) return;

        clearTestInfo(isSelected);

        const testData = getTestRuns(testElement);
        const selectedRunData = indexToShow ? testData.runs[indexToShow - 1] : testData.data;

        if (!isSelected || forceShow) addTestRuns(testElement);

        addTestInfo(selectedRunData);

        if (selectedRunData.status !== 'skipped') {
            const stepsContent = document.createElement('div');

            stepsContent.classList.add('stepsContent');
            stepsContent.innerHTML = selectedRunData.steps();
            document.querySelector(QUERY_TEST_INFO).appendChild(stepsContent);
            document.querySelector(QUERY_TEST_INFO).classList.add(CLASS_SELECTED);
        }
    };

    // Get the selected run index from a test element
    const getSelectedRun = (testElement) => {
        return testElement.getAttribute('selected-run');
    };

    // Add test runs to a test element
    const addTestRuns = (testElement, isDuration = false, notClickable = false, isShowPassed = false) => {
        let testRuns = getTestRuns(selectedTest).runs;
		
        const runsBlock = document.createElement('div');

        runsBlock.classList.add('runs');
        runsBlock.id = testElement.id;

        let minTime = 0;

        if (isShowPassed) {
            testRuns = testRuns.filter((run) => run.status === 'passed');
            minTime = Math.min(...testRuns.map((run) => run.runtime).filter((runtime) => runtime));
        }

        testRuns.forEach((runData, index) => {
            const runButton = document.createElement('button');
            const runIndex = index + 1;
            const isSelectedRun = document.querySelector('#singleShow').checked &&
                (getSelectedRun(testElement) === runIndex.toString() || !getSelectedRun(testElement) && runIndex === 1);

            if (isSelectedRun) runButton.classList.add(CLASS_SELECTED);

            if (!isShowPassed) 
                runButton.classList.add(runData.status);
            else {
                const overtimePercent = Math.min(Math.floor(100 * (runData.runtime - minTime) / minTime), 100);
                const red = Math.floor(2.55 * overtimePercent);

                runButton.style.backgroundColor = `rgb(${red}, ${255 - red}, 0)`;
            }

            runButton.textContent = isDuration ? runData.durationMs : runData.time;

            if (!notClickable) {
                runButton.addEventListener('click', () => {
                    if (runIndex.toString() === getSelectedRun(testElement)) return;
                    testOnClick(testElement, runIndex);
                    document.querySelectorAll(`.runs button.${CLASS_SELECTED}`).forEach((btn) => btn.classList.remove(CLASS_SELECTED));
                    testElement.setAttribute('selected-run', runIndex.toString());
                    runButton.classList.add(CLASS_SELECTED);
                });
            }

            runsBlock.appendChild(runButton);
        });

        const targetContainer = notClickable ? document.querySelector('.tests-tree') : document.querySelector(QUERY_TEST_INFO);

        targetContainer.appendChild(runsBlock);

        if (notClickable) {
            const testRect = testElement.getBoundingClientRect();
            const fixturesRight = getFixturesContainer().getBoundingClientRect().right;

            setRunsPosition();
            runsBlock.style.position = 'absolute';
            runsBlock.style.left = `${fixturesRight + 10}px`;
            runsBlock.style.width = '47vw';
            runsBlock.style.height = `${testRect.height}px`;
        }
    };

    // Add runs for all tests in a fixture
    const addRunsForFixture = (fixture, isDuration, isShowPassed) => {
        fixture.querySelectorAll(`${QUERY_TEST}:not(.${CLASS_HIDDEN})`).forEach((test) => {
            addTestRuns(test, isDuration, true, isShowPassed);
        });
    };

    // Remove runs for all tests in a fixture
    const removeRunsForFixture = (fixture) => {
        fixture.querySelectorAll(`${QUERY_TEST}:not(.${CLASS_HIDDEN})`).forEach((test) => {
            const runs = document.querySelector(`.tests-tree .runs[id='${test.id}']`);

            if (runs) runs.remove();
        });
    };

    // Check if runs should be displayed as a table
    const isShowAsTable = () => {
        return document.querySelector('#runsShowType')?.style.visibility === 'visible' &&
            document.querySelector('#tableShow')?.checked;
    };

    // Clear test information
    const clearTestInfo = (theSameRuns = false) => {
        const testInfoContainer = document.querySelector(QUERY_TEST_INFO);

        testInfoContainer.classList.remove(CLASS_SELECTED);
        this.document
            .querySelectorAll(
                'div.stepsContent, #screenshot img, #run-info *, #error-info *, table, .y-axis-label, .chart-wrapper'
            )
            .forEach((el) => {
                el.remove();
            });

        document.querySelector('#screenshot').innerHTML = '';
        document.querySelector('#run-info').innerHTML = '';
        if (!theSameRuns) document.querySelectorAll('.runs').forEach((el) => el.remove());
    };

    // Show test information
    const addTestInfo = (testData) => {
        const testInfoContainer = document.querySelector(QUERY_TEST_INFO);

        // Add screenshot if available
        const screenshotSrc = testData.screenshot();

        if (screenshotSrc) {
            const screenshotImg = document.createElement('img');

            screenshotImg.src = screenshotSrc;
            screenshotImg.addEventListener('mouseenter', screenOnHover);
            screenshotImg.addEventListener('mouseleave', screenOnLeave);
            document.querySelector('#screenshot').appendChild(screenshotImg);
        }

        // Add error info if available
        const stackTrace = testData.stackTrace();

        if (stackTrace.length > 0) 
            addStackTrace(stackTrace);
        

        // Add run info
        addRunInfo(testData);
        
        const runIcon = document.querySelector('.info-icon');
        const content = Array.from(document.querySelector('#run-info').children).map(child => child.textContent);

         
        runIcon?.addEventListener('mouseenter', event => showTooltip(content.join('\n'), event));
         
        runIcon?.addEventListener('mouseleave', removeTooltip);

        testInfoContainer.classList.add(CLASS_SELECTED);
    };

    // Add stack trace to test info
    const addStackTrace = (stackTrace) => {
        const errorInfo = document.createElement('div');

        errorInfo.id = 'error-info';

        stackTrace.forEach((error) => {
            const errorBlock = document.createElement('div');

            errorBlock.classList.add('error');

            const errorName = document.createElement('div');

            errorName.classList.add('error-name');
            errorName.innerHTML = error[0].replace(/\n/g, '<br>');
            errorBlock.appendChild(errorName);

            for (let i = 1; i < error.length; i++) {
                const stackLine = document.createElement('div');

                stackLine.classList.add('stack-line');
                stackLine.innerHTML = error[i].replace('()@', ' ').replace(/((\w:)?\\.*?:\d*:\d*)/g, '<a href="vscode://file/$1">$1</a>');
                errorBlock.appendChild(stackLine);
            }

            errorInfo.appendChild(errorBlock);
        });

        document.querySelector(QUERY_TEST_INFO).insertBefore(errorInfo, document.querySelector(QUERY_TEST_INFO).firstChild);
        adjustErrorFontSize();
    };

    // Adjust font size for error names based on content length
    const adjustErrorFontSize = () => {
        const errorNames = document.querySelectorAll('.error-name');

        let totalLength = 0;

        errorNames.forEach((errorName) => {
            totalLength += errorName.textContent.trim().length;
        });

        const contentLengthOffset = totalLength / 550;

        if (contentLengthOffset > 1) {
            const fontSize = document.querySelector('#error-info').getBoundingClientRect().height / 14;

            errorNames.forEach((errorName) => {
                errorName.style.fontSize = `${Math.round(fontSize / contentLengthOffset)}px`;
            });
        }
    };

    // Add run info to test info
    const addRunInfo = (testData) => {
        const runInfoContainer = document.querySelector('#run-info');
        const durationDiv = document.createElement('div');
        const userAgentDiv = document.createElement('div');
        const resultDiv = document.createElement('div');

        durationDiv.textContent = `Test duration: ${testData.durationMs}`;
        durationDiv.classList.add('duration');

        userAgentDiv.textContent = `Completed on: ${testData.userAgent}`;
        userAgentDiv.classList.add('userAgent');

        resultDiv.innerHTML = `Result: <span class="${testData.status}">${testData.status}</span> on ${testData.time}`;
        resultDiv.classList.add('result');

        runInfoContainer.appendChild(durationDiv);
        runInfoContainer.appendChild(userAgentDiv);
        runInfoContainer.appendChild(resultDiv);
    };

    // Screen hover effect
    const screenOnHover = () => {
         
        document.querySelector('#screenshot img')?.classList.add('increased');
    };

    // Screen click handler
    const screenOnClick = () => {
        const img = document.querySelector('#screenshot img');

        if (img?.classList.contains('increased')) 
            screenOnLeave();
        else 
            screenOnHover();
        
    };

    // Screen leave effect
    const screenOnLeave = () => {
         
        document.querySelector('#screenshot img')?.classList.remove('increased');
    };

    // Error block click handler
    const errorOnClick = (event) => {
        const errorBlock = event.target.closest('.error');

        if (!errorBlock) return;

        const isExpanded = errorBlock.classList.toggle('error-expanded');

        adjustBodyHeightForError(errorBlock, isExpanded);
    };

    // Adjust body height when error block is expanded
    const adjustBodyHeightForError = (errorBlock, isExpanded) => {
        const body = document.body;
        const errorHeightChange = errorBlock.getBoundingClientRect().height;

        if (isExpanded) 
            body.style.height = `${body.getBoundingClientRect().height + errorHeightChange}px`;
        else 
            body.style.height = '';
        
    };

    // Step click handler
    const stepOnClick = (stepNameElement) => {
        const stepBlock = stepNameElement.closest('.step');
        const isHidden = stepBlock.hasAttribute('hiddenInfo');

        if (isHidden) 
            stepBlock.removeAttribute('hiddenInfo');
        else 
            stepBlock.setAttribute('hiddenInfo', '');
        
    };

    // Handle show info switch (placeholder function, implementation needed)
    const onShowInfoSwitch = (event, isPassed) => {
        clearTestInfo();

        const showTypeForm = document.querySelector('#runsShowType');
        const showPassed = document.querySelector('#linePassShow').parentElement;
        const singleType = document.querySelector('#singleType');

        if (!isShowTimeStats() && !isShowAsTable())
            document.querySelector('#lineShow').checked = true;

        showPassed.style.display = 'none';
        if (event.target.id.includes('single')) {
            const testElement = document.querySelector(`${QUERY_TEST}.${CLASS_SELECTED}`);

            showTypeForm.style.display = 'none';
            singleType.style.display = 'unset';
            if (testElement) testOnClick(testElement, +testElement.getAttribute('selected-run'), true);
        }
        else {
            singleType.style.display = 'none';
            showTypeForm.style.display = 'unset';

            if (event.target.id.includes('time')) showPassed.style.display = 'unset';

            if (isShowAsTable()) onShowAsSwitch();
            else {
                document.querySelectorAll(`${QUERY_FIXTURE}.${CLASS_SELECTED}:not([class*=${CLASS_HIDDEN}])`).forEach(fix => {
                    addRunsForFixture(fix, event.target.id.includes('time'), isPassed);
                });
            }
        }
    };

    // Handle show as switch (placeholder function, implementation needed)
    const onShowAsSwitch = (event) => {
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
                document.querySelectorAll(`${QUERY_FIXTURE}.${CLASS_SELECTED}:not([class*=${CLASS_HIDDEN}])`).forEach(fix => {
                    fix.querySelectorAll(`${QUERY_TEST}:not([class*=${CLASS_HIDDEN}])`).forEach(tst => {
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
    };

    // Handle show single switch (placeholder function, implementation needed)
    const onShowSingleSwitch = (event) => {
        const selectedTest = document.querySelector(`${QUERY_TEST}.${CLASS_SELECTED}`);

        if (selectedTest) {
            if (event.target.id === 'singleChart') drawBarChart(getTestRuns(selectedTest).runs);
            // eslint-disable-next-line no-undefined
            else testOnClick(selectedTest, undefined, true);
        }
    };

    // Check if date stats should be shown
    const isShowDateStats = () => {
        return document.querySelector('#dateShow')?.checked;
    };

    // Check if time stats should be shown
    const isShowTimeStats = () => {
        return document.querySelector('#timeShow')?.checked;
    };

    // Check if passed runs should be shown
    const isShowPassed = () => {
        return document.querySelector('#linePassShow')?.checked;
    };

    // Set runs position (placeholder function, implementation needed)
    const setRunsPosition = () => {
        if (!window.tests) window.tests = [];
        
        document
            .querySelectorAll('.tests-tree > .runs')
            .forEach(
                (run) => {
                    const test = window.tests[run.id] ?? (window.tests[run.id] = document.querySelector(`${QUERY_TEST}[id='${run.id}']`));

                    run.style.top = test.getBoundingClientRect().top - window.summaryBottom + 'px';
                });
    };

    // Create chart base elements
    const createChartBases = () => {
        const infoContainer = document.querySelector(QUERY_TEST_INFO);
    
        const yAxis = document.createElement('div');
    
        yAxis.classList.add('y-axis-label');
        yAxis.textContent = 'Run Time';
        infoContainer.appendChild(yAxis);
    
        const wrapper = document.createElement('div');
    
        wrapper.classList.add('chart-wrapper');
    
        const container = document.createElement('div');
    
        container.classList.add('chart-container');
    
        wrapper.appendChild(container);
        infoContainer.appendChild(wrapper);
    };
    
    // Draw bar chart for test runs
    const drawBarChart = (runs) => {
        clearTestInfo();
        createChartBases();
        const chartContainer = document.querySelector('.chart-container');

        const maxRuntime = Math.max(...runs.map((run) => run.runtime));

        runs.forEach((run) => {
            // Create bar-label container
            const barLabelContainer = document.createElement('div');

            barLabelContainer.classList.add('bar-label-container');

            // Create bar
            const bar = document.createElement('div');

            bar.classList.add('bar', run.status);
            const barHeightPercentage = run.runtime / maxRuntime * 100;

            bar.style.height = `${barHeightPercentage}%`;

            barLabelContainer.appendChild(bar);

            // Create runtime label (above bar)
            const runtimeLabel = document.createElement('div');

            runtimeLabel.classList.add('runtime');
            runtimeLabel.textContent = `${run.runtime} s`;
            barLabelContainer.appendChild(runtimeLabel);

            // Create label (date + time below bar)
            const label = document.createElement('div');
            const [datePart, timePart] = run.time.split(', ');

            label.innerHTML = `<span>${datePart}</span><span>${timePart}</span>`;
            label.classList.add('label');
            barLabelContainer.appendChild(label);

            // Append bar-label container to chart
            chartContainer.appendChild(barLabelContainer);
        });
    };

    // Filter function
    const applyStableFilter = () => {
        // Get the numeric value from the input
        const minRuns = parseInt(getRunCountInput().value, 10);

        // Show only tests that meet the criteria
        document.querySelectorAll('.test').forEach(testElement => {
            const testData = getTestRuns(testElement);

            if (testRuns.length >= minRuns) {
                for (let i = 0; i < minRuns; i++) {
                    if (testData.data.status !== testData.runs[i].status || testData.data.stackTrace()[0]?.at(0) !== testData.runs[i].stackTrace()[0]?.at(0)) break;
                    if (i === minRuns - 1) testElement.classList.add(CLASS_STABLE_HIDDEN);
                }
            }
        });
        document.querySelectorAll(QUERY_FIXTURE).forEach(f => checkAndHideFixture(f));
    };

    const getTestRuns = (testElement) => {
        if (!window.runs) window.runs = [];
        if (!window.tdata) window.tdata = [];

        if (window.runs[testElement.id]) {
            return {
                runs: window.runs[testElement.id],
                data: window.tdata[testElement.id]
            };
        }

        window.tdata[testElement.id] = stepsData.find((data) => data.id === testElement.id);
        
        window.runs[testElement.id] = stepsData.filter((data) => data.t === testData.t && data.f === testData.f);

        return {
            runs: window.runs[testElement.id],
            data: window.tdata[testElement.id]
        };
    };

    window.onFixtureClick = onFixtureClick;
    window.tagOnClick = tagOnClick;
    window.testOnClick = testOnClick;
    window.filterTests = filterTests;
    window.filterByTag = filterByTag;
    window.onSortClick = onSortClick;
    window.onSearch = onSearch;
    window.showTooltip = showTooltip;
    window.removeTooltip = removeTooltip;
    window.screenOnHover = screenOnHover;
    window.screenOnClick = screenOnClick;
    window.screenOnLeave = screenOnLeave;
    window.errorOnClick = errorOnClick;
    window.stepOnClick = stepOnClick;
    window.setRunsPosition = setRunsPosition;
    window.checkAndHideFixture = checkAndHideFixture;
    window.applyStableFilter = applyStableFilter;
    window.showDialog = showDialog;
    window.getTestRuns = getTestRuns;

    
    // Initialization function
    const onLoad = () => {
        initializeStepsData();
        addSummary();
        addFixtureSummary();
        addEventListeners();
    };

    // Initialize on window load
    window.addEventListener('load', onLoad);
})();
