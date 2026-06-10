export class EventManager {
  constructor(elem = document) {
    this.elem = elem;
    this.name2funcs = {};
  }
  add(name, func) {
    if (!(name in this.name2funcs)) {
      this.name2funcs[name] = new Set();
      this.elem.addEventListener(name, (e) => this.handleEvent(name, e));
    }
    this.name2funcs[name].add(func);
  }
  remove(name, func) {
    if (name in this.name2funcs) {
      this.name2funcs[name].delete(func);
      this.elem.removeEventListener(name, func);
    }
  }
  handleEvent(name, event) {
    if (name in this.name2funcs) {
      for (const func of this.name2funcs[name]) {
        func(event);
      }
    }
  }
  dispose() {
    for (const name of Object.keys(this.name2funcs)) {
      for (const func of this.name2funcs[name]) {
        this.elem.removeEventListener(name, func);
      }
      this.name2funcs[name].clear();
    }
  }
}

export class KeyboardControls {
  constructor(eventManager) {
    this.eventManager = eventManager;
    this.onKeyDown = this._onKeyDown.bind(this);
    this.onKeyUp = this._onKeyUp.bind(this);
    this.keyStates = {};
    this.onKeydownListeners = {};
  }
  activate() {
    this.eventManager.add("keydown", this.onKeyDown);
    this.eventManager.add("keyup", this.onKeyUp);
  }
  deactivate() {
    this.eventManager.remove("keydown", this.onKeyDown);
    this.eventManager.remove("keyup", this.onKeyUp);
  }
  reset() {
    this.keyStates = {};
  }
  _onKeyDown(e) {
    // e.preventDefault();
    const key = e.key.toLowerCase();
    const shiftKey = e.shiftKey;
    this.keyStates[key] = true;
    this._handleKeydown(key, shiftKey);
  }
  _onKeyUp(e) {
    const key = e.key.toLowerCase();
    this.keyStates[key] = false;
  }
  addOnKeydown(key, handler) {
    if (!(key in this.onKeydownListeners)) {
      this.onKeydownListeners[key] = new Set();
    }
    this.onKeydownListeners[key].add(handler);
  }
  removeOnKeydown(key, handler) {
    if (key in this.onKeydownListeners) {
      this.onKeydownListeners[key].delete(handler);
    }
  }
  _handleKeydown(key, shift) {
    if (!(key in this.onKeydownListeners)) {
      return;
    }
    for (let handler of this.onKeydownListeners[key]) {
      handler(key, shift);
    }
  }
}

export class MouseControls {
  constructor(eventManager) {
    this.eventManager = eventManager;
    this._handleMouseMoveB = this._handleMouseMove.bind(this);
    this._handleMouseDownB = this._handleMouseDown.bind(this);
    this._handleMouseUpB = this._handleMouseUp.bind(this);
    this.clientV = [0,0];
    this.mouseV = [0,0];

    this.onMouseMove=null;
    this.onMouseDown=null;
    this.onMouseUp=null;
  }
  activate() {
    this.eventManager.add("mousemove", this._handleMouseMoveB);
    this.eventManager.add("mousedown", this._handleMouseDownB);
    this.eventManager.add("mouseup", this._handleMouseUpB);
  }
  deactivate() {
    this.eventManager.remove("mousemove", this._handleMouseMoveB);
    this.eventManager.remove("mousedown", this._handleMouseDownB);
    this.eventManager.remove("mouseup", this._handleMouseUpB);
  }
  _handleMouseMove(e) {
    
    const {width, height,top,left} = this.eventManager.elem.getBoundingClientRect();
    this.clientV = [e.clientY-top, e.clientX-left];
    this.mouseV[0] = ((e.clientX-left) / width) * 2 - 1;
    this.mouseV[1] = -(((e.clientY-top) / height) * 2 - 1);

    this.onMouseMove?.(this.mouseV);
  }
  _handleMouseDown(e) {
    this.onMouseDown?.(e.button);
  }
  _handleMouseUp(e) {
    this.onMouseUp?.(e.button);
  }
}
