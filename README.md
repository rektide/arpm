# arpm
**Asynchronous Requests Per Minute**

An async generator that fires at a given ticks/minute speed. **arpm** 

`npm install arpm` will fetch this library/example.

# Example

`./arpm.js` is executable, and will count at a rate of 78/minute. That code is reproduced here:

```
var generate = require('most').generate
var arpm = require('arpm)

var rate = Number.parseInt(process.argv[2]) || 78
var count = 0
generate(arpm(rate)).observe(function () {
  console.log(count++)
})
```

arpm.js can also be executed with a single numeric parameter, the request rate. `./arpm.js 200` will count 200 a minute, while `./arpm.js 33` would count 33 a minute.

# Explainer

arpm uses one setInterval (by default running at 1Hz) to produce `credit` for the async generator, while the async generator consumes one `credit` each iteration, or, if no credit is available, the async generator returns a `waiting` Promise that will resolve (consuming one credit) as soon as credit becomes available.

Using the Example program, which has a default rate of 78/minute, we can see 0, 1, & 2 outputted once per second. In the following second, 3 & 4 are both outputted. This illustrates the rate behavior of arpm: 78/60min is 1.3 credit / second, so after 3 is rendered, there is still 1.2 credit available for consuming, allowing 4 to immediately fire. With n as the numbers printed out, at tick of 1Hz, we can look at the total credits produced and remaining credit available over time:

| n | tick | aggregate credits | available credits |
| --- | ---- | ----------------- | ----------------- |
| 0 | 0s | 1.3 | 0.3 |
| 1 | 1 | 2.6 | 0.6 |
| 2 | 2 | 3.9 | 0.9 |
| 3 | 3 | 4.2 | **1.2** |
| 4 | **3** | 4.2 | 0.2 |
| 5 | 4 | 5.5 | 0.5 |
| 6 | 5 | 6.8 | 0.8 |
| 7 | 6 | 8.1 | **1.1** |
| 8 | **6** | 8.1 | 0.1 |

One could also imagine a slow rate, say 33/minute, which would build 0.55 credit per 1Hz tick 

| n | tick | aggregate credits | available credits |
| --- | ---- | ----------------- | ----------------- |
|   | 0s | 0.55 | 0.55 |
| 1 | 1 | 1.1 | 0.1 |
|   | 2 | 1.65 | 0.65 |
| 2 | 3 | 2.2 | 0.2 |
|   | 4 | 2.75 | 0.75 |
| 3 | 5 | 3.3 | 0.3 |
|   | 6 | 3.85 | 0.8 |
| 4 | 7 | 4.4 | 0.4 |
|   | 8 | 4.95 | 0.95 |
| 5 | 9 | 5.5 | 0.5 |
| 6 | 10 | 6.05 | 0.05 |

Here we see it usually takes two ticks to build a full credit to consume.
