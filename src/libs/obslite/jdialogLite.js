import {
  jfinally,
  jskip,
  jstartWith,
  jtake,
  jtap,
} from "./joperators.js";
import { JSubject } from "./jsubject.js";

export class JDialogManager {
  static open$(
    createElement = (completeWith) => "<div>Empty</div>",
    rootSelector = "#dialogs",
  ) {
    const rootEl = document.querySelector(rootSelector);
    const subject$ = new JSubject();
    let containerEl = null;
    return subject$.pipe(
      jtake(1),
      jstartWith(null),
      jtap(() => {
        if (containerEl) {
          return;
        }

        containerEl = createElement((val) => {
          subject$.next(val);
          subject$.complete();
        });

        rootEl.appendChild(containerEl);
      }),
      jskip(1),
      jfinally(() => {
        containerEl?.remove();
      }),
    );
  }
}

export class JDialogTemplate {
  static info(text) {
    return this._createOptionsElementFn({ title: text });
  }
  static confirm(text) {
    return this._createOptionsElementFn({
      title: text,
      closable: false,
      options: [
        { text: "ok", onClick: (cw) => cw(true) },
        { text: "no", onClick: (cw) => cw(false) },
      ],
    });
  }
  static select(
    text,
    options = [
      { text: "Yes", value: true },
      { text: "No", value: false },
    ],
  ) {
    return this._createOptionsElementFn({
      title: text,
      closable: false,
      options: options.map(({text, value}) => ({
        text,
        onClick: (cw) => cw(value),
      })),
    });
  }
  static prompt(text) {
    return this._createInputElementFn({ text });
  }
  // ========== PRIVATE ======
  static _createOptionsElementFn({
    title = "Select option:",
    closable = true,
    options = [{ text: "ok", onClick: (cw) => cw(true) }],
  } = {}) {
    return (completeWith) => {
      const containerEl = document.createElement("div");

      const headerEl = document.createElement("div");
      headerEl.classList.add('row')
      const h2 = document.createElement("h2");
      h2.innerHTML = title;
      headerEl.appendChild(h2);

      if (closable) {
        const closeBtn = document.createElement("button");
        closeBtn.textContent = "X";
        closeBtn.addEventListener("click", () => {
          completeWith(undefined);
        });
        headerEl.appendChild(closeBtn);
      }
      containerEl.appendChild(headerEl);

      options.forEach((option) => {
        const btn = document.createElement("button");
        btn.textContent = option.text;
        btn.addEventListener("click", () => option.onClick(completeWith));
        containerEl.appendChild(btn);
      });
      return containerEl;
    };
  }
  static _createInputElementFn({
    title = "Enter value:",
    closable = true,
  } = {}) {
    return (completeWith) => {
      const containerEl = document.createElement("div");

      const headerEl = document.createElement("div");
      const h2 = document.createElement("h2");
      h2.innerHTML = title;
      headerEl.appendChild(h2);

      if (closable) {
        const closeBtn = document.createElement("button");
        closeBtn.textContent = "X";
        closeBtn.addEventListener("click", () => {
          completeWith(undefined);
        });
        headerEl.appendChild(closeBtn);
      }
      containerEl.appendChild(headerEl);

      const input = document.createElement("input");
      input.type = "text";
      containerEl.appendChild(input);

      const enterBtn = document.createElement("button");
      enterBtn.textContent = "Enter";
      enterBtn.addEventListener("click", () => {
        completeWith(input.value);
      });
      containerEl.appendChild(enterBtn);

      return containerEl;
    };
  }
}
