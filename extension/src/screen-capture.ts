/**
 * Screen capture utility for injection into pages
 */

// This script is injected into web pages for screen capture functionality

export function initializeScreenCapture() {
  // Listen for remote control events
  window.addEventListener('usha-remote-control', (event: Event) => {
    const customEvent = event as CustomEvent;
    const controlEvent = customEvent.detail;
    handleRemoteControl(controlEvent);
  });
}

function handleRemoteControl(event: any) {
  const { type, x, y, button, key, code, deltaX, deltaY } = event;

  switch (type) {
    case 'mousemove':
      simulateMouseMove(x, y);
      break;
    case 'mousedown':
      simulateMouseDown(x, y, button);
      break;
    case 'mouseup':
      simulateMouseUp(x, y, button);
      break;
    case 'click':
      simulateClick(x, y, button);
      break;
    case 'keydown':
      simulateKeyDown(key, code);
      break;
    case 'keyup':
      simulateKeyUp(key, code);
      break;
    case 'scroll':
      simulateScroll(deltaX, deltaY);
      break;
    case 'wheel':
      simulateWheel(x, y, deltaX, deltaY);
      break;
  }
}

function simulateMouseMove(x: number, y: number) {
  const element = document.elementFromPoint(x, y);
  if (element) {
    const event = new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y,
    });
    element.dispatchEvent(event);
  }
}

function simulateMouseDown(x: number, y: number, button: number) {
  const element = document.elementFromPoint(x, y);
  if (element) {
    const event = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y,
      button,
    });
    element.dispatchEvent(event);
  }
}

function simulateMouseUp(x: number, y: number, button: number) {
  const element = document.elementFromPoint(x, y);
  if (element) {
    const event = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y,
      button,
    });
    element.dispatchEvent(event);
  }
}

function simulateClick(x: number, y: number, button: number) {
  const element = document.elementFromPoint(x, y);
  if (element) {
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y,
      button,
    });
    element.dispatchEvent(event);
  }
}

function simulateKeyDown(key: string, code: string) {
  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key,
    code,
  });
  document.activeElement?.dispatchEvent(event);
}

function simulateKeyUp(key: string, code: string) {
  const event = new KeyboardEvent('keyup', {
    bubbles: true,
    cancelable: true,
    key,
    code,
  });
  document.activeElement?.dispatchEvent(event);
}

function simulateScroll(deltaX: number, deltaY: number) {
  window.scrollBy(deltaX, deltaY);
}

function simulateWheel(x: number, y: number, deltaX: number, deltaY: number) {
  const element = document.elementFromPoint(x, y);
  if (element) {
    const event = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      deltaX,
      deltaY,
    });
    element.dispatchEvent(event);
  }
}

// Initialize when script loads
if (typeof window !== 'undefined') {
  initializeScreenCapture();
}

