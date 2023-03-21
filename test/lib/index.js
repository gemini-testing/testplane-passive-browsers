'use strict';

const _ = require('lodash');
const {EventEmitter} = require('events');
const plugin = require('../../lib');
const {mkConfig_, stubTest_, stubSuite_} = require('./utils');

describe('plugin', () => {
    const sandbox = sinon.createSandbox();

    const mkHermione_ = (opts) => {
        opts = _.defaults(opts, {proc: 'master', browsers: []});

        const hermione = new EventEmitter();
        hermione.events = {
            BEFORE_FILE_READ: 'beforeFileRead',
            AFTER_TESTS_READ: 'afterTestsRead'
        };
        hermione.config = {getBrowserIds: sandbox.stub().returns(opts.browsers)};
        hermione.isWorker = sandbox.stub().returns(opts.proc === 'worker');

        return hermione;
    };

    const mkTestCollection = (testsTree) => {
        return {
            eachTest: (bro, cb) => testsTree.filter(({browserId}) => browserId === bro).forEach(cb),
            getBrowsers: () => _(testsTree).map('browserId').uniq().value()
        };
    };

    afterEach(() => sandbox.restore());

    describe('should add controller in test parser', () => {
        ['master', 'worker'].forEach((proc) => {
            it(`in ${proc}`, () => {
                const hermione = mkHermione_({proc});
                plugin(hermione, mkConfig_({commandName: 'foo'}));

                const testParser = {setController: sandbox.stub()};
                hermione.emit(hermione.events.BEFORE_FILE_READ, {testParser});

                assert.calledOnceWith(testParser.setController, 'foo', {in: sinon.match.func});
            });
        });
    });

    describe('working with tests tree', () => {
        describe('in worker', () => {
            it('should do nothing', () => {
                const hermione = mkHermione_({proc: 'worker'});
                sandbox.spy(hermione, 'prependListener');

                plugin(hermione, mkConfig_());

                assert.notCalled(hermione.prependListener);
            });
        });

        describe('in master', () => {
            const installController_ = (hermione, browser) => {
                const testParser = {setController: sandbox.stub()};
                hermione.emit(hermione.events.BEFORE_FILE_READ, {testParser, browser});

                return testParser.setController.firstCall.args[1];
            };

            it('should disable tests only in passive browser', () => {
                const hermione = mkHermione_({browsers: ['bro', 'passive-bro']});
                const test1 = stubTest_({browserId: 'bro'});
                const test2 = stubTest_({browserId: 'passive-bro'});

                plugin(hermione, mkConfig_({browsers: 'passive-bro'}));
                installController_(hermione);

                hermione.emit(hermione.events.AFTER_TESTS_READ, mkTestCollection([test1, test2]));

                assert.notProperty(test1, 'disabled');
                assert.include(test2, {disabled: true});
            });

            it('should use browser from event data if it does not set for suite', () => {
                const hermione = mkHermione_({browsers: ['passive-bro']});
                const suite = stubSuite_();
                const test1 = stubTest_({parent: suite, browserId: 'passive-bro'});
                const test2 = stubTest_({parent: suite, browserId: 'passive-bro'});

                plugin(hermione, mkConfig_({browsers: 'passive-bro'}));

                const controller = installController_(hermione, 'passive-bro');
                controller.in.call(suite, 'passive-bro');

                hermione.emit(hermione.events.AFTER_TESTS_READ, mkTestCollection([test1, test2]));

                assert.notProperty(test1, 'disabled');
                assert.notProperty(test2, 'disabled');
            });

            describe('should not disable test', () => {
                it('if it was not running in passive browser', () => {
                    const hermione = mkHermione_({browsers: ['bro', 'passive-bro']});
                    const test = stubTest_({browserId: 'bro'});

                    plugin(hermione, mkConfig_({browsers: 'passive-bro'}));
                    installController_(hermione);

                    hermione.emit(hermione.events.AFTER_TESTS_READ, mkTestCollection([test]));

                    assert.notProperty(test, 'disabled');
                });

                it('using string matcher', () => {
                    const hermione = mkHermione_({browsers: ['passive-bro']});
                    const test = stubTest_({browserId: 'bassive-bro'});

                    plugin(hermione, mkConfig_({browsers: 'passive-bro'}));
                    const controller = installController_(hermione);
                    controller.in.call(test, 'passive-bro');
                    hermione.emit(hermione.events.AFTER_TESTS_READ, mkTestCollection([test]));

                    assert.notProperty(test, 'disabled');
                });

                it('using regexp matcher', () => {
                    const hermione = mkHermione_({browsers: ['passive-bro1', 'passive-bro2']});
                    const test1 = stubTest_({browserId: 'passive-bro1'});
                    const test2 = stubTest_({browserId: 'passive-bro2'});

                    plugin(hermione, mkConfig_({browsers: ['passive-bro1', 'passive-bro2']}));

                    const controller = installController_(hermione);
                    controller.in.call(test1, 'passive-bro1');
                    controller.in.call(test2, 'passive-bro2');

                    hermione.emit(hermione.events.AFTER_TESTS_READ, mkTestCollection([test1, test2]));

                    assert.notProperty(test1, 'disabled');
                    assert.notProperty(test2, 'disabled');
                });

                it('of suite', () => {
                    const hermione = mkHermione_({browsers: ['passive-bro']});
                    const suite = stubSuite_({browserId: 'passive-bro'});
                    const [test1, test2] = [stubTest_({parent: suite}), stubTest_({parent: suite})];

                    plugin(hermione, mkConfig_({browsers: 'passive-bro'}));

                    const controller = installController_(hermione);
                    controller.in.call(suite, 'passive-bro');

                    hermione.emit(hermione.events.AFTER_TESTS_READ, mkTestCollection([test1, test2]));

                    assert.notProperty(test1, 'disabled');
                    assert.notProperty(test2, 'disabled');
                });
            });

            it('should modify tests tree before any other plugin', () => {
                const hermione = mkHermione_({browsers: ['passive-bro']});

                const spy = sandbox.spy();
                hermione.on(hermione.events.AFTER_TESTS_READ, (testCollection) => {
                    testCollection.eachTest('passive-bro', spy);
                });

                plugin(hermione, mkConfig_({browsers: 'passive-bro'}));
                installController_(hermione);
                hermione.emit(hermione.events.AFTER_TESTS_READ, mkTestCollection([stubTest_({browserId: 'passive-bro'})]));

                assert.calledOnceWith(spy, sinon.match({disabled: true}));
            });
        });
    });
});
