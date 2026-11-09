(() => {
  'use strict';
  const triggers = document.querySelectorAll('.excalidraw-open');
  if (!triggers.length || typeof HTMLDialogElement === 'undefined') return;

  const dialog = document.createElement('dialog');
  dialog.className = 'diagram-viewer';
  dialog.setAttribute('aria-label', 'Diagram viewer');
  dialog.innerHTML = '<div class="diagram-toolbar"><span class="diagram-name"></span><span class="diagram-controls"><button type="button" data-action="out" aria-label="Zoom out">−</button><output aria-label="Zoom level">100%</output><button type="button" data-action="in" aria-label="Zoom in">+</button><button type="button" data-action="reset">Reset</button><button type="button" data-action="close" aria-label="Close diagram">×</button></span></div><div class="diagram-viewport" tabindex="0" aria-label="Diagram, scroll or drag to pan"><img alt=""></div>';
  document.body.append(dialog);
  const viewport = dialog.querySelector('.diagram-viewport');
  const image = viewport.querySelector('img');
  const zoomLabel = dialog.querySelector('output');
  let zoom = 1;
  let opener;
  function setZoom(value) {
    zoom = Math.max(0.5, Math.min(4, value));
    image.style.width = `${Math.round(zoom * 100)}%`;
    zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
  }
  triggers.forEach((trigger) => trigger.addEventListener('click', () => {
    const source = trigger.querySelector('img');
    opener = trigger;
    image.src = source.src;
    image.alt = source.alt;
    dialog.querySelector('.diagram-name').textContent = source.alt;
    setZoom(1);
    dialog.showModal();
  }));
  dialog.addEventListener('click', (event) => {
    const action = event.target.closest('button')?.dataset.action;
    if (action === 'close' || event.target === dialog) dialog.close();
    if (action === 'in') setZoom(zoom + 0.25);
    if (action === 'out') setZoom(zoom - 0.25);
    if (action === 'reset') setZoom(1);
  });
  dialog.addEventListener('close', () => opener?.focus());
  let drag;
  viewport.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    drag = { x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add('dragging');
  });
  viewport.addEventListener('pointermove', (event) => {
    if (!drag) return;
    viewport.scrollLeft = drag.left - (event.clientX - drag.x);
    viewport.scrollTop = drag.top - (event.clientY - drag.y);
  });
  function stopDrag() { drag = null; viewport.classList.remove('dragging'); }
  viewport.addEventListener('pointerup', stopDrag);
  viewport.addEventListener('pointercancel', stopDrag);
})();
