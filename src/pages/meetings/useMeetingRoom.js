import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import api from "../../services/api";

// Everything that makes a meeting room work, kept out of the page itself.
//
// The media never goes through our server: each browser opens a direct
// WebRTC connection to every other one in the room (a mesh, which is the
// right shape for a staff meeting or a class of a few dozen), and the
// socket only carries the offers, answers and ICE candidates.

const SIGNAL_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/api\/?$/, "");

// Public STUN is enough on most college and home networks. A network that
// blocks direct connections outright (mobile data, a strict firewall) can
// only be reached through a TURN relay; the server hands one out when it is
// configured (GET /meetings/ice-servers), and this is the fallback.
const DEFAULT_ICE = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }];

// A meeting mic wants the browser's cleanup on; a laptop speaker without
// echo cancellation turns two people in one room into a howl.
const MIC = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
const CAM = { width: { ideal: 1280 }, height: { ideal: 720 } };

// Desktops without a webcam are common, and a blocked camera should not cost
// somebody their microphone too — so ask for both, then settle for whichever
// one the machine will actually give us.
const openMedia = async () => {
  const attempts = [
    [{ video: CAM, audio: MIC }, "camera and mic"],
    [{ video: false, audio: MIC }, "mic only"],
    [{ video: CAM, audio: false }, "camera only"],
  ];
  let lastErr = null;
  for (const [constraints] of attempts) {
    try {
      return { stream: await navigator.mediaDevices.getUserMedia(constraints), error: "" };
    } catch (err) {
      lastErr = err;
    }
  }
  const why = lastErr?.name === "NotAllowedError"
    ? "Camera and microphone are blocked for this site — allow them in the address bar and rejoin."
    : lastErr?.name === "NotFoundError"
      ? "No camera or microphone found on this device. You can still watch, chat and present."
      : `Could not open the camera or microphone (${lastErr?.name || "unknown"}). You can still watch, chat and present.`;
  return { stream: null, error: why };
};

export default function useMeetingRoom(roomCode) {
  const [status, setStatus] = useState("connecting"); // connecting | joined | error | ended
  const [error, setError] = useState("");
  const [me, setMe] = useState(null);
  const [peers, setPeers] = useState([]); // { socketId, name, role, isHost, audio, video, sharing }
  const [streams, setStreams] = useState({}); // socketId -> MediaStream
  const [messages, setMessages] = useState([]);
  const [meeting, setMeeting] = useState(null);
  const [audioOn, setAudioOn] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const [hasMic, setHasMic] = useState(false);
  const [hasCam, setHasCam] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [sharing, setSharing] = useState(false);
  const [recording, setRecording] = useState(false);

  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peersRef = useRef(new Map()); // socketId -> RTCPeerConnection
  // Per connection: who yields when both sides offer at once, the offer in
  // flight, candidates that arrived early, and the tracks received so far.
  const linkRef = useRef(new Map()); // socketId -> { polite, makingOffer, ignoreOffer, pendingIce, remote, restarts }
  // Signalling for one connection is handled strictly in arrival order —
  // a candidate must never be applied before the offer it belongs to.
  const queueRef = useRef(new Map()); // socketId -> Promise
  const iceServersRef = useRef(DEFAULT_ICE);
  const recorderRef = useRef(null);
  const recordedRef = useRef([]);
  const boardHandlerRef = useRef(null);

  const setStream = (socketId, stream) =>
    setStreams((prev) => ({ ...prev, [socketId]: stream }));

  const dropPeer = (socketId) => {
    peersRef.current.get(socketId)?.close();
    peersRef.current.delete(socketId);
    linkRef.current.delete(socketId);
    queueRef.current.delete(socketId);
    setStreams((prev) => {
      const next = { ...prev };
      delete next[socketId];
      return next;
    });
  };

  // --- one peer connection, wired both ways ---
  //
  // Both kinds of media are always negotiated, whatever this machine has.
  // A connection is only as wide as its offer: someone joining with no
  // camera used to offer audio alone and so never received anybody's
  // video, and someone with neither camera nor mic offered nothing at all
  // and connected to nobody. `initiator` is the side that calls out — the
  // newcomer — and it asks to receive audio and video regardless.
  const createPeer = useCallback((socketId, initiator) => {
    if (peersRef.current.has(socketId)) return peersRef.current.get(socketId);
    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
    const link = {
      // Settles a collision when both sides renegotiate at the same moment
      // (screen share started on both ends): the polite side gives way.
      polite: String(socketRef.current?.id || "") > String(socketId),
      makingOffer: false,
      ignoreOffer: false,
      pendingIce: [],
      remote: new MediaStream(),
      restarts: 0,
    };
    peersRef.current.set(socketId, pc);
    linkRef.current.set(socketId, link);

    const local = localStreamRef.current;
    local?.getTracks().forEach((track) => pc.addTrack(track, local));
    // Somebody who is already presenting shows their screen to newcomers too.
    const screenTrack = screenStreamRef.current?.getVideoTracks?.()[0];
    if (screenTrack) {
      const videoSender = pc.getSenders().find((x) => x.track?.kind === "video");
      if (videoSender) videoSender.replaceTrack(screenTrack);
      else pc.addTrack(screenTrack, screenStreamRef.current);
    }
    if (initiator) {
      ["audio", "video"].forEach((kind) => {
        if (!pc.getSenders().some((x) => x.track?.kind === kind)) pc.addTransceiver(kind, { direction: "recvonly" });
      });
    }

    // Every track from this person goes into one stream for their tile. A
    // fresh MediaStream object each time makes the tile pick up a track that
    // arrived after the first one.
    pc.ontrack = ({ track }) => {
      const { remote } = link;
      remote.getTracks().filter((t) => t.kind === track.kind && t !== track).forEach((t) => remote.removeTrack(t));
      if (!remote.getTracks().includes(track)) remote.addTrack(track);
      const show = () => setStream(socketId, new MediaStream(link.remote.getTracks()));
      show();
      track.onunmute = show;
    };
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) socketRef.current?.emit("webrtc:ice", { to: socketId, payload: candidate });
    };
    pc.onnegotiationneeded = async () => {
      try {
        link.makingOffer = true;
        await pc.setLocalDescription();
        socketRef.current?.emit("webrtc:offer", { to: socketId, payload: pc.localDescription });
      } catch (err) {
        console.error("offer failed", err);
      } finally {
        link.makingOffer = false;
      }
    };
    // A dropped network path is tried again instead of leaving a black tile
    // for the rest of the meeting.
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed" && link.restarts < 3) {
        link.restarts += 1;
        pc.restartIce();
      }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") link.restarts = 0;
      if (pc.connectionState === "closed") dropPeer(socketId);
    };
    return pc;
  }, []);

  const inOrder = (socketId, job) => {
    const next = (queueRef.current.get(socketId) || Promise.resolve())
      .then(job)
      .catch((err) => console.warn("signalling step failed:", err.message));
    queueRef.current.set(socketId, next);
  };

  const onDescription = async (from, description) => {
    const pc = description.type === "offer" ? createPeer(from, false) : peersRef.current.get(from);
    const link = linkRef.current.get(from);
    if (!pc || !link) return;
    const collision = description.type === "offer" && (link.makingOffer || pc.signalingState !== "stable");
    link.ignoreOffer = !link.polite && collision;
    if (link.ignoreOffer) return;
    await pc.setRemoteDescription(description);
    // Candidates that came in before this description can go in now.
    for (const candidate of link.pendingIce.splice(0)) {
      await pc.addIceCandidate(candidate).catch(() => {});
    }
    if (description.type === "offer") {
      await pc.setLocalDescription();
      socketRef.current?.emit("webrtc:answer", { to: from, payload: pc.localDescription });
    }
  };

  const onIce = async (from, candidate) => {
    const pc = peersRef.current.get(from);
    const link = linkRef.current.get(from);
    if (!pc || !link || !candidate) return;
    if (!pc.remoteDescription) {
      link.pendingIce.push(candidate);
      return;
    }
    try {
      await pc.addIceCandidate(candidate);
    } catch (err) {
      if (!link.ignoreOffer) console.warn("ice candidate rejected", err.message);
    }
  };

  // --- join ---
  useEffect(() => {
    let cancelled = false;
    let socket = null;

    (async () => {
      const { stream, error: mediaWhy } = await openMedia();

      // React mounts an effect twice in development, and opening the camera
      // takes long enough that the unmount can land first. Bailing out here
      // is what keeps a second socket — and so a second copy of every chat
      // message — from ever joining the room.
      if (cancelled) {
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }

      if (stream) {
        localStreamRef.current = stream;
        setStream("me", stream);
        const mic = stream.getAudioTracks()[0];
        const cam = stream.getVideoTracks()[0];
        setHasMic(!!mic);
        setHasCam(!!cam);
        setAudioOn(!!mic);
        setVideoOn(!!cam);
      }
      setMediaError(mediaWhy);

      // Where to look for the others — including the TURN relay, if the
      // server has one. Without it the public STUN servers are used.
      try {
        const { data } = await api.get("/meetings/ice-servers");
        if (Array.isArray(data?.data) && data.data.length) iceServersRef.current = data.data;
      } catch {
        /* keep the defaults */
      }
      if (cancelled) {
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }

      socket = io(`${SIGNAL_URL}/meeting`, {
        auth: { token: localStorage.getItem("super50_token") },
        transports: ["websocket", "polling"],
      });
      socketRef.current = socket;

      socket.on("connect_error", (err) => {
        setError(err.message || "Could not connect to the meeting");
        setStatus("error");
      });

      socket.emit("room:join", { roomCode }, (res) => {
        if (cancelled) return;
        if (!res?.ok) {
          setError(res?.message || "Could not join");
          setStatus("error");
          return;
        }
        setMe(res.me);
        setMeeting(res.meeting);
        setPeers(res.peers);
        setStatus("joined");
        // The room assumes everyone arrives with mic and camera live, so say
        // so straight away when they did not — otherwise the people already
        // here see a mic icon that is lying to them.
        const mic = !!localStreamRef.current?.getAudioTracks?.()[0];
        const cam = !!localStreamRef.current?.getVideoTracks?.()[0];
        if (!mic || !cam) socket.emit("media:state", { audio: mic, video: cam });
        // call out to everyone already here
        res.peers.forEach((peer) => createPeer(peer.socketId, true));
      });

      socket.on("peer:joined", (peer) => {
        setPeers((prev) => [...prev.filter((p) => p.socketId !== peer.socketId), peer]);
      });

      socket.on("peer:left", ({ socketId }) => {
        dropPeer(socketId);
        setPeers((prev) => prev.filter((p) => p.socketId !== socketId));
      });

      socket.on("peer:state", ({ socketId, audio, video, sharing: isSharing }) => {
        setPeers((prev) => prev.map((p) => (p.socketId === socketId ? { ...p, audio, video, sharing: isSharing } : p)));
      });

      socket.on("webrtc:offer", ({ from, payload }) => inOrder(from, () => onDescription(from, payload)));
      socket.on("webrtc:answer", ({ from, payload }) => inOrder(from, () => onDescription(from, payload)));
      socket.on("webrtc:ice", ({ from, payload }) => inOrder(from, () => onIce(from, payload)));

      // Keyed on the server's timestamp and sender, so a reconnect that
      // replays the tail of the conversation cannot double it up either.
      socket.on("chat:message", (msg) =>
        setMessages((prev) => {
          const id = `${msg.userId}-${msg.at}-${msg.text}`;
          return prev.some((m) => m.id === id) ? prev : [...prev, { ...msg, id }];
        }));
      socket.on("board:draw", (stroke) => boardHandlerRef.current?.(stroke));
      socket.on("board:clear", () => boardHandlerRef.current?.({ clear: true }));
      socket.on("room:ended", ({ by }) => {
        setStatus("ended");
        setError(`${by} ended the meeting`);
      });
    })();

    return () => {
      cancelled = true;
      socket?.emit("room:leave");
      socket?.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
      linkRef.current.clear();
      queueRef.current.clear();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  // --- controls ---
  const toggleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks?.()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setAudioOn(track.enabled);
    socketRef.current?.emit("media:state", { audio: track.enabled });
  };

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks?.()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setVideoOn(track.enabled);
    socketRef.current?.emit("media:state", { video: track.enabled });
  };

  // Screen share swaps the outgoing video track on every connection. Someone
  // without a camera has a video slot that only receives; it is switched to
  // sending, and the connection renegotiates by itself.
  const replaceVideoTrack = async (track) => {
    peersRef.current.forEach((pc) => {
      const slot = pc.getTransceivers().find((t) => t.receiver.track?.kind === "video" && !t.stopped);
      if (!slot) return;
      slot.sender.replaceTrack(track).catch(() => {});
      if (track && (slot.direction === "recvonly" || slot.direction === "inactive")) slot.direction = "sendrecv";
    });
  };

  const startShare = async () => {
    if (sharing) return;
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 15, max: 30 } },
        audio: false,
      });
      screenStreamRef.current = screen;
      const track = screen.getVideoTracks()[0];
      await replaceVideoTrack(track);
      // The presenter watches the same stage as everybody else, so their own
      // screen goes where their camera was.
      setStream("me", screen);
      setSharing(true);
      socketRef.current?.emit("media:state", { sharing: true, video: true });
      track.onended = () => stopShare();
    } catch (err) {
      // Dismissing the picker is a normal thing to do, not a failure.
      console.warn("screen share cancelled:", err.message);
    }
  };

  const stopShare = async () => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    const camTrack = localStreamRef.current?.getVideoTracks?.()[0] || null;
    await replaceVideoTrack(camTrack);
    setStream("me", localStreamRef.current || null);
    setSharing(false);
    socketRef.current?.emit("media:state", { sharing: false, video: !!camTrack?.enabled });
  };

  // Recording is the browser's own screen capture, saved straight to the
  // person's machine — nothing is uploaded anywhere.
  const startRecording = async () => {
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const mic = localStreamRef.current?.getAudioTracks?.()[0];
      const tracks = [...display.getTracks()];
      if (mic) tracks.push(mic.clone());
      const mixed = new MediaStream(tracks);

      const recorder = new MediaRecorder(mixed, { mimeType: "video/webm;codecs=vp9,opus" });
      recordedRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size) recordedRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(recordedRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `meeting-${roomCode}-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.webm`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        display.getTracks().forEach((t) => t.stop());
        setRecording(false);
      };
      display.getVideoTracks()[0].onended = () => recorder.state === "recording" && recorder.stop();
      recorder.start(1000);
      recorderRef.current = recorder;
      setRecording(true);
    } catch (err) {
      console.warn("recording cancelled:", err.message);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  };

  const sendMessage = (text) => socketRef.current?.emit("chat:send", { text });
  const sendStroke = (stroke) => socketRef.current?.emit("board:draw", stroke);
  const clearBoard = () => socketRef.current?.emit("board:clear");
  const onRemoteStroke = (handler) => { boardHandlerRef.current = handler; };
  const endMeeting = () => socketRef.current?.emit("room:end");

  // Whoever is presenting gets the stage. Only one screen at a time, the way
  // Meet does it — the latest person to start wins.
  const presenter = sharing
    ? { socketId: "me", name: me?.name || "You", isMe: true }
    : peers.find((p) => p.sharing) || null;

  return {
    status, error, me, peers, streams, messages, meeting,
    audioOn, videoOn, sharing, recording, hasMic, hasCam, mediaError, presenter,
    toggleAudio, toggleVideo, startShare, stopShare,
    startRecording, stopRecording,
    sendMessage, sendStroke, clearBoard, onRemoteStroke, endMeeting,
  };
}
