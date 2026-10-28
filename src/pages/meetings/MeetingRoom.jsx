import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Mic, MicOff, Video, VideoOff, MonitorUp, MonitorX, Circle, Square, MessageSquare,
  PenLine, PhoneOff, Users, Send, Eraser, Loader2, AlertCircle, Copy, Check,
} from "lucide-react";
import toast from "react-hot-toast";
import useMeetingRoom from "./useMeetingRoom";

// One participant's tile. `screen` is set for a shared screen, which has to
// be letterboxed rather than cropped — cropping a screen cuts off the very
// thing somebody is pointing at.
const Tile = ({ stream, label, muted, isMe, audio, video, sharing, screen, fill }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !stream) return;
    el.srcObject = stream;
    // Autoplay can still be refused even after a click, and a refused play()
    // leaves the tile on a frozen first frame with no sound.
    el.play?.().catch(() => {});
  }, [stream]);

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-slate-900 ${fill ? "h-full" : "aspect-video"}`}>
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        className={`w-full h-full ${screen ? "object-contain bg-black" : "object-cover"}`}
      />
      {!video && !sharing && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <div className="w-16 h-16 rounded-full bg-slate-700 text-white flex items-center justify-center text-xl font-black">
            {label?.[0]?.toUpperCase()}
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-white bg-black/50 rounded-lg px-2 py-1 truncate">
          {label}{isMe ? " (you)" : ""}{sharing ? " · presenting" : ""}
        </span>
        {!audio && <span className="bg-red-500/80 text-white rounded-lg p-1"><MicOff size={12} /></span>}
      </div>
    </div>
  );
};

// A shared drawing surface. Strokes are sent as plain coordinates and drawn
// on everyone's own canvas — no images cross the wire.
const Whiteboard = ({ onStroke, onRemoteStroke, onClear }) => {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const [colour, setColour] = useState("#111827");
  const [width, setWidth] = useState(3);

  const draw = (stroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (stroke.clear) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    ctx.strokeStyle = stroke.colour;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(stroke.from.x * canvas.width, stroke.from.y * canvas.height);
    ctx.lineTo(stroke.to.x * canvas.width, stroke.to.y * canvas.height);
    ctx.stroke();
  };

  useEffect(() => {
    onRemoteStroke(draw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
  };

  const start = (e) => { drawing.current = true; last.current = pos(e); };
  const move = (e) => {
    if (!drawing.current) return;
    const to = pos(e);
    const stroke = { from: last.current, to, colour, width };
    draw(stroke);
    onStroke(stroke);
    last.current = to;
  };
  const end = () => { drawing.current = false; };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {["#111827", "#ef4444", "#2563eb", "#16a34a", "#f59e0b"].map((c) => (
          <button key={c} onClick={() => setColour(c)}
            className={`w-6 h-6 rounded-full border-2 ${colour === c ? "border-white ring-2 ring-[var(--primary)]" : "border-white/40"}`}
            style={{ background: c }} />
        ))}
        <input type="range" min="1" max="12" value={width} onChange={(e) => setWidth(Number(e.target.value))} className="w-24" />
        <button onClick={() => { draw({ clear: true }); onClear(); }}
          className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-light)] text-[var(--text-secondary)] flex items-center gap-1.5">
          <Eraser size={12} /> Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="w-full rounded-2xl bg-white border border-[var(--border-light)] touch-none cursor-crosshair"
      />
    </div>
  );
};

export default function MeetingRoom() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const room = useMeetingRoom(roomCode);
  const [panel, setPanel] = useState("people"); // people | chat | board
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [room.messages.length]);

  const leave = () => {
    navigate("/meetings");
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/meetings/${roomCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the link");
    }
  };

  if (room.status === "connecting") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-950 text-white">
        <Loader2 className="animate-spin" size={28} />
        <p className="text-sm text-slate-300">Joining {roomCode}…</p>
      </div>
    );
  }

  if (room.status === "error" || room.status === "ended") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-950 text-white p-6 text-center">
        <AlertCircle size={36} className="text-amber-400" />
        <p className="text-lg font-bold">{room.error || "This meeting is over"}</p>
        <button onClick={leave} className="btn-premium text-sm px-5 py-2.5">Back to meetings</button>
      </div>
    );
  }

  const presenter = room.presenter;
  const tiles = [
    { key: "me", stream: room.streams.me, label: room.me?.name || "You", muted: true, isMe: true, audio: room.audioOn, video: room.videoOn, sharing: room.sharing },
    ...room.peers.map((p) => ({
      // The stage below carries the presenter's audio; letting their
      // thumbnail play it too would double every word they say.
      key: p.socketId, stream: room.streams[p.socketId], label: p.name,
      muted: presenter?.socketId === p.socketId,
      isMe: false, audio: p.audio, video: p.video, sharing: p.sharing,
    })),
  ];
  const columns = tiles.length <= 1 ? "grid-cols-1" : tiles.length <= 4 ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-3";
  const stageStream = presenter ? room.streams[presenter.socketId] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-white/10">
        <div className="min-w-0">
          <h1 className="font-display font-black text-lg truncate">{room.meeting?.title || "Meeting"}</h1>
          <p className="text-xs text-slate-400 flex items-center gap-2">
            Room <strong className="text-slate-200">{roomCode}</strong>
            <button onClick={copyCode} className="hover:text-white" title="Copy the join link">
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
            · {tiles.length} in the room
          </p>
        </div>
        <div className="flex items-center gap-2">
          {["people", "chat", "board"].map((p) => (
            <button key={p} onClick={() => setPanel(p)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                panel === p ? "bg-white text-slate-900" : "bg-white/10 text-slate-200"
              }`}>
              {p === "people" ? <Users size={13} /> : p === "chat" ? <MessageSquare size={13} /> : <PenLine size={13} />}
              {p === "people" ? "People" : p === "chat" ? "Chat" : "Whiteboard"}
            </button>
          ))}
        </div>
      </header>

      {room.mediaError && (
        <p className="mx-4 mt-3 text-xs font-semibold text-amber-200 bg-amber-500/15 border border-amber-500/30 rounded-xl px-3 py-2">
          {room.mediaError}
        </p>
      )}

      <div className="flex-1 grid lg:grid-cols-[1fr_320px] gap-4 p-4 min-h-0">
        {presenter ? (
          // Somebody is presenting, so the screen takes the room and everyone
          // else drops to a strip underneath it — the way Meet does it.
          <div className="flex flex-col gap-3 min-h-0">
            <div className="relative flex-1 min-h-[260px]">
              <Tile
                stream={stageStream}
                label={presenter.isMe ? "Your screen" : `${presenter.name}'s screen`}
                muted={!!presenter.isMe}
                screen
                fill
                video
                audio
              />
              <span className="absolute top-3 left-3 text-[11px] font-black uppercase tracking-widest bg-emerald-500 text-white rounded-lg px-2 py-1">
                {presenter.isMe ? "You are presenting" : `${presenter.name} is presenting`}
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
              {tiles.map(({ key, ...t }) => (
                <div key={key} className="w-40 shrink-0">
                  <Tile {...t} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`grid ${columns} gap-3 content-start`}>
            {tiles.map(({ key, ...t }) => <Tile key={key} {...t} />)}
          </div>
        )}

        <aside className="bg-white/5 rounded-2xl p-4 flex flex-col min-h-[320px]">
          {panel === "people" && (
            <div className="space-y-2 overflow-y-auto">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">In the room</h3>
              {[{ ...room.me, isMe: true }, ...room.peers].filter(Boolean).map((p) => (
                <div key={p.socketId} className="flex items-center justify-between gap-2 text-sm bg-white/5 rounded-xl px-3 py-2">
                  <span className="truncate">
                    {p.name}{p.isMe ? " (you)" : ""}
                    {p.isHost && <span className="ml-2 text-[10px] font-black uppercase text-amber-300">host</span>}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    {p.audio ? <Mic size={13} /> : <MicOff size={13} className="text-red-400" />}
                    {p.video ? <Video size={13} /> : <VideoOff size={13} className="text-red-400" />}
                  </span>
                </div>
              ))}
            </div>
          )}

          {panel === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto space-y-2 mb-2">
                {room.messages.length === 0 && <p className="text-xs text-slate-400">No messages yet.</p>}
                {room.messages.map((m) => (
                  <div key={m.id} className="text-sm">
                    <span className="text-[11px] font-bold text-slate-400">{m.from}</span>
                    <p className="bg-white/10 rounded-xl px-3 py-2 mt-0.5 break-words">{m.text}</p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); if (draft.trim()) { room.sendMessage(draft.trim()); setDraft(""); } }}
                className="flex gap-2"
              >
                <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Message everyone…"
                  className="flex-1 bg-white/10 rounded-xl px-3 py-2 text-sm outline-none placeholder:text-slate-400" />
                <button type="submit" className="bg-white text-slate-900 rounded-xl px-3"><Send size={15} /></button>
              </form>
            </>
          )}

          {panel === "board" && (
            <div className="overflow-y-auto">
              <Whiteboard onStroke={room.sendStroke} onRemoteStroke={room.onRemoteStroke} onClear={room.clearBoard} />
            </div>
          )}
        </aside>
      </div>

      <footer className="flex flex-wrap items-center justify-center gap-2 px-4 py-3 border-t border-white/10">
        <button onClick={room.toggleAudio} disabled={!room.hasMic}
          title={!room.hasMic ? "No microphone available" : room.audioOn ? "Mute" : "Unmute"}
          className={`p-3 rounded-2xl ${room.audioOn ? "bg-white/10" : "bg-red-500"} ${!room.hasMic ? "opacity-40 cursor-not-allowed" : ""}`}>
          {room.audioOn ? <Mic size={18} /> : <MicOff size={18} />}
        </button>
        <button onClick={room.toggleVideo} disabled={!room.hasCam}
          title={!room.hasCam ? "No camera available" : room.videoOn ? "Turn camera off" : "Turn camera on"}
          className={`p-3 rounded-2xl ${room.videoOn ? "bg-white/10" : "bg-red-500"} ${!room.hasCam ? "opacity-40 cursor-not-allowed" : ""}`}>
          {room.videoOn ? <Video size={18} /> : <VideoOff size={18} />}
        </button>
        <button onClick={room.sharing ? room.stopShare : room.startShare} title="Share your screen"
          className={`p-3 rounded-2xl ${room.sharing ? "bg-emerald-500" : "bg-white/10"}`}>
          {room.sharing ? <MonitorX size={18} /> : <MonitorUp size={18} />}
        </button>
        <button onClick={room.recording ? room.stopRecording : room.startRecording}
          title={room.recording ? "Stop recording (saves to your computer)" : "Record to your computer"}
          className={`p-3 rounded-2xl ${room.recording ? "bg-red-500" : "bg-white/10"}`}>
          {room.recording ? <Square size={18} /> : <Circle size={18} />}
        </button>
        {room.me?.isHost && (
          <button onClick={() => { if (window.confirm("End the meeting for everyone?")) room.endMeeting(); }}
            className="px-4 py-3 rounded-2xl bg-white/10 text-sm font-bold">End for all</button>
        )}
        <button onClick={leave} className="p-3 rounded-2xl bg-red-500" title="Leave"><PhoneOff size={18} /></button>
      </footer>
    </div>
  );
}
