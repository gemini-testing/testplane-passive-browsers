'use strict';

const _ = require('lodash');

exports.mkConfig_ = (opts = {}) => _.defaults(opts, {commandName: 'default-command'});

exports.stubTest_ = ({id = 'test-id', parent} = {}) => {
    return {id: () => id, parent};
};

exports.stubSuite_ = ({id = 'suite-id', suites = [], parent} = {}) => {
    return {id: () => id, suites, parent};
};
