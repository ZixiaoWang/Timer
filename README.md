# Timer 
A javascript Timer which works well in inactive tab.

### Why I write this library?
Most of the modern browsers throttled [setTimeout/setInterval](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setTimeout#Reasons_for_delays_longer_than_specified) to more than 1000ms if the page's inactive. In most of the cases, it saves CPU loads while the tabs are inactive, which's a good thing. But in some extreme cases (like sending heart beating packet), it requires the page to have a stable timer.  
I've tried to search if there's any methods to prevent browsers throttling timers, but so far it seems like [WebWorker](https://developer.mozilla.org/en/docs/Web/API/Web_Workers_API/Using_web_workers) could be the only solution to prevent throttling. 

### How to use it?
#### User &lt;script&gt; tag
```html
    <script src="path/to/your/index.web.min.js"> 
```  

#### Use import/export syntax
```javascript
    import Timer from 'Timer';
```


```javascript
    // Instanize the Timer.
    let T = new Timer();

    // The same API as window.setTimeout/window.setInterval
    T.setTimeout(fn, delay, ...params);
    T.setInterval(fn, delay, ...params);
    T.setImmediate(fn, ...params);
    T.clearTimeout(timeoutID);
    T.clearInterval(intervalID);
    T.clearImmediate(immediateID);

    // These are newly added
    T.hasTimer(timerID)
    T.clearAll()
```

### TODO
1. add test cases.

### Lisence
MIT License  
Copyright (c) 2018 Jacky Wang