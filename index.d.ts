
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
    private timerID;
    constructor();
    calibrate(): void;
    setTimeout(functionOrCode: Function | string, delay?: number, ...params: any[]): number;
    setInterval(functionOrCode: Function | string, delay: number, ...params: any[]): number;
    setImmediate(functionOrCode: Function | string, ...params: any[]): number;
    clearTimeout(timeoutID: number): void;
    clearInterval(intervalID: number): void;
    clearImmediate(immediateID: number): undefined;
    clearAll(): void;
    hasTimer(timerID: number): boolean;
    release(): void;
    private $setWorkerEventListener();
    private $getRandomCode();
}
