[English](../README.md) | 中文版

# Timer 
一个失焦以后也能正常计时的计时器。

### 为什么我要写这个库？
大部分现代浏览器在页面失去焦点后都会限制[setTimeout/setInterval](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setTimeout#Reasons_for_delays_longer_than_specified)的性能。大部分使用案例中，这么做的原因是为了节省 CPU 资源，从某种角度说这是一件好事。但在一些特殊案例中（比如游戏向服务器发射心跳包），我们仍然需要一个『准时』的计时器。  
我尝试在网路上搜索一个解决方案，目前看来只有 [WebWorker](https://developer.mozilla.org/en/docs/Web/API/Web_Workers_API/Using_web_workers) 可能是最好的解决方案。

### 如何使用?
#### 使用&lt;script&gt;标签
```html
    <script src="path/to/your/index.web.min.js"> 
```  

#### 使用 import/export 语法
```javascript
    import Timer from 'Timer';
```


```javascript
    // 初始化计时器
    let T = new Timer();

    // 校准，最大可能减小不同线程交流之间的时间差
    T.calibrate();

    // 和 window.setTimeout/window.setInterval 一样的 API
    T.setTimeout(fn, delay, ...params);
    T.setInterval(fn, delay, ...params);
    T.setImmediate(fn, ...params);
    T.clearTimeout(timeoutID);
    T.clearInterval(intervalID);
    T.clearImmediate(immediateID);

    // 这些是新加的
    T.hasTimer(timerID)
    T.clearAll()
```

### Lisence
MIT License  
Copyright (c) 2018 Jacky Wang