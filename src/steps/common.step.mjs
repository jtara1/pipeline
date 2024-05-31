import debug from 'debug'
const dbg = debug('pipeline');

import SerializationType from '../serialization-type.js';


export const forward = map(value => value);

export const forwardSink = async asyncIter => asyncIter;

export function collectionSink(collectedCallback = collected => collected) {
  return async function collectionSink(asyncIter) {
    const collected = [];

    for await (const value of asyncIter) {
      collected.push(value);
    }

    return collectedCallback(collected);
  };
}
// @alias collectionSink
export const arraySink = collectionSink;

/**
 * @param {function(*, *): *} reducer
 * @param {*} initialValue
 * @returns {AsyncGeneratorFunction}
 */
export function reductionSink(
  reducer = (reduction, value) => reduction + value,
  initialValue = 0,
) {
  return async function reductionSinkStep(asyncIter) {
    let reduction = initialValue;

    for await (const value of asyncIter) {
      reduction = await reducer(reduction, value);
    }

    return reduction;
  };
}

export const voidSink = async asyncIter => {
  for await (const _ of asyncIter) {}
}

// do something for each value optionally using the value and index
export function each(mapperFunction) {
  let index = 0;
  return async function* forEachStep(asyncIter) {
    for await (const value of asyncIter) {
      await mapperFunction(value, index++);
      yield value;
    }
  }
}
export const forEach = each;

export function map(mapperFunction) {
  return async function* mapStep(asyncIter) {
    for await (const value of asyncIter) {
      yield await mapperFunction(value);
    }
  }
}

export function flatMap(mapperFunction) {
  return async function* flatMapStep(asyncIter) {
    for await (const value of asyncIter) {
      for (const mappedValue of await mapperFunction(value)) {
        yield mappedValue;
      }
    }
  }
}

export function filterMany(filterSingle = value => value) {
  return async function* filterManyStep(asyncIter) {
    for await (const values of asyncIter) {
      yield values.filter(value => filterSingle(value));
    }
  }
}

export function filter(filterFunc = value => value) {
  return async function* filterStep(asyncIter) {
    for await (const value of asyncIter) {
      if (await filterFunc(value)) yield value;
    }
  }
}

export async function* flatten(asyncIter) {
  for await (const values of asyncIter) {
    for (const value of values) {
      yield value;
    }
  }
}

export function collect(amount = 1000) {
  return async function* collectStep(asyncIter) {
    let collected = [];

    for await (const value of asyncIter) {
      if (collected.length >= amount) {
        yield collected;
        collected = [];
      }

      collected.push(value);
    }

    if (collected.length) yield collected;
  }
}

export function limit(limit = Infinity) {
  let count = 0;

  return async function* limitStepExec(asyncIter) {
    if (limit <= count) return;

    for await (const value of asyncIter) {
      yield value;
      if (++count >= limit) return;
    }
  }
}

export function validate(acceptanceFunction) {
  return async function* validationStep(asyncIter) {
    for await (const value of asyncIter) {
      if (!acceptanceFunction(value)) {
        throw new Error(acceptanceFunction.name + ' - validation failed');
      }

      yield value;
    }
  };
}

export function softValidate(acceptanceFunc, acceptanceReasonFunc) {
  return async function* softValidationStep(asyncIter) {
    for await (const value of asyncIter) {
      if (!acceptanceFunc(value)) dbg(acceptanceReasonFunc(value).diff, 'softValidate: filtered out');
      else yield value;
    }
  };
}

// export function metrics(metric, importMeta) {
//   async function* metricsCountStep(asyncIter) {
//     for await (const valueOrValues of asyncIter) {
      // metricsInstance.add(importMeta, metric, valueOrValues);
      // yield valueOrValues;
    // }
  // }
  //
  // return decorateWithTraceableError(metricsCountStep);
// }

export function toJson({ from } = {}) {
  return async function* toJsonStep(asyncIter) {
    for await (const object of asyncIter) {
      if (from === SerializationType.JSON) yield { ...JSON.parse(object.rawData), ...object };
      else throw new Error('toJson: failure - no implementation for options.from');
    }
  };
}
