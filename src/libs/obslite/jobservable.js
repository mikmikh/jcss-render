export class JObservable {
  /**
   *
   * @param {(observer) => ()=>{}} subscribeFn
   */
  constructor(subscribeFn) {
    this._subscribe = subscribeFn;
  }
  subscribe(observer) {
    const defaultObserver = {
      next: () => {},
      error: (err) => {
        throw err;
      },
      complete: () => {},
    };

    const resObserver = { ...defaultObserver, ...observer };
    let unsub = false;
    let resUnsubscribeFn = () => {
      unsub = true;
    };

    try {
      const unsubscribeFn = this._subscribe({
        next: (value) => {
          !unsub && resObserver.next(value);
        },
        error: (err) => {
          !unsub && resObserver.error(err);
        },
        complete: () => {
          !unsub && resObserver.complete();
          unsub = true;
        },
      });
      resUnsubscribeFn = () => {
        unsub = true;
        unsubscribeFn();
      };
    } catch (err) {
      resObserver.error(err);
    }
    return resUnsubscribeFn;
  }
  pipe(...operators) {
    return operators.reduce((obs, operator) => operator(obs), this);
  }
  static of(...values) {
    return new JObservable((observer) => {
      values.forEach((value) => observer.next(value));
      observer.complete();
      return () => {};
    });
  }
  static from(values) {
    return JObservable.of(...values);
  }
}
