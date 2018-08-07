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
    private worker;
    private timeError;
    constructor();
    calibrate(): void;
    setTimeout(functionOrCode: Function | string, delay?: number, ...params: any[]): string;
    setInterval(functionOrCode: Function | string, delay: number, ...params: any[]): string;
    clearTimeout(timeoutCode: string): void;
    clearInterval(intervalCode: string): void;
    clearAll(): void;
    hasTimer(tikcerID: string): boolean;
    private $setWorkerEventListener();
    private $getRandomCode();
}
