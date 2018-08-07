# Timer 
A javascript Timer which works well in inactive tab.

### Why I write this library?
Most of the modern browsers throttled [setTimeout/setInterval](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setTimeout#Reasons_for_delays_longer_than_specified) to more than 1000ms if the page's inactive. In most of the cases, it saves CPU loads while the tabs are inactive, which's a good thing. But in some extreme cases (like sending heart beating packet), it requires the page to have a stable timer.  
I've tried to search if there's any methods to prevent browsers throttling timers, but so far it seems like [WebWorker](https://developer.mozilla.org/en/docs/Web/API/Web_Workers_API/Using_web_workers) could be the only solution to prevent throttling. 

### How to use it?
```javascript
    // Instanize the Timer.
    let T = new Timer();

    // The same API as window.setTimeout/window.setInterval
    T.setTimeout(fn, delay, ...params);
    T.setInterval(fn, delay, ...params);
    T.clearTimeout(timeoutID);
    T.clearInterval(intervalID);

    // These are newly added
    T.hasTimer(timerID)
    T.clearAll()
```

### Lisence
<pre>
    MIT License

    Copyright (c) 2018 Jacky Wang

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
</pre>