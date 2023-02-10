'use strict';

const _ = require('lodash');
const {EventEmitter} = require('events');
const plugin = require('../../lib');
const {mkConfig_, stubTest_, stubSuite_} = require('./utils');

describe('plugin', () => {
    const sandbox = sinon.createSandbox();
    let testParser;

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
            eachTest: (bro, cb) => testsTree[bro].forEach(cb),
            getBrowsers: () => Object.keys(testsTree)
        };
    };

    beforeEach(() => {
        testParser = {setController: sandbox.stub()};
    });

    afterEach(() => sandbox.restore());

    describe('should add controller in test parser', () => {
        ['master', 'worker'].forEach((proc) => {
            it(`in ${proc}`, () => {
                const hermione = mkHermione_({proc});

                plugin(hermione, mkConfig_({commandName: 'foo'}));

                hermione.emit(hermione.events.BEFORE_FILE_READ, {browser: 'some-bro', testParser});

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
            it('should disable tests only in passive browser', () => {
                const hermione = mkHermione_({browsers: ['bro', 'passive-bro']});
                const [test1, test2] = [stubTest_(), stubTest_()];

                plugin(hermione, mkConfig_({browsers: 'passive-bro'}));

                hermione.emit(hermione.events.BEFORE_FILE_READ, {browser: 'bro', testParser});
                hermione.emit(hermione.events.BEFORE_FILE_READ, {browser: 'passive-bro', testParser});

                const testCollection = mkTestCollection({bro: [test1], 'passive-bro': [test2]});
                hermione.emit(hermione.events.AFTER_TESTS_READ, testCollection);

                assert.notProperty(test1, 'disabled');
                assert.include(test2, {disabled: true});
            });

            describe('should not disable test', () => {
                it('if it was not running in passive browser', () => {
                    const hermione = mkHermione_({browsers: ['bro', 'passive-bro']});
                    const test = stubTest_();

                    plugin(hermione, mkConfig_({browsers: 'passive-bro'}));

                    hermione.emit(hermione.events.BEFORE_FILE_READ, {browser: 'bro', testParser});
                    const testCollection = mkTestCollection({bro: [test]});
                    hermione.emit(hermione.events.AFTER_TESTS_READ, testCollection);

                    assert.notProperty(test, 'disabled');
                });

                it('using string matcher', () => {
                    const hermione = mkHermione_({browsers: ['passive-bro']});
                    const test = stubTest_();

                    plugin(hermione, mkConfig_({browsers: 'passive-bro'}));

                    hermione.emit(hermione.events.BEFORE_FILE_READ, {browser: 'passive-bro', testParser});
                    testParser.setController.firstCall.args[1].in.call(test, 'passive-bro');
                    hermione.emit(hermione.events.AFTER_TESTS_READ, mkTestCollection({'passive-bro': [test]}));

                    assert.notProperty(test, 'disabled');
                });

                it('using regexp matcher', () => {
                    const hermione = mkHermione_({browsers: ['passive-bro1', 'passive-bro2']});
                    const [test1, test2] = [stubTest_(), stubTest_()];

                    plugin(hermione, mkConfig_({browsers: ['passive-bro1', 'passive-bro2']}));

                    hermione.emit(hermione.events.BEFORE_FILE_READ, {browser: 'passive-bro1', testParser});
                    testParser.setController.firstCall.args[1].in.call(test1, 'passive-bro1');

                    hermione.emit(hermione.events.BEFORE_FILE_READ, {browser: 'passive-bro2', testParser});
                    testParser.setController.secondCall.args[1].in.call(test2, 'passive-bro2');

                    const testCollection = mkTestCollection({'passive-bro1': [test1], 'passive-bro2': [test2]});
                    hermione.emit(hermione.events.AFTER_TESTS_READ, testCollection);

                    assert.notProperty(test1, 'disabled');
                    assert.notProperty(test2, 'disabled');
                });

                it('of suite', () => {
                    const hermione = mkHermione_({browsers: ['passive-bro']});
                    const suite = stubSuite_();
                    const [test1, test2] = [stubTest_({parent: suite}), stubTest_({parent: suite})];

                    plugin(hermione, mkConfig_({browsers: 'passive-bro'}));

                    hermione.emit(hermione.events.BEFORE_FILE_READ, {browser: 'passive-bro', testParser});
                    testParser.setController.firstCall.args[1].in.call(suite, 'passive-bro');

                    const testCollection = mkTestCollection({'passive-bro': [test1, test2]});
                    hermione.emit(hermione.events.AFTER_TESTS_READ, testCollection);

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

                hermione.emit(hermione.events.BEFORE_FILE_READ, {browser: 'passive-bro', testParser});
                hermione.emit(hermione.events.AFTER_TESTS_READ, mkTestCollection({'passive-bro': [stubTest_()]}));

                assert.calledOnceWith(spy, sinon.match({disabled: true}));
            });
        });
    });
});
