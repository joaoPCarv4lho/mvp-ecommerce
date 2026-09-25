import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement <dialog> element methods (https://github.com/jsdom/jsdom/issues/3294).
// Minimal polyfill so Modal/Drawer (which use showModal()/close()) behave in tests.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}
