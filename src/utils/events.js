export class JEvents {
  constructor() {
    this.handlers = {};
  }

  on(name, handler) {
    if (!this.handlers[name]) {
      this.handlers[name] = [];
    }
    this.handlers[name].push(handler);

    return () => {
      this.handlers[name] = this.handlers[name].filter((h) => h !== handler);
    };
  }

  emit(name, data) {
    console.log("JEvents::emit", name, data);
    this.handlers[name]?.forEach((handler) => {
      handler(data);
    });
  }
}
export class JActions {
  constructor() {
    this.queue = [];
    this.current = null;
  }
  add(action) {
    this.queue.push(action);
  }
  execute(context) {
    if (this.current || this.queue.length === 0) {
      return;
    }
    const action = this.queue.shift();
    this.current = action;
    const events = action.execute(context);
    events?.forEach((event) => context.jevents.emit(event.name, event));
    this.current = null;
  }
}
