# pipeline

move your data using node.js std lib

empowered by composed async generator functions and iterators 

## Install

```shell
npm install github:jtara1/pipeline
```

## Usage

```javascript
import { pipeline } from 'pipeline';
import { map, arraySink } from 'pipeline/steps/common.steps.js';

const result = await pipeline(
  [1, 2, 3, 4],
  map(value => value ** 2),
  reduceSink(),
);

console.log(result);
```


## TODO

- [x] common steps
- [ ] exit code 1
- [ ] re-read all steps
- [ ] refactor step functions to all be a function to explicitly call
- [ ] refactor modules to group sinks
- [ ] document pipeline, steps, and sinks
- [ ] docstrings for common.step.mjs functions
- [ ] testing for the functions ^

