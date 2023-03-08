'use strict';

const _ = require('lodash');

exports.mkConfig_ = (opts = {}) => _.defaults(opts, {commandName: 'default-command'});

exports.stubTest_ = ({id = 'test-id', parent, browserId} = {}) => {
    return {id: () => id, parent, browserId: browserId || parent && parent.browserId};
};

exports.stubSuite_ = ({id = 'suite-id', suites = [], parent, browserId} = {}) => {
    return {id: () => id, suites, parent, browserId: browserId || parent && parent.browserId};
};
