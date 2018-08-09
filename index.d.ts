
    export interface TimerInfo {
        fn: Function | string;
        delay: number;
        params: any[];
        status: boolean;
        timer: number;
    }
    export class Timer {
        private intervalMap;
        private timeoutMap;
        private immediateSet;
        private worker;
        private timeError;
        private immediateCount;
        constructor();
        calibrate(): void;
        setTimeout(functionOrCode: Function | string, delay?: number, ...params: any[]): string;
        setInterval(functionOrCode: Function | string, delay: number, ...params: any[]): string;
        setImmediate(functionOrCode: Function | string, ...params: any[]): number;
        clearTimeout(timeoutID: string): void;
        clearInterval(intervalID: string): void;
        clearImmediate(immediateID: number): undefined;
        clearAll(): void;
        hasTimer(tickerID: string | number): boolean;
        private $setWorkerEventListener();
        private $getRandomCode();
    }
