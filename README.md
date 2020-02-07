# testcafe-reporter-acd-html-reporter
[![Build Status](https://travis-ci.org/Arg/testcafe-reporter-acd-html-reporter.svg)](https://travis-ci.org/Arg/testcafe-reporter-acd-html-reporter)

This is the **acd-html-reporter** reporter plugin for [TestCafe](http://devexpress.github.io/testcafe).

<p align="center">
    <img src="https://raw.github.com/Arg/testcafe-reporter-acd-html-reporter/master/media/preview.png" alt="To be implemented when report will be completed" />
</p>

## About
Reporter in .html format, for seeing it, you don't need to start any server, 
the report generates in folder {project}/test-results/report_{current date}.

On current stage report don't realize fully, there is you can see fixtures, tests (groupping by fixtures), screenshot if a test failed and bad-formatted steps (by Logger.steps method).

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