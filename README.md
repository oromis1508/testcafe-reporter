# testcafe-reporter-acd-html-reporter
[![Build Status](https://travis-ci.org/Arg/testcafe-reporter-acd-html-reporter.svg)](https://github.com/oromis1508/testcafe-reporter)

This is the **acd-html-reporter** reporter plugin for [TestCafe](http://devexpress.github.io/testcafe).

<p align="center">
    <img src="https://github.com/oromis1508/testcafe-reporter/blob/master/media/preview.png" alt="Reporter view" />
</p>

## About
Reporter in .html format, for seeing it, you don't need to start any server. Except reporting to file, test run info duplicates in console.

The report generates in folder {project}/test-results/report_{current date}.
Also reporter generates json file with test run info: {project}/test-results/report_{current date}.json.

If you need to run some times a day, save report, because old version with same date will be rewrited (changing the report name will be added in future versions).

For extended test run information you can use Logger, implemented in the reporter.
Method Logger.warn automatically sets status of a test: 'broken'.
```
Logger.warn('Something is strange in this test, may be bug, that 2+2=5 isn't truth');
await t.expect(2 + 2).eql(5);
```

Methods Logger.cleanUp and Logger.preconditions can be used in test hooks (beforeTest, afterTest, etc). It's equivalent of Logger.step, but without step number.
Logger.step can be used with some steps as number, e.g. [1, 2, 3, 4], it will be showed in the report as Step 1-4.
```
Logger.step(1, 'Click the link and do something');
Logger.step([2, 3, 4], 'Doing something else');
```

Logger.info used for adding some information of test actions. **Using of Logger.info without Logger.step, Logger.cleanUp or Logger.preconditions not implemented, it will crash test run** (will be implemented in next versions)
```
Logger.step(1, 'Click the link and do something');
await t.click('link');
Logger.info('Check that page opened');
await t.expect...
```

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
 Alex Chernik

## Links
https://github.com/chalk/chalk
https://devexpress.github.io/testcafe/documentation/extending-testcafe/reporter-plugin/helpers.html