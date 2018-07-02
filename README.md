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
                browsers: /ie/
            }
        }
    },
    //...
}
```

## Testing

Run [mocha](http://mochajs.org) tests:
```bash
npm run test-unit
```

Run [eslint](http://eslint.org) codestyle verification
```bash
npm run lint
```
