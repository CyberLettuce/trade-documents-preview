const paperSelector = [
  '.document-scaled-page',
  '.paper-space > .native-paper',
  '.paper-space > .paper',
  '.application-pdf-pages canvas',
  '.pdf-canvas canvas'
].join(',');
const diameter = 168;
const magnification = 2;

export function installReviewMagnifier(pane) {
  let source, lens, sample, suppressed, pointer, frame = 0;

  function hide() {
    cancelAnimationFrame(frame);
    frame = 0;
    lens?.remove();
    lens = sample = source = null;
  }

  function leave() {
    suppressed = null;
    hide();
  }

  function createLens(paper) {
    source = paper;
    lens = document.createElement('div');
    lens.className = 'review-magnifier';
    lens.inert = true;
    lens.setAttribute('aria-hidden', 'true');
    lens.setAttribute('translate', 'no');
    lens.style.setProperty('--review-magnifier-size', diameter + 'px');

    if (paper instanceof HTMLCanvasElement) {
      sample = document.createElement('canvas');
      sample.width = sample.height = Math.ceil(diameter * Math.min(devicePixelRatio || 1, 2));
    } else {
      sample = document.createElement('div');
      const copy = paper.cloneNode(true);
      copy.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
      sample.append(copy);
    }
    sample.className = 'review-magnifier-sample';
    lens.append(sample);
    paper.parentElement.append(lens);
  }

  function draw() {
    frame = 0;
    if (!source?.isConnected || !source.getClientRects().length) {
      hide();
      return;
    }
    const rect = source.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const {x, y} = pointer;
    const radius = diameter / 2;
    const offsetX = x - rect.left;
    const offsetY = y - rect.top;
    const edge = 4;
    const left = Math.max(edge, Math.min(x - radius, innerWidth - diameter - edge));
    const top = Math.max(edge, Math.min(y - radius, innerHeight - diameter - edge));
    lens.style.left = left + 'px';
    lens.style.top = top + 'px';

    if (source instanceof HTMLCanvasElement) {
      const context = sample.getContext('2d');
      const scaleX = source.width / rect.width;
      const scaleY = source.height / rect.height;
      const span = diameter / magnification;
      context.clearRect(0, 0, sample.width, sample.height);
      context.drawImage(source, (offsetX - span / 2) * scaleX, (offsetY - span / 2) * scaleY,
        span * scaleX, span * scaleY, 0, 0, sample.width, sample.height);
    } else {
      const copy = sample.firstElementChild;
      copy.style.boxSizing = 'border-box';
      copy.style.width = rect.width + 'px';
      copy.style.height = rect.height + 'px';
      copy.style.margin = '0';
      sample.style.transform = `translate(${radius - offsetX * magnification}px, ${radius - offsetY * magnification}px) scale(${magnification})`;
    }
  }

  function move(event) {
    if (event.pointerType !== 'mouse' || event.buttons) {
      hide();
      return;
    }
    const paper = event.target.closest(paperSelector);
    if (!paper || !pane.contains(paper)) {
      leave();
      return;
    }
    if (paper === suppressed) return;
    suppressed = null;
    pointer = {x: event.clientX, y: event.clientY};
    if (paper !== source) {
      hide();
      createLens(paper);
    }
    if (!frame) frame = requestAnimationFrame(draw);
  }

  function dismiss(event) {
    if (event.key === 'Escape' && source) {
      suppressed = source;
      hide();
    }
  }

  const listeners = new AbortController();
  const options = {signal: listeners.signal};
  pane.addEventListener('pointermove', move, options);
  pane.addEventListener('pointerleave', leave, options);
  pane.addEventListener('pointerdown', hide, options);
  document.addEventListener('keydown', dismiss, options);
  window.addEventListener('blur', leave, options);
  window.addEventListener('resize', hide, options);
  window.addEventListener('scroll', hide, {...options, capture: true});
  return () => {
    listeners.abort();
    leave();
  };
}
