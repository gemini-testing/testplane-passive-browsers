# hermione-passive-browsers [![Build Status](https://travis-ci.org/gemini-testing/hermione-passive-browsers.svg?branch=master)](https://travis-ci.org/gemini-testing/hermione-passive-browsers)

Plugin for [hermione](https://github.com/gemini-testing/hermione) to run tests in passive browsers on request. Passive browsers are browsers in which tests do not run by default.

You can read more about hermione plugins [here](https://github.com/gemini-testing/hermione#plugins).

## Installation

```bash
npm install hermione-passive-browsers
```

## Usage

### Configuration

Plugin has following configuration:

* **enabled** (optional) `Boolean` – enable/disable the plugin; by default plugin is enabled
* **browsers** (optional) `String|RegExp|Array<String|RegExp>` - browsers in which tests should not run by default
* **commandName** (required) `String` - command name which will be added to hermione context and used in tests before test or suite declaration for enable test in passed browser

Also there is ability to override plugin parameters by CLI options or environment variables
(see [configparser](https://github.com/gemini-testing/configparser)).
Use `hermione_passive_browsers_` prefix for the environment variables and `--hermione-passive-browsers-` for the cli options.

### Hermione usage

Add plugin to your `hermione` config file:

```js
module.exports = {
    // ...
    system: {
        plugins: {
            'hermione-passive-browsers': {
                enabled: true,
                browsers: /ie/,
                commandName: 'enable'
            }
        }
    },
    //...
}
```

Example:

```js
hermione.enable.in('ie6');
describe('suite', () => {
    it('test1', function() {...});

    hermione.enable.in(['ie7', /ie[89]/]);
    it('test2', function() {...});

    hermione.enable.in(/ie1[01]/);
    it('test3', function() {...});
})
```

As a result:
- test `test1` will be run in `ie6` browser
- test `test2` will be run in `ie6`, `ie7`, `ie8` and `ie9` browsers
- test `test3` will be run in `ie6`, `ie10` and `ie11` browsers

## Testing

Run [mocha](http://mochajs.org) tests:
```bash
npm run test-unit
```

Run [eslint](http://eslint.org) codestyle verification
```bash
npm run lint
```
