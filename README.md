# testcafe-reporter-acd-html-reporter
[![Build Status](https://travis-ci.org/Arg/testcafe-reporter-acd-html-reporter.svg)](https://travis-ci.org/Arg/testcafe-reporter-acd-html-reporter)

This is the **acd-html-reporter** reporter plugin for [TestCafe](http://devexpress.github.io/testcafe).

<p align="center">
    <img src="https://raw.github.com/Arg/testcafe-reporter-acd-html-reporter/master/media/preview.png" alt="preview" />
</p>

## Install

```
npm install testcafe-reporter-acd-html-reporter
```

## Usage

When you run tests from the command line, specify the reporter name by using the `--reporter` option:

```
testcafe chrome 'path/to/test/file.js' --reporter acd-html-reporter
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
 (http://-)
