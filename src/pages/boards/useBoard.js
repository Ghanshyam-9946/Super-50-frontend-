import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import api from "../../services/api";

// Everything the whiteboard does, kept out of the component.
//
// Two ideas hold the whole thing together:
//
// 1. A stroke is a list of points in BOARD coordinates, never screen ones.
//    Zooming and panning only change how they are drawn, so writing stays
//    sharp at any magnification and a viewer at a different zoom still sees
//    the same board.
//
// 2. The owner's browser owns the document. The socket carries what is
//    happening right now; saving is a separate, deliberate act over REST.

const SIGNAL_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/api\/?$/, "");

export const COLOURS = [
  { name: "Black", value: "#111827" },
  { name: "Red", value: "#dc2626" },
  { name: "Blue", value: "#2563eb" },
  { name: "Green", value: "#16a34a" },
  { name: "Amber", value: "#d97706" },
  { name: "Violet", value: "#7c3aed" },
  { name: "White", value: "#ffffff" },
];

export const WIDTHS = [2, 4, 7, 12, 20];

// Typed text. Only families every machine already has, so a board looks the
// same on the projector as it did on the laptop that wrote it — a webfont
// that fails to load would reflow somebody's lesson.
export const FONTS = [
  { key: "sans", name: "Sans", stack: "system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" },
  { key: "serif", name: "Serif", stack: "Georgia, 'Times New Roman', serif" },
  { key: "mono", name: "Mono", stack: "ui-monospace, 'Cascadia Mono', Consolas, 'Courier New', monospace" },
  { key: "hand", name: "Handwriting", stack: "'Segoe Script', 'Bradley Hand', 'Comic Sans MS', cursive" },
];

export const TEXT_SIZES = [16, 22, 30, 42, 60];

export const fontStack = (key) => (FONTS.find((f) => f.key === key) || FONTS[0]).stack;

// The canvas and the overlay editor must build the same font string, or the
// text jumps when you stop typing.
export const cssFont = ({ bold, italic, size, font }) =>
  `${italic ? "italic " : ""}${bold ? "700 " : "400 "}${size}px ${fontStack(font)}`;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 8;

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// Points are stored flattened as [x, y, pressure, x, y, pressure, …] — a
// long stroke holds hundreds of them, and objects would treble the size of
// every board document for nothing.
const packPoint = (arr, x, y, p) => { arr.push(x, y, p); };

export default function useBoard({ boardId, shareCode }) {
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [board, setBoard] = useState(null);
  const [role, setRole] = useState("viewer");
  const [watching, setWatching] = useState(1);

  const [tool, setTool] = useState("pen"); // pen | highlighter | text | eraser
  const [font, setFont] = useState(FONTS[0].key);
  const [textSize, setTextSize] = useState(TEXT_SIZES[1]);
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [colour, setColour] = useState(COLOURS[0].value);
  const [width, setWidth] = useState(WIDTHS[1]);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // The document. Kept in a ref, not state: a stroke adds points sixty
  // times a second and re-rendering React on each one would stutter.
  const strokesRef = useRef([]);
  const undoRef = useRef([]);
  const redoRef = useRef([]);
  const viewRef = useRef({ x: 0, y: 0, scale: 1 });
  const socketRef = useRef(null);
  const liveRef = useRef(new Map()); // strokes other people are mid-way through
  const pointerRef = useRef(null); // where the owner is pointing
  const repaintRef = useRef(() => {});
  // Socket handlers are bound once, so they read these rather than the
  // state values captured when they were set up.
  const roleRef = useRef("viewer");
  const pageRef = useRef(0);
  const pageCountRef = useRef(1);

  const canDraw = role === "owner" || role === "guest-draw";
  roleRef.current = role;
  pageRef.current = page;
  pageCountRef.current = pageCount;

  const markDirty = () => { setDirty(true); };
  const refreshHistory = () => {
    setCanUndo(undoRef.current.length > 0);
    setCanRedo(redoRef.current.length > 0);
  };

  /* ------------------------------ loading ------------------------------ */

  useEffect(() => {
    let cancelled = false;
    let socket = null;

    (async () => {
      try {
        const path = shareCode ? `/boards/code/${shareCode}` : `/boards/${boardId}`;
        const { data } = await api.get(path);
        if (cancelled) return;
        strokesRef.current = (data.data.strokes || []).map((s) => ({ ...s }));
        setBoard(data.data);
        setRole(data.role);
        setPageCount(data.data.pageCount || 1);
        setStatus("ready");
        repaintRef.current();
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || "Could not open this board");
        setStatus("error");
        return;
      }

      socket = io(`${SIGNAL_URL}/board`, {
        auth: { token: localStorage.getItem("super50_token") },
        transports: ["websocket", "polling"],
      });
      socketRef.current = socket;

      socket.emit("board:join", { boardId, shareCode }, (res) => {
        if (!res?.ok || cancelled) return;
        setRole(res.role);
        setWatching(res.watching);
        // The snapshot the server holds is authoritative for a late joiner.
        if (res.role !== "owner") {
          strokesRef.current = (res.board.strokes || []).map((s) => ({ ...s }));
          setPageCount(res.board.pageCount || 1);
          repaintRef.current();
        }
      });

      socket.on("board:peer-joined", ({ watching: n, socketId }) => {
        setWatching(n);
        // Only the owner holds the live document, so only the owner can
        // answer "what is on the board right now". Everything saved is
        // already in the database; this covers what is not saved yet.
        if (roleRef.current === "owner" && socketId) {
          socket.emit("board:snapshot", {
            to: socketId,
            strokes: strokesRef.current,
            page: pageRef.current,
            pageCount: pageCountRef.current,
          });
        }
      });
      socket.on("board:peer-left", ({ watching: n }) => setWatching(n));

      // The owner's answer, for somebody who arrived mid-lesson.
      socket.on("board:snapshot", ({ strokes, page: p, pageCount: n }) => {
        if (roleRef.current === "owner") return;
        strokesRef.current = (strokes || []).map((x) => ({ ...x }));
        if (typeof p === "number") setPage(p);
        if (n) setPageCount(n);
        repaintRef.current();
      });

      // Somebody else's stroke, arriving as it is drawn.
      socket.on("board:stroke-start", (stroke) => {
        liveRef.current.set(stroke.id, { ...stroke, points: [...(stroke.points || [])] });
        repaintRef.current();
      });
      socket.on("board:stroke-points", ({ id, points }) => {
        const live = liveRef.current.get(id);
        if (!live) return;
        live.points.push(...points);
        repaintRef.current();
      });
      socket.on("board:stroke-end", ({ id, points }) => {
        const live = liveRef.current.get(id);
        liveRef.current.delete(id);
        if (!live) return;
        strokesRef.current.push({ ...live, points: points || live.points });
        repaintRef.current();
      });
      socket.on("board:remove", ({ ids }) => {
        const gone = new Set(ids);
        strokesRef.current = strokesRef.current.filter((s) => !gone.has(s.id));
        repaintRef.current();
      });
      socket.on("board:restore", ({ strokes }) => {
        strokesRef.current.push(...strokes);
        repaintRef.current();
      });
      socket.on("board:clear", ({ page: p }) => {
        strokesRef.current = strokesRef.current.filter((s) => s.page !== p);
        repaintRef.current();
      });
      socket.on("board:page", ({ page: p, pageCount: n }) => {
        // Viewers follow the owner's page, so the class stays together.
        setPage(p);
        if (n) setPageCount(n);
        repaintRef.current();
      });
      socket.on("board:pointer", (p) => {
        pointerRef.current = { ...p, at: Date.now() };
        repaintRef.current();
      });
    })();

    return () => {
      cancelled = true;
      socket?.emit("board:leave");
      socket?.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, shareCode]);

  /* ------------------------------ drawing ------------------------------ */

  const current = useRef(null);
  const pending = useRef([]);

  const beginStroke = useCallback((x, y, pressure) => {
    if (!canDraw || tool === "eraser" || tool === "text") return;
    const stroke = {
      id: uid(),
      tool,
      colour,
      width,
      page,
      points: [],
    };
    packPoint(stroke.points, x, y, pressure);
    current.current = stroke;
    pending.current = [x, y, pressure];
    socketRef.current?.emit("board:stroke-start", stroke);
  }, [canDraw, tool, colour, width, page]);

  const extendStroke = useCallback((x, y, pressure) => {
    const stroke = current.current;
    if (!stroke) return;
    packPoint(stroke.points, x, y, pressure);
    pending.current.push(x, y, pressure);
    // Batched: one packet per animation frame rather than one per point,
    // which is the difference between live and unusable on a classroom wifi.
    if (pending.current.length >= 12) {
      socketRef.current?.emit("board:stroke-points", { id: stroke.id, points: pending.current });
      pending.current = [];
    }
    repaintRef.current();
  }, []);

  const endStroke = useCallback(() => {
    const stroke = current.current;
    current.current = null;
    if (!stroke) return;
    if (pending.current.length) {
      socketRef.current?.emit("board:stroke-points", { id: stroke.id, points: pending.current });
      pending.current = [];
    }
    // A tap with no movement is a dot, which is a legitimate mark.
    strokesRef.current.push(stroke);
    undoRef.current.push({ type: "add", strokes: [stroke] });
    redoRef.current = [];
    refreshHistory();
    markDirty();
    socketRef.current?.emit("board:stroke-end", { id: stroke.id, points: stroke.points });
    repaintRef.current();
  }, []);

  // A finished piece of typing. It goes onto the same list as the strokes,
  // so undo, erase, the page filter, saving and the live relay all treat it
  // exactly like anything else drawn.
  const addText = useCallback(({ x, y, text, w, h }) => {
    const body = String(text || "").replace(/\s+$/, "");
    if (!body.trim()) return null;
    const item = {
      id: uid(),
      tool: "text",
      colour,
      width: textSize,
      page,
      points: [x, y, 1],
      text: body,
      font,
      bold,
      italic,
      w,
      h,
    };
    strokesRef.current.push(item);
    undoRef.current.push({ type: "add", strokes: [item] });
    redoRef.current = [];
    refreshHistory();
    markDirty();
    // `board:restore` is the server's "these items are on the board now",
    // which is exactly what a new piece of text is.
    socketRef.current?.emit("board:restore", { strokes: [item] });
    repaintRef.current();
    return item;
  }, [colour, textSize, page, font, bold, italic]);

  // The eraser removes whole strokes. Rubbing out pixels looks right until
  // you undo, zoom, or ask somebody else's screen to agree with yours.
  const eraseAt = useCallback((x, y, radius) => {
    if (!canDraw) return;
    const hit = [];
    for (const stroke of strokesRef.current) {
      if (stroke.page !== page) continue;

      // Typed text is a box, not a line of points. Testing its corner only
      // would mean having to rub out exactly the top-left pixel of a
      // paragraph to delete it.
      if (stroke.tool === "text") {
        const [tx, ty] = stroke.points;
        if (x >= tx - radius && x <= tx + (stroke.w || 0) + radius
          && y >= ty - radius && y <= ty + (stroke.h || 0) + radius) {
          hit.push(stroke);
        }
        continue;
      }

      const pts = stroke.points;
      const reach = radius + stroke.width / 2;
      for (let i = 0; i < pts.length; i += 3) {
        const dx = pts[i] - x;
        const dy = pts[i + 1] - y;
        if (dx * dx + dy * dy <= reach * reach) { hit.push(stroke); break; }
      }
    }
    if (!hit.length) return;
    const ids = new Set(hit.map((s) => s.id));
    strokesRef.current = strokesRef.current.filter((s) => !ids.has(s.id));
    undoRef.current.push({ type: "remove", strokes: hit });
    redoRef.current = [];
    refreshHistory();
    markDirty();
    socketRef.current?.emit("board:remove", { ids: [...ids] });
    repaintRef.current();
  }, [canDraw, page]);

  /* ------------------------------ history ------------------------------ */

  const undo = useCallback(() => {
    const step = undoRef.current.pop();
    if (!step) return;
    if (step.type === "add") {
      const ids = new Set(step.strokes.map((s) => s.id));
      strokesRef.current = strokesRef.current.filter((s) => !ids.has(s.id));
      socketRef.current?.emit("board:remove", { ids: [...ids] });
    } else {
      strokesRef.current.push(...step.strokes);
      socketRef.current?.emit("board:restore", { strokes: step.strokes });
    }
    redoRef.current.push(step);
    refreshHistory();
    markDirty();
    repaintRef.current();
  }, []);

  const redo = useCallback(() => {
    const step = redoRef.current.pop();
    if (!step) return;
    if (step.type === "add") {
      strokesRef.current.push(...step.strokes);
      socketRef.current?.emit("board:restore", { strokes: step.strokes });
    } else {
      const ids = new Set(step.strokes.map((s) => s.id));
      strokesRef.current = strokesRef.current.filter((s) => !ids.has(s.id));
      socketRef.current?.emit("board:remove", { ids: [...ids] });
    }
    undoRef.current.push(step);
    refreshHistory();
    markDirty();
    repaintRef.current();
  }, []);

  const clearPage = useCallback(() => {
    const gone = strokesRef.current.filter((s) => s.page === page);
    if (!gone.length) return;
    strokesRef.current = strokesRef.current.filter((s) => s.page !== page);
    undoRef.current.push({ type: "remove", strokes: gone });
    redoRef.current = [];
    refreshHistory();
    markDirty();
    socketRef.current?.emit("board:clear", { page });
    repaintRef.current();
  }, [page]);

  /* ------------------------------- pages ------------------------------- */

  const goToPage = useCallback((next) => {
    const p = Math.max(0, next);
    const count = Math.max(pageCount, p + 1);
    setPage(p);
    setPageCount(count);
    if (count !== pageCount) markDirty();
    socketRef.current?.emit("board:page", { page: p, pageCount: count });
    repaintRef.current();
  }, [pageCount]);

  /* ------------------------------- saving ------------------------------ */

  const save = useCallback(async () => {
    if (role !== "owner" || !board?._id) return;
    setSaving(true);
    try {
      const { data } = await api.put(`/boards/${board._id}/strokes`, {
        strokes: strokesRef.current,
        pageCount,
      });
      setSavedAt(new Date(data.savedAt));
      setDirty(false);
      return data;
    } finally {
      setSaving(false);
    }
  }, [role, board?._id, pageCount]);

  // A lesson should not be lost to a closed laptop. Quiet, and only when
  // something actually changed.
  useEffect(() => {
    if (role !== "owner" || !dirty) return undefined;
    const t = setTimeout(() => { save().catch(() => {}); }, 8000);
    return () => clearTimeout(t);
  }, [dirty, role, save]);

  useEffect(() => {
    const warn = (e) => {
      if (!dirty || role !== "owner") return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, role]);

  const sendPointer = useCallback((x, y) => {
    if (role !== "owner") return;
    socketRef.current?.emit("board:pointer", { x, y, page });
  }, [role, page]);

  return {
    status, error, board, role, canDraw, watching,
    tool, setTool, colour, setColour, width, setWidth,
    font, setFont, textSize, setTextSize, bold, setBold, italic, setItalic, addText,
    page, pageCount, goToPage, setPageCount,
    zoom, setZoom, MIN_ZOOM, MAX_ZOOM,
    dirty, savedAt, saving, save,
    canUndo, canRedo, undo, redo, clearPage,
    beginStroke, extendStroke, endStroke, eraseAt, sendPointer,
    strokesRef, liveRef, viewRef, pointerRef, repaintRef,
  };
}
