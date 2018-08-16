"use strict";
var WORKER = "\n    self.addEventListener(\n        'message',\n        function(event){\n            var message = event.data.split(':');\n            var cmd = message[0];\n            var ID = message[1];\n            var delay = parseInt(message[2]);\n\n            switch(cmd) {\n                case 'calibrate':\n                    self.postMessage('calibrate:' + ID);\n                    break;\n                case 'createTimeout':\n                    var $timeout = setTimeout(function(){\n                        self.postMessage('timeout:' + ID + ':' + $timeout);\n                    }, delay);\n                    self.postMessage('createTimeout:' + ID + ':' + $timeout);\n                    break;\n                case 'createInterval':\n                    var $interval = setInterval(function(){\n                        self.postMessage('interval:' + ID + ':' + $interval);\n                    }, delay);\n                    self.postMessage('createInterval:' + ID + ':' + $interval);\n                    break;\n                case 'clearTimeout':\n                    clearTimeout(ID);\n                    break;\n                case 'clearInterval':\n                    clearInterval(ID);\n                    break;\n            }\n        },\n        false\n    );\n";
var Timer = /** @class */ (function () {
    function Timer() {
        this.intervalMap = new Map();
        this.timeoutMap = new Map();
        this.immediateSet = new Set();
        this.timeError = 0;
        this.immediateCount = 0;
        this.timerID = 0;
        this.worker = new Worker(URL.createObjectURL(new Blob([WORKER], { type: "application/javascript" })));
        this.$setWorkerEventListener();
    }
    Timer.prototype.calibrate = function () {
        var now = Date.now();
        this.worker.postMessage('calibrate:' + now.toString());
    };
    Timer.prototype.setTimeout = function (functionOrCode, delay) {
        var params = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            params[_i - 2] = arguments[_i];
        }
        var timeDelay = delay || 0;
        if (timeDelay > this.timeError) {
            timeDelay -= this.timeError;
        }
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
    Timer.prototype.setInterval = function (functionOrCode, delay) {
        var params = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            params[_i - 2] = arguments[_i];
        }
        var timeDelay = delay || 0;
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
    Timer.prototype.setImmediate = function (functionOrCode) {
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        if (window['setImmediate']) {
            var immediateID = window.setImmediate.apply(window, [functionOrCode].concat(params));
            this.immediateSet.add(immediateID);
            return immediateID;
        }
        var postMessage = Date.now().toString(16);
        var scope = this;
        function immediateCallback(event) {
            window.removeEventListener('message', immediateCallback);
            if (event.data === postMessage) {
                if (typeof functionOrCode === 'function') {
                    functionOrCode.apply(scope, params);
                }
                else {
                    eval(functionOrCode);
                }
            }
        }
        window.addEventListener('message', immediateCallback);
        this.immediateCount++;
        window.postMessage(postMessage, '*');
        return this.immediateCount;
    };
    Timer.prototype.clearTimeout = function (timeoutID) {
        var interval = this.intervalMap.get(timeoutID);
        if (interval) {
            this.worker.postMessage('clearInterval:' + interval.timer);
            this.intervalMap.delete(timeoutID);
        }
    };
    Timer.prototype.clearInterval = function (intervalID) {
        var interval = this.intervalMap.get(intervalID);
        if (interval) {
            this.worker.postMessage('clearInterval:' + interval.timer);
            this.intervalMap.delete(intervalID);
        }
    };
    Timer.prototype.clearImmediate = function (immediateID) {
        if (window['clearImmediate']) {
            clearImmediate(immediateID);
            this.immediateSet.delete(immediateID);
            return void 0;
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
        this.immediateSet.forEach(function (id) {
            _this.clearImmediate(id);
        });
    };
    Timer.prototype.hasTimer = function (timerID) {
        return (this.timeoutMap.has(timerID) || this.intervalMap.has(timerID) || this.immediateSet.has(timerID));
    };
    Timer.prototype.release = function () {
        this.worker.terminate();
        this.intervalMap = new Map();
        this.timeoutMap = new Map();
        this.immediateSet = new Set();
    };
    Timer.prototype.$setWorkerEventListener = function () {
        var _this = this;
        this.worker.addEventListener("message", function (event) {
            var response = event.data.split(':');
            var cmd = response[0];
            var ID = parseInt(response[1]);
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
                        var sentTime = ID;
                        _this.timeError = recievedTime - sentTime;
                    }
                    break;
            }
        });
    };
    Timer.prototype.$getRandomCode = function () {
        return ++this.timerID;
    };
    return Timer;
}());
