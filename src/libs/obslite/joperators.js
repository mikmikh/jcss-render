import { JObservable } from "./jobservable.js";

// ---------------------- BASIC ------------------------
export function jmap(projectFn) {
  return (source) =>
    new JObservable((observer) => {
      return source.subscribe({
        next: (value) => observer.next(projectFn(value)),
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });
    });
}
export function jtap(func) {
  return (source) =>
    new JObservable((observer) => {
      return source.subscribe({
        next: (value) => {
          func(value);
          observer.next(value);
        },
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });
    });
}
export function jfinally(func) {
  return (source) =>
    new JObservable((observer) => {
      return source.subscribe({
        next: (value) => observer.next(value),
        error: (err) => observer.error(err),
        complete: () => {
          func();
          observer.complete();
        },
      });
    });
}
export function jfilter(predicateFn) {
  return (source) =>
    new JObservable((observer) => {
      return source.subscribe({
        next: (value) => {
          if (!predicateFn(value)) {
            return;
          }
          observer.next(value);
        },
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });
    });
}
export function jtake(count) {
  return (source) =>
    new JObservable((observer) => {
      let taken = 0;
      return source.subscribe({
        next: (value) => {
          if (taken < count) {
            observer.next(value);
            taken++;
          } else {
            observer.complete();
          }
        },
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });
    });
}
export const jfirst = () => jtake(1);
export function jskip(count) {
  return (source) =>
    new JObservable((observer) => {
      let taken = 0;
      return source.subscribe({
        next: (value) => {
          if (taken < count) {
            taken++;
            return;
          } else {
            observer.next(value);
          }
        },
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });
    });
}
export function jstartWith(value) {
  return (source) =>
    new JObservable((observer) => {
      observer.next(value);
      return source.subscribe({
        next: (value) => observer.next(value),
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });
    });
}
// -------------------- EXTRA ----------------------
export function jdebounce(ms) {
  return (source) =>
    new JObservable((observer) => {
      let timeoutId = null;
      const subscription = source.subscribe({
        next: (value) => {
          timeoutId && clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            observer.next(value);
          }, ms);
        },
        error: (err) => observer.error(err),
        complete: () => {
          timeoutId && clearTimeout(timeoutId);
          observer.complete();
        },
      });
      return () => {
        timeoutId && clearTimeout(timeoutId);
        subscription();
      };
    });
}
export function jtakeUntil(untilSource) {
  return (source) =>
    new JObservable((observer) => {
      const sourceSub = source.subscribe({
        next: (value) => {
          observer.next(value);
        },
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });
      const untilSub = untilSource.subscribe({
        next: (value) => {
          observer.complete();
          sourceSub();
        },
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });
      return () => {
        untilSub();
        sourceSub();
      };
    });
}
export function jdelay(ms) {
  return (source) =>
    new JObservable((observer) => {
      const subscription = source.subscribe({
        next: (value) => {
          setTimeout(() => {
            observer.next(value);
          }, ms);
        },
        error: (err) => observer.error(err),
        complete: () => {
          observer.complete();
        },
      });
      return () => {
        subscription();
      };
    });
}
export function jwithLatestFrom(...observables) {
  return (source) =>
    new JObservable((observer) => {
      let sourceValue = null;
      let sourceEmitted = false;
      const observablesValues = new Array(observables.length).fill(undefined);
      const observablesEmitted = new Array(observables.length).fill(false);
      const checkEmit = () => {
        if (sourceEmitted && observablesEmitted.every((v) => v)) {
          observer.next([sourceValue, ...observablesValues]);
          sourceEmitted = false;
        }
      };
      const subscriptions = observables.map((obs, index) => {
        return obs.subscribe({
          next: (val) => {
            observablesValues[index] = val;
            observablesEmitted[index] = true;
            checkEmit();
          },
          error: (err) => observer.error(err),
          complete: () => {},
        });
      });
      const subscription = source.subscribe({
        next: (val) => {
          sourceValue = val;
          sourceEmitted = true;
          checkEmit();
        },
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });

      return () => {
        subscription();
        subscriptions.forEach((sub) => sub());
      };
    });
}
export function jdistinct() {
  return (source) =>
    new JObservable((observer) => {
      let prev = null;
      let emitted = false;
      return source.subscribe({
        next: (value) => {
          if (!emitted) {
            emitted = true;
            prev = value;
            observer.next(value);
          } else if (prev !== value) {
            prev = value;
            observer.next(value);
          }
        },
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });
    });
}
// ------------------ OPERATORS -----------------
export function jmergeMap(projectFn) {
  return (source) =>
    new JObservable((observer) => {
      let activeSubCount = 0;
      let completed = false;
      const checkCompleted = () => {
        if (completed && activeSubCount === 0) {
          observer.complete();
        }
      };
      const innerSubs = [];
      const subscription = source.subscribe({
        next: (value) => {
          activeSubCount++;
          const innerSource = projectFn(value);
          const innerSub = innerSource.subscribe({
            next: (innerValue) => observer.next(innerValue),
            error: (err) => observer.error(err),
            completed: () => {
              activeSubCount--;
              checkCompleted();
            },
          });
          innerSubs.push(innerSub);
        },
        error: (err) => observer.error(err),
        completed: () => {
          completed = true;
          checkCompleted();
        },
      });

      return () => {
        subscription();
        innerSubs.forEach((sub) => sub());
      };
    });
}
export function jswitchMap(projectFn) {
  return (source) =>
    new JObservable((observer) => {
      let innerSubscription = null;
      let completed = false;

      const subscription = source.subscribe({
        next: (value) => {
          innerSubscription?.();
          const innerSource = projectFn(value);
          innerSubscription = innerSource.subscribe({
            next: (innerValue) => observer.next(innerValue),
            error: (err) => observer.error(err),
            complete: () => {
              completed && observer.complete();
            },
          });
        },
        error: (err) => observer.error(err),
        complete: () => {
          completed = true;
          !innerSubscription && observer.complete();
        },
      });

      return () => {
        subscription();
        innerSubscription?.();
      };
    });
}
export function jconcatMap(projectFn) {
  return (source) =>
    new JObservable((observer) => {
      const buffer = [];
      let activeSubscription = null;
      let sourceCompleted = false;

      const processNext = () => {
        if (buffer.length === 0 || activeSubscription) {
          return;
        }
        const nextValue = buffer.shift();
        const innerSource = projectFn(nextValue);
        activeSubscription = innerSource.subscribe({
          next: (value) => observer.next(value),
          error: (err) => observer.error(err),
          complete: () => {
            activeSubscription = null;
            if (sourceCompleted && buffer.length === 0) {
              observer.complete();
            } else {
              processNext();
            }
          },
        });
      };

      const sourceSubscription = source.subscribe({
        next: (value) => {
          buffer.push(value);
          processNext();
        },
        error: (err) => observer.error(err),
        complete: () => {
          sourceCompleted = true;
          if (!activeSubscription && buffer.length === 0) {
            observer.complete();
          }
        },
      });

      return () => {
        sourceSubscription();
        activeSubscription?.();
      };
    });
}
export function jcatchError(handler) {
  return (source) =>
    new JObservable((observer) => {
      let innerSubscription = null;
      const subscription = source.subscribe({
        next: (value) => observer.next(value),
        error: (err) => {
          const result = handler(err);
          if (result instanceof JObservable) {
            innerSubscription = result.subscribe({
              next: (value) => observer.next(value),
              error: (err) => observer.error(err),
              complete: () => observer.complete(),
            });
          } else {
            observer.next(result);
          }
        },
        complete: () => observer.complete(),
      });
      return () => {
        subscription();
        innerSubscription?.();
      };
    });
}
// --------------------------------------------------------
export function jcombineLatest(...observables) {
  return new JObservable((observer) => {
    const values = new Array(observables.length).fill(undefined);
    const emitted = new Array(observables.length).fill(false);
    const completed = new Array(observables.length).fill(false);
    let allHaveValues = false;
    const subscriptions = observables.map((obs, index) => {
      return obs.subscribe({
        next: (value) => {
          values[index] = value;
          emitted[index] = true;
          if (!allHaveValues && emitted.every((v) => v)) {
            allHaveValues = true;
          }
          if (allHaveValues) {
            observer.next([...values]);
          }
        },
        error: (err) => observer.error(err),
        complete: () => {
          emitted[index] = true;
          if (completed.every((v) => v)) {
            observer.complete();
          }
        },
      });
    });
    return () => {
      subscriptions.forEach((sub) => sub());
    };
  });
}
export function jmerge(...observables) {
  return new JObservable((observer) => {
    const completed = new Array(observables.length).fill(false);
    const subscriptions = observables.map((obs, index) => {
      return obs.subscribe({
        next: (value) => observer.next(value),
        error: (err) => observer.next(err),
        complete: () => {
          completed[index] = true;
          if (completed.every((v) => v)) {
            observer.complete();
          }
        },
      });
    });

    return () => subscriptions.forEach((sub) => sub());
  });
}
// ------------- EXPERIMENT ----------
export function jinterval(ms) {
  return new JObservable((observer) => {
    let count = 0;
    const id = setInterval(() => {
      observer.next(count++);
    }, ms);
    return () => clearInterval(id);
  });
}
