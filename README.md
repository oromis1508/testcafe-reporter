# testcafe-reporter-acd-html-reporter
[![Build Status](https://travis-ci.org/Arg/testcafe-reporter-acd-html-reporter.svg)](https://travis-ci.org/Arg/testcafe-reporter-acd-html-reporter)

This is the **acd-html-reporter** reporter plugin for [TestCafe](http://devexpress.github.io/testcafe).

<p align="center">
    <img src="https://raw.github.com/Arg/testcafe-reporter-acd-html-reporter/master/media/preview.png" alt="To be implemented when report will be completed" />
</p>

## About
Reporter in .html format, for seeing it, you don't need to start any server, 
the report generates in folder {project}/test-results/report_{current date}.
If you need to run some times a day, save report, because old version with same date will be rewrited.

**On current stage report don't realize fully.**
There is you can see:
- fixtures, tests (groupping by fixtures);
- filters, search by tests / fixtures;
- class Logger for adding more information while a test runs;
- test information: steps, actions in the steps, screenshot if a test failed, test duration and browser/OS running on;

Method Logger.warn automatically sets status of a test: 'broken'.

Now some versions can have some errors, as the reporter in development.
When the reporter will be completed (main part of it), I will add version 1.2.

## Install

```
npm install testcafe-reporter-acd-html-reporter
```

## Usage

When you run tests from the command line, specify the reporter name by using the `--reporter` option:

```
testcafe chrome 'path/to/test/file.js' --reporter acd-html-reporter
```

If you needed screenshots in report, use `-s` option:

```
testcafe chrome 'path/to/test/file.js' --reporter acd-html-reporter -s takeOnFails=true
```

When you use API, pass the reporter name to the `reporter()` method:

```js
testCafe
    .createRunner()
    .src('path/to/test/file.js')
    .browsers('chrome')
    .reporter('acd-html-reporter') // <-
    .run();
```

## Author
 Alex

## Links
https://github.com/chalk/chalk
https://devexpress.github.io/testcafe/documentation/extending-testcafe/reporter-plugin/helpers.html