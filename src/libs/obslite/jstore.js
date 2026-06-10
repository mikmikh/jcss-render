import { JObservable } from "./jobservable.js";
import { jfilter } from "./joperators.js";
import { JBehaviorSubject, JSubject } from "./jsubject.js";

export class JStore {
  constructor(reducer) {
    this._reducer = reducer;
    this.state = reducer();
    this.state$ = new JBehaviorSubject(this.state);
    this.action$ = new JSubject();
  }
  dispatch(action) {
    this.state = this._reducer(this.state, action);
    this.state$.next(this.state);
    this.action$.next(action);
  }
  select(selector) {
    return new JObservable((observer) => {
      return this.state$.subscribe({
        next: (state) => {
          observer.next(selector(state));
        },
      });
    });
  }
  /**
   *
   * @param  {(action$, store) => JObservable} effects
   */
  addEffect(...effectFns) {
    effectFns.forEach((effectFn) => {
      effectFn(this.action$, this).subscribe({
        next: (action) => {
          if (!action) {
            return;
          }
          const actions = Array.isArray(action) ? action : [action];
          actions.forEach((action) => this.dispatch(action));
        },
        error: (err) => console.log("Effect error", err),
      });
    });
  }
}

export function jcreateReducer(initState, handlers) {
  return (state = initState, action = null) => {
    if (!action || !(action.type in handlers)) {
      return state;
    }
    return handlers[action.type](state, action);
  };
}
export function jcombineReducers(key2reducer) {
  return (state = {}, action = null) => {
    const nextState = {};
    Object.keys(key2reducer).forEach((key) => {
      nextState[key] = key2reducer[key](state[key], action);
    });
    return nextState;
  };
}
export function jcreateSelector(...args) {
  const selectors = args.length > 1 ? args.slice(0, -1) : [(state) => state];
  const projector = args.at(-1);
  return (state) => {
    const values = selectors.map((selector) => selector(state));
    return projector(...values);
  };
}
export function jcreateSelectorMemo(...args) {
  const selectors = args.length > 1 ? args.slice(0, -1) : [(state) => state];
  const projector = args.at(-1);
  let lastResult = null;
  let lastArgs = null;
  return (state) => {
    const values = selectors.map((selector) => selector(state));
    // console.log("jcreateSelectorMemo values lastArgs", values, lastArgs);
    if (
      lastArgs &&
      values.length === lastArgs.length &&
      values.every((val, i) => val === lastArgs[i])
    ) {
      // console.log("[memo]", lastResult);
      return lastResult;
    }
    lastArgs = values;
    lastResult = projector(...values);
    return lastResult;
  };
}
export function jofType(...actionTypes) {
  return jfilter((action) => actionTypes.includes(action.type));
}
