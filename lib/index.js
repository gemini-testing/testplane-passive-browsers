'use strict';

const _ = require('lodash');
const parseConfig = require('./config');

const isMatched = (matcher, value) => _.isRegExp(matcher) ? matcher.test(value) : _.isEqual(matcher, value);
const shouldRunInBro = (browserId, matcher) => [].concat(matcher).some((m) => isMatched(m, browserId));
const getPassiveBrowserIds = (testCollection, {browsers: passiveBrowserMatchers}) => {
    const browserIds = testCollection.getBrowsers();

    return _([].concat(passiveBrowserMatchers))
        .flatMap((browserMatcher) => browserIds.filter((browserId) => isMatched(browserMatcher, browserId)))
        .uniq()
        .value();
};

module.exports = (hermione, opts) => {
    const config = parseConfig(opts);

    if (!config.enabled) {
        return;
    }

    if (hermione.isWorker()) {
        hermione.on(hermione.events.BEFORE_FILE_READ, ({testParser}) => {
            testParser.setController(config.commandName, {in: _.noop});
        });

        return;
    }

    const suitesToRun = {};
    const testsToRun = {};

    hermione.on(hermione.events.BEFORE_FILE_READ, ({browser: browserId, testParser}) => {
        testParser.setController(config.commandName, {
            in: function(matcher) {
                const storage = this.suites ? suitesToRun : testsToRun;

                if (!shouldRunInBro(browserId, matcher)) {
                    return;
                }

                if (!storage[browserId]) {
                    storage[browserId] = [];
                }

                storage[browserId].push({id: this.id()});
            }
        });
    });

    hermione.prependListener(hermione.events.AFTER_TESTS_READ, (testCollection) => {
        const passiveBrowserIds = getPassiveBrowserIds(testCollection, config);

        passiveBrowserIds.forEach((browserId) => {
            const shouldRunTest = (runnable, storage = testsToRun) => {
                const foundRunnable = runnable.id && _.find(storage[browserId], {id: runnable.id()});

                return foundRunnable || runnable.parent && shouldRunTest(runnable.parent, suitesToRun);
            };

            testCollection.eachTest(browserId, (test) => {
                test.disabled = !shouldRunTest(test);
            });
        });
    });
};
