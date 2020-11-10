/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

function screenOnHover () {
    document.querySelector('#screenshot img').classList.add('increased');
}

function screenOnClick () {
    if (document.querySelector('#screenshot img').classList.contains('increased'))
        screenOnLeave();
    else
        screenOnHover();
}

function screenOnLeave () {
    document.querySelector('#screenshot img').classList.remove('increased');
}

function errorOnClick (event) {
    const errorBlock = event.target.parentElement;
    const body = document.querySelector('body');
    const testInfo = document.querySelector('.test-info');
    const errorHeight = errorBlock.getBoundingClientRect().height;
    const isExpanded = errorBlock.classList.contains('error-expanded');

    errorBlock.classList[isExpanded ? 'remove' : 'add']('error-expanded');

    const expandedErrorBlock = document.querySelectorAll('error-expanded');
    const errorOffset = errorBlock.getBoundingClientRect().height - errorHeight;

    body.style.height = expandedErrorBlock ? `${errorOffset + body.getBoundingClientRect().height}px` : '';
    testInfo.style.height = expandedErrorBlock ? `${errorOffset + testInfo.getBoundingClientRect().height}px` : '';
}

function stepOnClick (stepNameElement) {
    const stepBlock = stepNameElement.parentElement;

    if (stepBlock.hasAttribute('hiddenInfo')) stepBlock.removeAttribute('hiddenInfo');
    else stepBlock.setAttribute('hiddenInfo', '');
} 

/* eslint-enable no-undef */
/* eslint-enable no-unused-vars */
