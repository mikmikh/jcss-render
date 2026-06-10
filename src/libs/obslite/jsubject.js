import { JObservable } from "./jobservable.js";

export class JSubject extends JObservable {
    constructor() {
        super((observer) => {
            this.observerSet.add(observer);
            return () => {
                this.observerSet.delete(observer);
            };
        });
        this.observerSet = new Set();
        this.wasComplete = false;
        this.wasError = false;
    }
    next(value) {
        if (this.wasComplete || this.wasError) return;
        this.observerSet.forEach((observer) => observer.next(value));
    }
    error(err) {
        if (this.wasComplete || this.wasError) return;
        this.wasError = true;
        this.observerSet.forEach((observer) => observer.error(err));
        this.observerSet.clear();
    }
    complete() {
        if (this.wasComplete || this.wasError) return;
        this.wasComplete = true;
        this.observerSet.forEach((observer) => observer.complete());
        this.observerSet.clear();
    }
    asObservable() {
        return new JObservable((observer) => {
            return this.subscribe(observer);
        });
    }
}

export class JBehaviorSubject extends JSubject {
    constructor(initialValue) {
        super(initialValue);
        this._value = initialValue;
    }
    get value() {
        return this._value;
    }
    next(value) {
        this._value = value;
        super.next(value);
    }
    subscribe(observer) {
        observer.next(this._value);
        return super.subscribe(observer);
    }
}