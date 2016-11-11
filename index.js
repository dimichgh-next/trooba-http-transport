'use strict';

var UrlUtils = require('url');
var Wreck = require('wreck');
var _ = require('lodash');

var httpfy = require('trooba-http-api');

module.exports = function httpTransportFactory(config) {

    function transport(requestContext, responseContext) {
        var options = _.merge(requestContext.options || {}, config);
        var genericTimeout = options.timeout;

        if (options.connectTimeout) {
            options.timeout = options.connectTimeout;
        }
        if (options.body) {
            options.payload = options.body;
        }
        if (options.path) {
            options.pathname = options.path;
        }

        var url = UrlUtils.format(requestContext.options);

        Wreck.request(options.method, url, options, function onResponse(err, response) {
            /* handle err if it exists, in which case res will be undefined */
            if (err) {
                responseContext.next(err);
                return;
            }

            responseContext.statusCode = response.statusCode;
            responseContext.response = response;

            // buffer the response stream
            options.timeout = genericTimeout;
            if (options.socketTimeout) {
                options.timeout = options.socketTimeout;
            }
            Wreck.read(response, options, function onResponseRead(err, body) {
                response.body = body;
                responseContext.next(err, response);
            });
        });
    }

    return httpfy(transport);
};
