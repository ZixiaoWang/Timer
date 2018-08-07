const WORKER = `
    self.addEventListener(
        'message',
        function(event){
            var message = event.data.split(':');
            var cmd = message[0];
            var ID = message[1];
            var delay = parseInt(message[2]);

            switch(cmd) {
                case 'calibrate':
                    self.postMessage('calibrate:' + ID);
                    break;
                case 'createTimeout':
                    var $timeout = setTimeout(function(){
                        self.postMessage('timeout:' + ID + ':' + $timeout);
                    }, delay);
                    self.postMessage('createTimeout:' + ID + ':' + $timeout);
                    break;
                case 'createInterval':
                    var $interval = setInterval(function(){
                        self.postMessage('interval:' + ID + ':' + $interval);
                    }, delay);
                    self.postMessage('createInterval:' + ID + ':' + $interval);
                    break;
                case 'clearTimeout':
                    clearTimeout(ID);
                    break;
                case 'clearInterval':
                    clearInterval(ID);
                    break;
            }
        },
        false
    );
`;

export interface TimerInfo {
    fn: Function | string;
    delay: number;
    params: any[];
    status: boolean;
    timer: number;
}

export class Timer {
    private intervalMap: Map<string, TimerInfo>;
    private timeoutMap: Map<string, TimerInfo>;
    private worker: Worker;
    private timeError: number;

    constructor() {
        this.intervalMap = new Map();
        this.timeoutMap = new Map();
        this.timeError = 0;

        this.worker = new Worker(
            URL.createObjectURL(
                new Blob([WORKER], { type: "application/javascript" })
            )
        );

        this.$setWorkerEventListener();
    }

    calibrate() {
        let now = Date.now();
        this.worker.postMessage('calibrate:' + now.toString());
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setTimeout
    // var timeoutID = scope.setTimeout(function[, delay, param1, param2, ...]);
    // var timeoutID = scope.setTimeout(function[, delay]);
    // var timeoutID = scope.setTimeout(code[, delay]);
    setTimeout(
        functionOrCode: Function | string,
        delay?: number,
        ...params: any[]
    ): string{
        let timeDelay: number = (delay && delay >= 4) ? delay : 4;
        timeDelay -= this.timeError;
        let timeoutID: string = this.$getRandomCode();
        this.timeoutMap.set(timeoutID, {
            fn: functionOrCode,
            delay: timeDelay,
            params: params || [],
            status: false,
            timer: 0
        });
        this.worker.postMessage('createTimeout:' + timeoutID + ':' + timeDelay);
        return timeoutID;
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setInterval
    // var intervalID = scope.setInterval(func, delay[, param1, param2, ...]);
    // var intervalID = scope.setInterval(code, delay);
    setInterval(functionOrCode: Function | string, delay: number, ...params: any[]): string{
        let timeDelay: number = (delay && delay >= 4) ? delay : 4;
        timeDelay -= this.timeError;
        let intervalID: string = this.$getRandomCode();
        this.intervalMap.set(intervalID, {
            fn: functionOrCode,
            delay: timeDelay,
            params: params || [],
            status: false,
            timer: 0
        });
        this.worker.postMessage('createInterval:' + intervalID + ':' + timeDelay);
        return intervalID;
    }

    clearTimeout(timeoutCode: string) {
        let interval: TimerInfo = this.intervalMap.get(timeoutCode) as TimerInfo;
        if(interval) {
            this.worker.postMessage('clearInterval:' + interval.timer);
            this.intervalMap.delete(timeoutCode);
        }
    }

    clearInterval(intervalCode: string) {
        let interval: TimerInfo = this.intervalMap.get(intervalCode) as TimerInfo;
        if(interval) {
            this.worker.postMessage('clearInterval:' + interval.timer);
            this.intervalMap.delete(intervalCode);
        }
    }

    clearAll() {
        this.timeoutMap.forEach((info: TimerInfo, key: string) => {
            this.clearTimeout(key);
        })
        this.intervalMap.forEach((info: TimerInfo, key: string) => {
            this.clearInterval(key);
        })
    }

    hasTimer(tikcerID: string): boolean {
        return (this.timeoutMap.has(tikcerID) || this.intervalMap.has(tikcerID));
    }

    private $setWorkerEventListener() {
        this.worker.addEventListener("message", event => {
            let response: string[] = event.data.split(':')
            let cmd: string = response[0];
            let ID: string = response[1];
            let mark: string = response[2];

            switch (cmd) {
                case 'createTimeout':
                    {
                        let timeoutInfo: TimerInfo = this.timeoutMap.get(ID) as TimerInfo;
                        if(timeoutInfo) {
                            timeoutInfo.status = true;
                            timeoutInfo.timer = parseInt(mark);
                        }
                    }
                    break;
                case 'createInterval':
                    {
                        let intervalInfo: TimerInfo = this.intervalMap.get(ID) as TimerInfo;
                        if(intervalInfo) {
                            intervalInfo.status = true;
                            intervalInfo.timer = parseInt(mark);
                        }
                    }
                    break;
                case 'timeout':
                    {
                        let timeoutInfo: TimerInfo = this.timeoutMap.get(ID) as TimerInfo;
                        if(timeoutInfo && timeoutInfo.status === true) {
                            if(typeof timeoutInfo.fn === 'function') {
                                /** @todo 確定下上下文 */
                                timeoutInfo.fn.apply(this, timeoutInfo.params);
                            } else {
                                eval(timeoutInfo.fn);
                            }
                        }
                    }
                    break;
                case 'interval':
                    {
                        let intervalInfo: TimerInfo = this.intervalMap.get(ID) as TimerInfo;
                        if(intervalInfo && intervalInfo.status === true) {
                            if(typeof intervalInfo.fn === 'function') {
                                /** @todo 確定下上下文 */
                                intervalInfo.fn.apply(this, intervalInfo.params);
                            } else {
                                eval(intervalInfo.fn);
                            }
                        }
                    }
                    break;
                case 'calibrate': 
                    {
                        let recievedTime = Date.now();
                        let sentTime = parseInt(ID);
                        this.timeError = recievedTime - sentTime;
                    }
                    break;
            }

        });
    }

    private $getRandomCode(): string {
        return (performance.now() * Math.random() * 1000000000).toString(16).replace('.', '');
    }
}
