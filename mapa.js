const mapImageEl = document.getElementById("mapImage");
const mapViewportEl = document.getElementById("mapViewport");
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const backToCardsBtn = document.getElementById("backToCardsBtn");

const MAP_MAX_SCALE = 2.4;
const MAP_ZOOM_STEP = 0.12;
const MAP_DRAG_THRESHOLD_PX = 6;
const MAP_INITIAL_ZOOM_FACTOR = 1;

const mapState = { scale: 1, x: 0, y: 0 };
const mapDrag = {
  active: false,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
  pointerId: null,
  moved: false,
};

const getViewportRect = () => {
  if (!mapViewportEl) return { width: 0, height: 0 };
  const rect = mapViewportEl.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
};

const getScaledMapSize = () => {
  if (!mapImageEl) return { width: 0, height: 0 };
  const naturalWidth = mapImageEl.naturalWidth || 0;
  const naturalHeight = mapImageEl.naturalHeight || 0;
  return { width: naturalWidth * mapState.scale, height: naturalHeight * mapState.scale };
};

const getFitScale = () => {
  if (!mapImageEl || !mapViewportEl) return 1;
  const viewport = getViewportRect();
  const naturalWidth = mapImageEl.naturalWidth || 1;
  const naturalHeight = mapImageEl.naturalHeight || 1;
  const fit = Math.min(viewport.width / naturalWidth, viewport.height / naturalHeight);
  if (!Number.isFinite(fit) || fit <= 0) return 1;
  return Math.min(1, fit * 0.98);
};

const clampMapPosition = (x, y) => {
  const viewport = getViewportRect();
  const scaled = getScaledMapSize();
  const maxOffsetX = Math.max((scaled.width - viewport.width) / 2, 0);
  const maxOffsetY = Math.max((scaled.height - viewport.height) / 2, 0);

  return {
    x: Math.min(Math.max(x, -maxOffsetX), maxOffsetX),
    y: Math.min(Math.max(y, -maxOffsetY), maxOffsetY),
  };
};

const applyMapTransform = () => {
  if (!mapImageEl) return;
  const clamped = clampMapPosition(mapState.x, mapState.y);
  mapState.x = clamped.x;
  mapState.y = clamped.y;
  mapImageEl.style.transform = `translate3d(${mapState.x}px, ${mapState.y}px, 0) scale(${mapState.scale})`;
};

const resetMapTransform = () => {
  const baseScale = getFitScale();
  const targetScale = Math.min(MAP_MAX_SCALE, baseScale * MAP_INITIAL_ZOOM_FACTOR);
  mapState.scale = Math.max(baseScale, targetScale);
  mapState.x = 0;
  mapState.y = 0;
  applyMapTransform();
};

const zoomMap = (delta) => {
  const minScale = getFitScale();
  mapState.scale = Math.min(MAP_MAX_SCALE, Math.max(minScale, mapState.scale + delta));
  applyMapTransform();
};

const startMapDrag = (event) => {
  if (!mapViewportEl) return;
  mapDrag.active = true;
  mapDrag.moved = false;
  mapDrag.startX = event.clientX;
  mapDrag.startY = event.clientY;
  mapDrag.originX = mapState.x;
  mapDrag.originY = mapState.y;
  mapDrag.pointerId = event.pointerId;
  mapViewportEl.setPointerCapture(event.pointerId);
  mapViewportEl.classList.add("is-dragging");
};

const moveMapDrag = (event) => {
  if (!mapDrag.active || !mapViewportEl) return;
  if (mapDrag.pointerId !== null && event.pointerId !== mapDrag.pointerId) return;
  event.preventDefault();
  const deltaX = event.clientX - mapDrag.startX;
  const deltaY = event.clientY - mapDrag.startY;
  if (
    !mapDrag.moved &&
    (Math.abs(deltaX) > MAP_DRAG_THRESHOLD_PX || Math.abs(deltaY) > MAP_DRAG_THRESHOLD_PX)
  ) {
    mapDrag.moved = true;
  }
  mapState.x = mapDrag.originX + deltaX;
  mapState.y = mapDrag.originY + deltaY;
  applyMapTransform();
};

const endMapDrag = (event) => {
  if (!mapDrag.active || !mapViewportEl) return;
  if (mapDrag.pointerId !== null && event.pointerId !== mapDrag.pointerId) return;
  mapDrag.active = false;
  mapViewportEl.classList.remove("is-dragging");
  if (mapDrag.pointerId !== null && mapViewportEl.hasPointerCapture(mapDrag.pointerId)) {
    mapViewportEl.releasePointerCapture(mapDrag.pointerId);
  }
  mapDrag.pointerId = null;
};

const bootstrap = () => {
  if (backToCardsBtn) {
    backToCardsBtn.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "index.html";
    });
  }

  if (!mapImageEl || !mapViewportEl) return;

  mapViewportEl.addEventListener("pointerdown", startMapDrag);
  mapViewportEl.addEventListener("pointermove", moveMapDrag);
  mapViewportEl.addEventListener("pointerup", endMapDrag);
  mapViewportEl.addEventListener("pointercancel", endMapDrag);
  mapViewportEl.addEventListener("pointerleave", endMapDrag);

  mapImageEl.addEventListener("load", resetMapTransform);

  zoomInBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    zoomMap(MAP_ZOOM_STEP);
  });

  zoomOutBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    zoomMap(-MAP_ZOOM_STEP);
  });

  window.addEventListener("resize", resetMapTransform);

  if (mapImageEl.complete) {
    resetMapTransform();
  }
};

bootstrap();
