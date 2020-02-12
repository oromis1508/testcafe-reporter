/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

function screenOnHover () {
    document.querySelector('#screenshot img').classList.add('increased');
}

function screenOnClick () {
    document.querySelector('#screenshot img').classList.contains('increased') ? screenOnLeave() : screenOnHover();
}

function screenOnLeave () {
    document.querySelector('#screenshot img').classList.remove('increased');
}

function errorOnClick () {
    const body = document.querySelector('body');
    const testInfo = document.querySelector('.test-info');
    const errorInfo = document.querySelector('#error-info');
    const errorHeight = errorInfo.getBoundingClientRect().height;
    const isExpanded = testInfo.classList.contains('error-expanded');

    testInfo.classList[isExpanded ? 'remove' : 'add']('error-expanded');

    const errorOffset = errorInfo.getBoundingClientRect().height - errorHeight;

    body.style.height = errorOffset > 0 ? `${errorOffset + body.getBoundingClientRect().height}px` : '';
    testInfo.style.height = errorOffset > 0 ? `${errorOffset + testInfo.getBoundingClientRect().height}px` : '';
}

/* eslint-enable no-undef */
/* eslint-enable no-unused-vars */
