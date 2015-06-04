/*
 * Copyright (c) 2014 - Copyright holders CIRSFID and Department of
 * Computer Science and Engineering of the University of Bologna
 * 
 * Authors: 
 * Monica Palmirani – CIRSFID of the University of Bologna
 * Fabio Vitali – Department of Computer Science and Engineering of the University of Bologna
 * Luca Cervone – CIRSFID of the University of Bologna
 * 
 * Permission is hereby granted to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * 
 * The Software can be used by anyone for purposes without commercial gain,
 * including scientific, individual, and charity purposes. If it is used
 * for purposes having commercial gains, an agreement with the copyright
 * holders is required. The above copyright notice and this permission
 * notice shall be included in all copies or substantial portions of the
 * Software.
 * 
 * Except as contained in this notice, the name(s) of the above copyright
 * holders and authors shall not be used in advertising or otherwise to
 * promote the sale, use or other dealings in this Software without prior
 * written authorization.
 * 
 * The end-user documentation included with the redistribution, if any,
 * must include the following acknowledgment: "This product includes
 * software developed by University of Bologna (CIRSFID and Department of
 * Computer Science and Engineering) and its authors (Monica Palmirani, 
 * Fabio Vitali, Luca Cervone)", in the same place and form as other
 * third-party acknowledgments. Alternatively, this acknowledgment may
 * appear in the software itself, in the same form and location as other
 * such third-party acknowledgments.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


var cluster = require('cluster');

if (cluster.isMaster) {
    cluster.fork();
    cluster.on('disconnect', function () {
        console.info('Restarting service.');
        cluster.fork();
    });
} else {
    var express = require('express'),
        corsMiddleware = require('cors'),
        domainMiddleware = require('express-domain-middleware'),
        bodyParserMiddleware = require('body-parser'),
        
        config = require('./config.json'),
        documentsdbRouter = require('./documentsdb/router.js'),
        xmlRouter = require('./xml/router.js');
    var app = express();

    // console.log('domainMiddleware', domainMiddleware);
    app.use(domainMiddleware);
    app.use(corsMiddleware());
    app.use(bodyParserMiddleware.json({limit: '50mb'}));
    app.use(bodyParserMiddleware.urlencoded({ extended: true }));

    app.use('/xml', xmlRouter);
    app.use('/documentsdb', documentsdbRouter);

    app.use(function (err, req, res, next) {
        console.error(err.stack);
        try {
            var killtimer = setTimeout(function() {
                process.exit(1);
            }, 5000);
            killtimer.unref();
            server.close();
            cluster.worker.disconnect();

            res.statusCode = 500;
            res.setHeader('content-type', 'text/plain');
            res.end('Internal server error.\n');
        } catch (er2) {
            console.error('Error sending 500!', er2.stack);
        }
    });

    var server = app.listen(config.port, function() {
        console.log('Listening on port %d', server.address().port);
    });    
}

