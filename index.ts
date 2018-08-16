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

interface TimerInfo {
    fn: Function | string;
    delay: number;
    params: any[];
    status: boolean;
    timer: number;
}

class Timer {
    private intervalMap: Map<number, TimerInfo>;
    private timeoutMap: Map<number, TimerInfo>;
    private immediateSet: Set<number>;
    private worker: Worker;
    private timeError: number;
    private immediateCount: number;
    private timerID: number;

    constructor() {
        this.intervalMap = new Map();
        this.timeoutMap = new Map();
        this.immediateSet = new Set();
        this.timeError = 0;
        this.immediateCount = 0;
        this.timerID = 0;

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

    setTimeout(
        functionOrCode: Function | string,
        delay?: number,
        ...params: any[]
    ): number{
        let timeDelay: number = delay || 0;
        if(timeDelay > this.timeError) {
            timeDelay -= this.timeError;
        }
        let timeoutID: number = this.$getRandomCode();
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

    setInterval(functionOrCode: Function | string, delay: number, ...params: any[]): number{
        let timeDelay: number = delay || 0;
        let intervalID: number = this.$getRandomCode();
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

    setImmediate(functionOrCode: Function | string, ...params: any[]): number {
        if(window['setImmediate']) {
            let immediateID: number =  window.setImmediate(functionOrCode, ...params);
            this.immediateSet.add(immediateID);
            return immediateID;
        }

        let postMessage = Date.now().toString(16);
        let scope = this;

        function immediateCallback(event: MessageEvent) {
            window.removeEventListener('message', immediateCallback);
            if(event.data === postMessage) {
                if(typeof functionOrCode === 'function') {
                    functionOrCode.apply(scope, params);
                } else {
                    eval(functionOrCode);
                }
            }
        }

        window.addEventListener(
            'message',
            immediateCallback
        );
        
        this.immediateCount ++;
        window.postMessage(postMessage, '*');

        return this.immediateCount;
    }

    clearTimeout(timeoutID: number) {
        let interval: TimerInfo = this.intervalMap.get(timeoutID) as TimerInfo;
        if(interval) {
            this.worker.postMessage('clearInterval:' + interval.timer);
            this.intervalMap.delete(timeoutID);
        }
    }

    clearInterval(intervalID: number) {
        let interval: TimerInfo = this.intervalMap.get(intervalID) as TimerInfo;
        if(interval) {
            this.worker.postMessage('clearInterval:' + interval.timer);
            this.intervalMap.delete(intervalID);
        }
    }

    clearImmediate(immediateID: number) {
        if(window['clearImmediate']) {
            clearImmediate(immediateID);
            this.immediateSet.delete(immediateID);
            return void 0;
        }
    }

    clearAll() {
        this.timeoutMap.forEach((info: TimerInfo, key: number) => {
            this.clearTimeout(key);
        });
        this.intervalMap.forEach((info: TimerInfo, key: number) => {
            this.clearInterval(key);
        });
        this.immediateSet.forEach((id: number) => {
            this.clearImmediate(id);
        });
    }

    hasTimer(timerID: number): boolean {
        return (this.timeoutMap.has(timerID) || this.intervalMap.has(timerID) || this.immediateSet.has(timerID));
    }

    release() {
        this.worker.terminate();
        this.intervalMap = new Map();
        this.timeoutMap = new Map();
        this.immediateSet = new Set();
    }

    private $setWorkerEventListener() {
        this.worker.addEventListener("message", event => {
            let response: string[] = event.data.split(':')
            let cmd: string = response[0];
            let ID: number = parseInt(response[1]);
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
                        let sentTime = ID;
                        this.timeError = recievedTime - sentTime;
                    }
                    break;
            }

        });
    }

    private $getRandomCode(): number {
        return ++ this.timerID;
    }
}
