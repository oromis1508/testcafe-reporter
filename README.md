# testcafe-reporter-acd-html-reporter
[![Build Status](https://travis-ci.org/Arg/testcafe-reporter-acd-html-reporter.svg)](https://github.com/oromis1508/testcafe-reporter)

This is the **acd-html-reporter** reporter plugin for [TestCafe](http://devexpress.github.io/testcafe).

<p align="center">
    <img src="https://raw.github.com/oromis1508/testcafe-reporter/master/media/preview.png" alt="Reporter view" />
</p>

## About
### New in 1.3:
#### Added support of <a href="#concurrency">concurrency</a> (also for Logger)
#### TS Logger moved from 'testcafe-reporter-acd-html-reporter/utils/Logger' to 'testcafe-reporter-acd-html-reporter/lib/Logger'
#### Added argument <a href="#appendLogs">--appendLogs</a>. 
#### Argument <a href="#saveToFile">--reportFile</a> is applying by default
#### Added support <a href="#acd-html-combine">npx acd-html-combine</a> command

Reporter in .html format, for seeing it, you don't need to start any server. Except reporting to file, test run info duplicates in console.

### concurrency
<p id="concurrency">
<b>WARN: next line is required, concurrency with the reporter doesn't work without it!</b>
<p>To run tests concurrently, need to run the command first: `npx acd-html-reporter` (after npm i)</p>
</p>

### appendLogs
<p id="appendLogs">
With that tag report always will be generated to one file.
Result files saved like `report_3.02_34138.json`, where 34138 - run id. Result will be formed as by <a href="#acd-html-combine">npx acd-html-combine</a> command (with combined json).

With definition <a href="#saveToFile">--reportFile</a> can be used to write results in one file for different runs.
</p>

### acd-html-combine
<p id="acd-html-combine">
Command npx acd-html-combine can combine some .json result files to 1 report file.
The command can be used in 2 ways, with a folder or with list of files delimited by ',':
1. npx acd-html-combine test-results/report_1.02/report_1.02.json,test-results/report_1.11/report_1.11.json
In that case report will be generated from the files in the list.
2. npx acd-html-combine test-results
In that case report will be generated from all .json files in the folder (except which are ended with -combined.json).

Result html file will be generated in <a href="#baseReportDir">base report folder</a> with report-combined.json file with all files data.

<b>If need to save combined report to a different path, use --dest (-dest) argument, e.g.:</b>
npx acd-html-combine test-results --dest 123.html
npx acd-html-combine test-results -dest=path/to/123.html
In that case report-combined.json will be in the same folder. 
</p>

### baseReportDir
<p id="baseReportDir">
The report generates in base folder: {project}/test-results/report_{current date} as report.html (html + js/css/img files in case <a href="#changeDirectory">saving as folder</a>.)
Also reporter generates json file with test run info, it places in: {report_directory}/report.json.
</p>

If you need to run some times a day, save report, because old version with same date will be rewrited.
You can <a href="#changeDirectory">change the report saving directory</a> or <a href="#saveToFile">save report to single file</a> (without css, js and img files).

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

Logger.info used for adding some information of test actions.
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

If you want to have screenshots in report, use `-s` option:

```
testcafe chrome 'path/to/test/file.js' --reporter acd-html-reporter -s takeOnFails=true
```

<p id="changeDirectory">
If you want to save report to another folder, you can use `--reportPath` argument:
</p>

```
testcafe chrome 'path/to/test/file.js' --reporter acd-html-reporter --reportPath path/to/my/report
```

<p id="saveToFile">
If you want to save report as single file, use `--reportFile` argument. If you don't passed argument value, it saved to <a href="#baseReportDir">base report folder</a> as report.html and report.json:
</p>

```
testcafe chrome 'path/to/test/file.js' --reporter acd-html-reporter --reportFile
```

or you can add folder name to report (report will be saved as path/to/html/report.html and path/to/html/report.json):

```
testcafe chrome 'path/to/test/file.js' --reporter acd-html-reporter --reportFile path/to/html
```

or if the path ended with .html, report will be saved to it folder (path/to/my.html and path/to/report.json):

```
testcafe chrome 'path/to/test/file.js' --reporter acd-html-reporter --reportFile path/to/my.html
```

<p id="screenshots">
If you want to replace files of screenshots with base64 strings, use `--base64screens` argument (report file can have large size).
</p>

## Author
 Alex Chernik

## Links
https://github.com/chalk/chalk
https://devexpress.github.io/testcafe/documentation/extending-testcafe/reporter-plugin/helpers.html
