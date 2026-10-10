import { useCallback, useEffect, useRef, useState } from "react";
import { cssFont, fontStack } from "./useBoard";

// The drawing surface.
//
// The canvas is sized in device pixels and scaled back down, so a stroke is
// as crisp as the screen allows rather than as crisp as CSS pixels allow —
// which is the difference between handwriting that reads and handwriting
// that smudges on a projector.

const GRID = 48;

// A stroke is drawn through the midpoints of its samples, with a quadratic
// curve between them. Joining the raw points instead gives the visible
// corners that make digital handwriting look like a seismograph.
// Typed text. Lines are laid out at a fixed multiple of the font size so
// the box measured when it was typed still matches what is drawn.
export const LINE_HEIGHT = 1.3;

const drawText = (ctx, item) => {
  const size = item.width || 22;
  ctx.save();
  ctx.font = cssFont({ bold: item.bold, italic: item.italic, size, font: item.font });
  ctx.fillStyle = item.colour;
  ctx.textBaseline = "top";
  ctx.globalAlpha = 1;
  const [x, y] = item.points;
  String(item.text || "").split("\n").forEach((line, i) => {
    ctx.fillText(line, x, y + i * size * LINE_HEIGHT);
  });
  ctx.restore();
};

const drawStroke = (ctx, stroke, scale) => {
  if (stroke.tool === "text") { drawText(ctx, stroke); return; }
  const pts = stroke.points;
  if (!pts || pts.length < 3) return;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = stroke.colour;
  ctx.globalAlpha = stroke.tool === "highlighter" ? 0.32 : 1;
  ctx.globalCompositeOperation = "source-over";

  // A single tap is a dot, not a line.
  if (pts.length === 3) {
    ctx.beginPath();
    ctx.fillStyle = stroke.colour;
    ctx.arc(pts[0], pts[1], Math.max(stroke.width * (stroke.tool === "highlighter" ? 2 : 1) * (pts[2] || 0.5), 0.6), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }

  const base = stroke.width * (stroke.tool === "highlighter" ? 3.2 : 1);

  for (let i = 3; i < pts.length; i += 3) {
    const x0 = pts[i - 3];
    const y0 = pts[i - 2];
    const p0 = pts[i - 1];
    const x1 = pts[i];
    const y1 = pts[i + 1];
    const p1 = pts[i + 2];

    // Pressure from a real pen varies the width along the stroke; a mouse
    // reports a constant 0.5, which simply gives an even line.
    const w = base * (0.55 + (((p0 + p1) / 2) || 0.5) * 0.9);
    ctx.lineWidth = Math.max(w, 0.4 / scale);

    ctx.beginPath();
    if (i === 3) {
      ctx.moveTo(x0, y0);
    } else {
      ctx.moveTo((pts[i - 6] + x0) / 2, (pts[i - 5] + y0) / 2);
    }
    ctx.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
};

export default function BoardCanvas({ board }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const frame = useRef(0);
  const panning = useRef(null);
  const erasing = useRef(false);
  const pointers = useRef(new Map()); // for pinch zoom

  const {
    strokesRef, liveRef, viewRef, pointerRef, repaintRef,
    tool, width, page, canDraw, zoom, setZoom,
    beginStroke, extendStroke, endStroke, eraseAt, sendPointer,
  } = board;

  /* --------------------------- coordinates --------------------------- */

  // Screen pixels to board coordinates. Everything is stored in board
  // space, so this is the only place the two meet.
  const toBoard = useCallback((clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const v = viewRef.current;
    return {
      x: (clientX - rect.left - v.x) / v.scale,
      y: (clientY - rect.top - v.y) / v.scale,
    };
  }, [viewRef]);

  /* ----------------------------- painting ----------------------------- */

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }

    const ctx = canvas.getContext("2d");
    const v = viewRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Paper. A faint grid gives the eye something to size writing against,
    // and shows that panning is doing something.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.scale(v.scale, v.scale);

    const left = -v.x / v.scale;
    const top = -v.y / v.scale;
    const right = left + w / v.scale;
    const bottom = top + h / v.scale;
    ctx.strokeStyle = "#eef2f7";
    ctx.lineWidth = 1 / v.scale;
    ctx.beginPath();
    for (let x = Math.floor(left / GRID) * GRID; x < right; x += GRID) {
      ctx.moveTo(x, top); ctx.lineTo(x, bottom);
    }
    for (let y = Math.floor(top / GRID) * GRID; y < bottom; y += GRID) {
      ctx.moveTo(left, y); ctx.lineTo(right, y);
    }
    ctx.stroke();

    for (const stroke of strokesRef.current) {
      if (stroke.page !== page) continue;
      drawStroke(ctx, stroke, v.scale);
    }
    // Strokes other people are still drawing.
    for (const stroke of liveRef.current.values()) {
      if (stroke.page !== page) continue;
      drawStroke(ctx, stroke, v.scale);
    }

    // Where the teacher is pointing, for the few seconds after they move.
    const ptr = pointerRef.current;
    if (ptr && ptr.page === page && Date.now() - ptr.at < 2500) {
      ctx.beginPath();
      ctx.fillStyle = "rgba(220,38,38,0.65)";
      ctx.arc(ptr.x, ptr.y, 7 / v.scale, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }, [strokesRef, liveRef, viewRef, pointerRef, page]);

  // The queued frame calls whatever `paint` is current when it runs, not
  // the one captured when it was queued. Without this, a repaint asked for
  // just before the page changed would win the `frame.current` guard and
  // draw the old page — which is exactly what turning a page used to do.
  const paintRef = useRef(paint);
  useEffect(() => { paintRef.current = paint; });

  const schedule = useCallback(() => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      paintRef.current();
    });
  }, []);

  useEffect(() => {
    repaintRef.current = schedule;
    schedule();
  }, [repaintRef, schedule]);

  // A window resize is not the only way this box changes size — going
  // full screen, or the page simply settling after first paint, moves it
  // without any window event. Watching the element itself is what keeps the
  // canvas the same size as the space it is sitting in.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;
    const onResize = () => schedule();
    window.addEventListener("resize", onResize);
    let observer;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => schedule());
      observer.observe(wrap);
    }
    return () => {
      window.removeEventListener("resize", onResize);
      observer?.disconnect();
    };
  }, [schedule]);

  useEffect(() => { schedule(); }, [page, schedule]);

  /* ------------------------------ input ------------------------------ */

  const applyZoom = useCallback((factor, cx, cy) => {
    const v = viewRef.current;
    const next = Math.min(Math.max(v.scale * factor, board.MIN_ZOOM), board.MAX_ZOOM);
    const k = next / v.scale;
    // Keep whatever is under the cursor under the cursor.
    v.x = cx - (cx - v.x) * k;
    v.y = cy - (cy - v.y) * k;
    v.scale = next;
    setZoom(next);
    schedule();
  }, [viewRef, setZoom, schedule, board.MIN_ZOOM, board.MAX_ZOOM]);

  // Exposed so the toolbar buttons zoom about the middle of the view.
  useEffect(() => {
    board.zoomBy = (factor) => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      applyZoom(factor, wrap.clientWidth / 2, wrap.clientHeight / 2);
    };
    board.resetView = () => {
      viewRef.current = { x: 0, y: 0, scale: 1 };
      setZoom(1);
      schedule();
    };
  }, [board, applyZoom, viewRef, setZoom, schedule]);

  const onPointerDown = (e) => {
    const wrap = wrapRef.current;
    pointers.current.set(e.pointerId, e);

    // Two fingers: pinch and pan, never draw.
    if (pointers.current.size === 2) {
      panning.current = null;
      return;
    }

    // Middle button, space held, or an explicit pan tool moves the paper.
    if (e.button === 1 || e.shiftKey) {
      panning.current = { x: e.clientX, y: e.clientY, view: { ...viewRef.current } };
      wrap.setPointerCapture(e.pointerId);
      return;
    }

    // A pen's eraser end is a real button — honour it whatever tool is on.
    const eraserEnd = e.pointerType === "pen" && e.button === 5;
    if (!canDraw) return;

    const { x, y } = toBoard(e.clientX, e.clientY);

    // Typing: clicking puts the caret down. Clicking again while a box is
    // open commits what is in it first, so you can type one label after
    // another without reaching for the mouse twice.
    if (tool === "text" && !eraserEnd) {
      if (editorRef.current) { commitText(); }
      else { openEditor({ x, y, value: "" }); }
      return;
    }

    wrap.setPointerCapture(e.pointerId);

    if (tool === "eraser" || eraserEnd) {
      erasing.current = true;
      eraseAt(x, y, Math.max(width * 1.5, 8) / viewRef.current.scale);
      return;
    }
    beginStroke(x, y, e.pointerType === "pen" ? e.pressure || 0.5 : 0.5);
  };

  const onPointerMove = (e) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, e);

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const mid = { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
      const last = panning.current?.pinch;
      if (last) {
        const rect = wrapRef.current.getBoundingClientRect();
        applyZoom(dist / last.dist, mid.x - rect.left, mid.y - rect.top);
        const v = viewRef.current;
        v.x += mid.x - last.mid.x;
        v.y += mid.y - last.mid.y;
        schedule();
      }
      panning.current = { pinch: { dist, mid } };
      return;
    }

    if (panning.current?.view) {
      const v = viewRef.current;
      v.x = panning.current.view.x + (e.clientX - panning.current.x);
      v.y = panning.current.view.y + (e.clientY - panning.current.y);
      schedule();
      return;
    }

    const { x, y } = toBoard(e.clientX, e.clientY);
    sendPointer(x, y);

    if (erasing.current) {
      eraseAt(x, y, Math.max(width * 1.5, 8) / viewRef.current.scale);
      return;
    }

    // A pen reports far more positions than the browser fires events for.
    // Using them all is what makes a fast flick a smooth curve.
    const events = typeof e.nativeEvent.getCoalescedEvents === "function"
      ? e.nativeEvent.getCoalescedEvents()
      : [e.nativeEvent];
    for (const ev of events.length ? events : [e.nativeEvent]) {
      const p = toBoard(ev.clientX, ev.clientY);
      extendStroke(p.x, p.y, ev.pointerType === "pen" ? ev.pressure || 0.5 : 0.5);
    }
  };

  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) panning.current = null;
    erasing.current = false;
    endStroke();
    try { wrapRef.current?.releasePointerCapture(e.pointerId); } catch { /* already gone */ }
  };

  const onWheel = (e) => {
    const rect = wrapRef.current.getBoundingClientRect();
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      applyZoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - rect.left, e.clientY - rect.top);
      return;
    }
    const v = viewRef.current;
    v.x -= e.deltaX;
    v.y -= e.deltaY;
    schedule();
  };

  // The browser's own gestures would pan the page instead of the board.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;
    const stop = (e) => { if (e.ctrlKey) e.preventDefault(); };
    wrap.addEventListener("wheel", stop, { passive: false });
    return () => wrap.removeEventListener("wheel", stop);
  }, []);

  /* ------------------------------- typing ------------------------------- */

  // The caret, while something is being typed. Board coordinates, so it
  // stays put when the board is panned or zoomed mid-sentence.
  const [editor, setEditor] = useState(null);
  // The same thing as `editor`, readable the instant it changes — a second
  // click has to see the open box before React has re-rendered.
  const editorRef = useRef(null);
  const textRef = useRef(null);
  const measureRef = useRef(null);

  const openEditor = useCallback((next) => {
    editorRef.current = next;
    setEditor(next);
  }, []);

  useEffect(() => {
    if (editor) setTimeout(() => textRef.current?.focus(), 0);
  }, [editor]);

  // Close the box when the tool changes, so switching to the pen does not
  // leave a half-typed label floating.
  useEffect(() => {
    if (tool !== "text" && editorRef.current) commitText();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool]);

  // The box the text will occupy, measured with the very font the canvas
  // will draw it in.
  const measure = useCallback((value, size) => {
    if (!measureRef.current) measureRef.current = document.createElement("canvas");
    const ctx = measureRef.current.getContext("2d");
    ctx.font = cssFont({ bold: board.bold, italic: board.italic, size, font: board.font });
    const lines = String(value).split("\n");
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width), 0);
    return { w, h: lines.length * size * LINE_HEIGHT };
  }, [board.bold, board.italic, board.font]);

  // Deliberately NOT done inside a setEditor updater. React may run an
  // updater more than once, and adding the text from in there put every
  // label on the board twice — and reported "setState while rendering
  // another component", because addText touches the parent's state.
  const commitText = useCallback(() => {
    const open = editorRef.current;
    if (!open) return;
    editorRef.current = null;
    setEditor(null);

    const value = open.value;
    if (!value.trim()) return;
    const { w, h } = measure(value, board.textSize);
    board.addText({ x: open.x, y: open.y, text: value, w, h });
  }, [board, measure]);

  const cursor = !canDraw ? "default"
    : tool === "eraser" ? "cell"
    : tool === "text" ? "text"
    : "crosshair";

  return (
    <div
      ref={wrapRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
      onWheel={onWheel}
      className="relative w-full h-full overflow-hidden bg-white touch-none select-none"
      style={{ cursor }}
    >
      <canvas ref={canvasRef} className="block" />

      {editor && (
        // Sized and positioned in screen pixels from the board position, so
        // what you type sits exactly where it will be drawn.
        <textarea
          ref={textRef}
          value={editor.value}
          onChange={(e) => openEditor({ ...editor, value: e.target.value })}
          onBlur={commitText}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Escape") { editorRef.current = null; setEditor(null); }
            else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { commitText(); }
          }}
          onPointerDown={(e) => e.stopPropagation()}
          spellCheck={false}
          placeholder="Type…"
          rows={1}
          className="absolute outline-none resize-none bg-transparent overflow-hidden"
          style={{
            left: editor.x * viewRef.current.scale + viewRef.current.x,
            top: editor.y * viewRef.current.scale + viewRef.current.y,
            font: cssFont({
              bold: board.bold,
              italic: board.italic,
              size: board.textSize * viewRef.current.scale,
              font: board.font,
            }),
            fontFamily: fontStack(board.font),
            lineHeight: LINE_HEIGHT,
            color: board.colour,
            caretColor: board.colour,
            minWidth: 40,
            width: Math.max(measure(editor.value || "M", board.textSize).w * viewRef.current.scale + 24, 60),
            height: measure(editor.value || "M", board.textSize).h * viewRef.current.scale + 6,
            border: `1px dashed ${board.colour}66`,
            padding: 0,
          }}
        />
      )}
      {zoom !== 1 && (
        <span className="absolute bottom-3 left-3 text-[11px] font-bold px-2 py-1 rounded-lg bg-slate-900/70 text-white">
          {Math.round(zoom * 100)}%
        </span>
      )}
    </div>
  );
}
