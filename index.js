"use strict";
var WORKER = "\n    self.addEventListener(\n        'message',\n        function(event){\n            var message = event.data.split(':');\n            var cmd = message[0];\n            var ID = message[1];\n            var delay = parseInt(message[2]);\n\n            switch(cmd) {\n                case 'calibrate':\n                    self.postMessage('calibrate:' + ID);\n                    break;\n                case 'createTimeout':\n                    var $timeout = setTimeout(function(){\n                        self.postMessage('timeout:' + ID + ':' + $timeout);\n                    }, delay);\n                    self.postMessage('createTimeout:' + ID + ':' + $timeout);\n                    break;\n                case 'createInterval':\n                    var $interval = setInterval(function(){\n                        self.postMessage('interval:' + ID + ':' + $interval);\n                    }, delay);\n                    self.postMessage('createInterval:' + ID + ':' + $interval);\n                    break;\n                case 'clearTimeout':\n                    clearTimeout(ID);\n                    break;\n                case 'clearInterval':\n                    clearInterval(ID);\n                    break;\n            }\n        },\n        false\n    );\n";
var Timer = /** @class */ (function () {
    function Timer() {
        this.intervalMap = new Map();
        this.timeoutMap = new Map();
        this.timeError = 0;
        this.worker = new Worker(URL.createObjectURL(new Blob([WORKER], { type: "application/javascript" })));
        this.$setWorkerEventListener();
    }
    Timer.prototype.calibrate = function () {
        var now = Date.now();
        this.worker.postMessage('calibrate:' + now.toString());
    };
    // https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setTimeout
    // var timeoutID = scope.setTimeout(function[, delay, param1, param2, ...]);
    // var timeoutID = scope.setTimeout(function[, delay]);
    // var timeoutID = scope.setTimeout(code[, delay]);
    Timer.prototype.setTimeout = function (functionOrCode, delay) {
        var params = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            params[_i - 2] = arguments[_i];
        }
        var timeDelay = (delay && delay >= 4) ? delay : 4;
        timeDelay -= this.timeError;
        var timeoutID = this.$getRandomCode();
        this.timeoutMap.set(timeoutID, {
            fn: functionOrCode,
            delay: timeDelay,
            params: params || [],
            status: false,
            timer: 0
        });
        this.worker.postMessage('createTimeout:' + timeoutID + ':' + timeDelay);
        return timeoutID;
    };
    // https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setInterval
    // var intervalID = scope.setInterval(func, delay[, param1, param2, ...]);
    // var intervalID = scope.setInterval(code, delay);
    Timer.prototype.setInterval = function (functionOrCode, delay) {
        var params = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            params[_i - 2] = arguments[_i];
        }
        var timeDelay = (delay && delay >= 4) ? delay : 4;
        timeDelay -= this.timeError;
        var intervalID = this.$getRandomCode();
        this.intervalMap.set(intervalID, {
            fn: functionOrCode,
            delay: timeDelay,
            params: params || [],
            status: false,
            timer: 0
        });
        this.worker.postMessage('createInterval:' + intervalID + ':' + timeDelay);
        return intervalID;
    };
    Timer.prototype.clearTimeout = function (timeoutCode) {
        var interval = this.intervalMap.get(timeoutCode);
        if (interval) {
            this.worker.postMessage('clearInterval:' + interval.timer);
            this.intervalMap.delete(timeoutCode);
        }
    };
    Timer.prototype.clearInterval = function (intervalCode) {
        var interval = this.intervalMap.get(intervalCode);
        if (interval) {
            this.worker.postMessage('clearInterval:' + interval.timer);
            this.intervalMap.delete(intervalCode);
        }
    };
    Timer.prototype.clearAll = function () {
        var _this = this;
        this.timeoutMap.forEach(function (info, key) {
            _this.clearTimeout(key);
        });
        this.intervalMap.forEach(function (info, key) {
            _this.clearInterval(key);
        });
    };
    Timer.prototype.hasTimer = function (tikcerID) {
        return (this.timeoutMap.has(tikcerID) || this.intervalMap.has(tikcerID));
    };
    Timer.prototype.$setWorkerEventListener = function () {
        var _this = this;
        this.worker.addEventListener("message", function (event) {
            var response = event.data.split(':');
            var cmd = response[0];
            var ID = response[1];
            var mark = response[2];
            switch (cmd) {
                case 'createTimeout':
                    {
                        var timeoutInfo = _this.timeoutMap.get(ID);
                        if (timeoutInfo) {
                            timeoutInfo.status = true;
                            timeoutInfo.timer = parseInt(mark);
                        }
                    }
                    break;
                case 'createInterval':
                    {
                        var intervalInfo = _this.intervalMap.get(ID);
                        if (intervalInfo) {
                            intervalInfo.status = true;
                            intervalInfo.timer = parseInt(mark);
                        }
                    }
                    break;
                case 'timeout':
                    {
                        var timeoutInfo = _this.timeoutMap.get(ID);
                        if (timeoutInfo && timeoutInfo.status === true) {
                            if (typeof timeoutInfo.fn === 'function') {
                                /** @todo 確定下上下文 */
                                timeoutInfo.fn.apply(_this, timeoutInfo.params);
                            }
                            else {
                                eval(timeoutInfo.fn);
                            }
                        }
                    }
                    break;
                case 'interval':
                    {
                        var intervalInfo = _this.intervalMap.get(ID);
                        if (intervalInfo && intervalInfo.status === true) {
                            if (typeof intervalInfo.fn === 'function') {
                                /** @todo 確定下上下文 */
                                intervalInfo.fn.apply(_this, intervalInfo.params);
                            }
                            else {
                                eval(intervalInfo.fn);
                            }
                        }
                    }
                    break;
                case 'calibrate':
                    {
                        var recievedTime = Date.now();
                        var sentTime = parseInt(ID);
                        _this.timeError = recievedTime - sentTime;
                    }
                    break;
            }
        });
    };
    Timer.prototype.$getRandomCode = function () {
        return (performance.now() * Math.random() * 1000000000).toString(16).replace('.', '');
    };
    return Timer;
}());
