import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import {
  Alert,
  Avatar,
  IconButton,
  TextField,
  Tooltip,
} from "@mui/material";
import VideoCallRoundedIcon from "@mui/icons-material/VideoCallRounded";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import VideocamOffRoundedIcon from "@mui/icons-material/VideocamOffRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import MicOffRoundedIcon from "@mui/icons-material/MicOffRounded";
import ScreenShareRoundedIcon from "@mui/icons-material/ScreenShareRounded";
import StopScreenShareRoundedIcon from "@mui/icons-material/StopScreenShareRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import CallEndRoundedIcon from "@mui/icons-material/CallEndRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

import server from "../environment.js";
import styles from "../css/videoComponent.module.css";

const sanitizeRoom = (value = "") => String(value).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const buildIceServers = () => {
  const iceServers = [{ urls: "stun:stun.l.google.com:19302" }];
  const turnUrl = import.meta.env.VITE_TURN_URL;
  if (turnUrl) {
    iceServers.push({
      urls: turnUrl,
      username: import.meta.env.VITE_TURN_USERNAME || "",
      credential: import.meta.env.VITE_TURN_CREDENTIAL || "",
    });
  }
  return iceServers;
};

const initials = (name = "Guest") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "G";

export default function VideoMeetComponent() {
  const { meetingCode: meetingParam } = useParams();
  const navigate = useNavigate();
  const roomId = useMemo(() => sanitizeRoom(meetingParam), [meetingParam]);
  const storedUser = useMemo(readStoredUser, []);
  const isAuthenticated = Boolean(localStorage.getItem("token"));

  const [username, setUsername] = useState(storedUser?.name || "");
  const [inMeeting, setInMeeting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [previewStream, setPreviewStream] = useState(null);
  const [mediaReady, setMediaReady] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [cameraAvailable, setCameraAvailable] = useState(true);
  const [microphoneAvailable, setMicrophoneAvailable] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [participantCount, setParticipantCount] = useState(1);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [unread, setUnread] = useState(0);
  const [copied, setCopied] = useState(false);

  const localVideoRef = useRef(null);
  const chatEndRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const cameraTrackRef = useRef(null);
  const microphoneTrackRef = useRef(null);
  const screenTrackRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const peerNamesRef = useRef(new Map());
  const pendingCandidatesRef = useRef(new Map());
  const chatOpenRef = useRef(false);
  const mountedRef = useRef(true);

  const peerConfig = useMemo(() => ({ iceServers: buildIceServers() }), []);

  useEffect(() => {
    chatOpenRef.current = chatOpen;
    if (chatOpen) setUnread(0);
  }, [chatOpen]);

  useEffect(() => {
    if (localVideoRef.current && previewStream) {
      localVideoRef.current.srcObject = previewStream;
    }
  }, [previewStream, inMeeting]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatOpen]);

  const updateParticipantStream = (socketId, stream, fallbackName = "Participant") => {
    setParticipants((current) => {
      const existing = current.find((participant) => participant.socketId === socketId);
      if (existing) {
        return current.map((participant) =>
          participant.socketId === socketId
            ? { ...participant, stream, username: peerNamesRef.current.get(socketId) || participant.username }
            : participant
        );
      }
      return [
        ...current,
        {
          socketId,
          username: peerNamesRef.current.get(socketId) || fallbackName,
          stream,
        },
      ];
    });
  };

  const createPeer = (peerId, peerName = "Participant") => {
    if (!peerId) return null;
    const existing = peerConnectionsRef.current.get(peerId);
    if (existing) {
      if (peerName) peerNamesRef.current.set(peerId, peerName);
      return existing;
    }

    peerNamesRef.current.set(peerId, peerName);
    setParticipants((current) => {
      const existingParticipant = current.find((participant) => participant.socketId === peerId);
      if (existingParticipant) {
        return current.map((participant) =>
          participant.socketId === peerId ? { ...participant, username: peerName || participant.username } : participant
        );
      }
      return [...current, { socketId: peerId, username: peerName || "Participant", stream: null }];
    });

    const peer = new RTCPeerConnection(peerConfig);
    peerConnectionsRef.current.set(peerId, peer);
    pendingCandidatesRef.current.set(peerId, []);

    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    }

    peer.onicecandidate = (event) => {
      if (event.candidate && socketRef.current?.connected) {
        socketRef.current.emit("signal", {
          to: peerId,
          data: { ice: event.candidate.toJSON ? event.candidate.toJSON() : event.candidate },
        });
      }
    };

    peer.ontrack = (event) => {
      const remoteStream = event.streams?.[0];
      if (remoteStream) {
        updateParticipantStream(peerId, remoteStream, peerName);
      }
    };

    peer.onconnectionstatechange = () => {
      if (["failed", "closed"].includes(peer.connectionState)) {
        peer.close();
        peerConnectionsRef.current.delete(peerId);
        pendingCandidatesRef.current.delete(peerId);
        peerNamesRef.current.delete(peerId);
        setParticipants((current) => current.filter((participant) => participant.socketId !== peerId));
      }
    };

    return peer;
  };

  const makeOffer = async (peerId) => {
    const peer = peerConnectionsRef.current.get(peerId);
    if (!peer || peer.signalingState === "closed") return;

    try {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socketRef.current?.emit("signal", {
        to: peerId,
        data: { sdp: { type: peer.localDescription.type, sdp: peer.localDescription.sdp } },
      });
    } catch (error) {
      console.error("Unable to create offer", error);
    }
  };

  const handleSignal = async ({ from, data, username: peerName }) => {
    if (!from || !data) return;
    const peer = createPeer(from, peerName || "Participant");
    if (!peer) return;

    try {
      if (data.sdp) {
        await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));

        const queuedCandidates = pendingCandidatesRef.current.get(from) || [];
        for (const candidate of queuedCandidates) {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current.set(from, []);

        if (data.sdp.type === "offer") {
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socketRef.current?.emit("signal", {
            to: from,
            data: { sdp: { type: peer.localDescription.type, sdp: peer.localDescription.sdp } },
          });
        }
      }

      if (data.ice) {
        if (peer.remoteDescription?.type) {
          await peer.addIceCandidate(new RTCIceCandidate(data.ice));
        } else {
          const current = pendingCandidatesRef.current.get(from) || [];
          pendingCandidatesRef.current.set(from, [...current, data.ice]);
        }
      }
    } catch (error) {
      console.error("WebRTC signaling error", error);
    }
  };

  const stopAllMedia = () => {
    screenTrackRef.current?.stop();
    screenTrackRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    cameraTrackRef.current = null;
    microphoneTrackRef.current = null;
  };

  const closePeerConnections = () => {
    peerConnectionsRef.current.forEach((peer) => peer.close());
    peerConnectionsRef.current.clear();
    pendingCandidatesRef.current.clear();
    peerNamesRef.current.clear();
  };

  const cleanupMeeting = ({ stopMedia = true } = {}) => {
    socketRef.current?.removeAllListeners();
    socketRef.current?.disconnect();
    socketRef.current = null;
    closePeerConnections();
    if (stopMedia) stopAllMedia();
  };

  const prepareMedia = async () => {
    if (localStreamRef.current) return localStreamRef.current;

    let stream = null;
    let cameraOk = false;
    let microphoneOk = false;

    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      cameraOk = Boolean(stream.getVideoTracks().length);
      microphoneOk = Boolean(stream.getAudioTracks().length);
    } catch {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        microphoneOk = Boolean(stream.getAudioTracks().length);
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          cameraOk = Boolean(stream.getVideoTracks().length);
        } catch {
          stream = new MediaStream();
        }
      }
    }

    if (!mountedRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      return stream;
    }

    localStreamRef.current = stream;
    cameraTrackRef.current = stream.getVideoTracks()[0] || null;
    microphoneTrackRef.current = stream.getAudioTracks()[0] || null;

    setCameraAvailable(cameraOk);
    setMicrophoneAvailable(microphoneOk);
    setVideoEnabled(cameraOk);
    setAudioEnabled(microphoneOk);
    setPreviewStream(stream);
    setMediaReady(true);
    return stream;
  };

  useEffect(() => {
    mountedRef.current = true;

    if (!roomId) {
      setConnectionError("This meeting link is invalid.");
      setMediaReady(true);
      return () => { mountedRef.current = false; };
    }

    prepareMedia();

    return () => {
      mountedRef.current = false;
      cleanupMeeting({ stopMedia: true });
    };
  }, [roomId]);

  const connectToSocket = () => {
    const socket = io(server, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 12000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnecting(false);
      setConnectionError("");
      socket.emit("join-room", { roomId, username: username.trim() });
    });

    socket.on("connect_error", () => {
      setConnecting(false);
      setConnectionError("Could not connect to the meeting server. Make sure the backend is running on port 8000.");
    });

    socket.on("meeting-error", ({ message: errorMessage } = {}) => {
      setConnectionError(errorMessage || "Unable to join this meeting.");
    });

    socket.on("room-users", async (users = []) => {
      for (const user of users) {
        createPeer(user.socketId, user.username);
        await makeOffer(user.socketId);
      }
    });

    socket.on("user-joined", ({ socketId, username: peerName } = {}) => {
      createPeer(socketId, peerName || "Participant");
    });

    socket.on("signal", handleSignal);

    socket.on("user-left", ({ socketId } = {}) => {
      const peer = peerConnectionsRef.current.get(socketId);
      peer?.close();
      peerConnectionsRef.current.delete(socketId);
      pendingCandidatesRef.current.delete(socketId);
      peerNamesRef.current.delete(socketId);
      setParticipants((current) => current.filter((participant) => participant.socketId !== socketId));
    });

    socket.on("participant-count", (count) => {
      setParticipantCount(Number(count) || 1);
    });

    socket.on("chat-message", (incoming) => {
      if (!incoming?.message) return;
      setMessages((current) => [...current, incoming]);
      if (!chatOpenRef.current && incoming.socketId !== socket.id) {
        setUnread((current) => current + 1);
      }
    });

    return socket;
  };

  const joinMeeting = async () => {
    if (!roomId) {
      setConnectionError("Invalid meeting code.");
      return;
    }
    if (!username.trim()) {
      setConnectionError("Please enter your name before joining.");
      return;
    }

    setConnecting(true);
    setConnectionError("");
    try {
      await prepareMedia();
      setInMeeting(true);
      connectToSocket();
    } catch {
      setConnecting(false);
      setConnectionError("Unable to prepare your camera or microphone.");
    }
  };

  const toggleVideo = async () => {
    const track = cameraTrackRef.current;
    if (!track) {
      setConnectionError("Camera is not available. Check browser permissions and try again.");
      return;
    }
    track.enabled = !track.enabled;
    setVideoEnabled(track.enabled);
  };

  const toggleAudio = async () => {
    const track = microphoneTrackRef.current;
    if (!track) {
      setConnectionError("Microphone is not available. Check browser permissions and try again.");
      return;
    }
    track.enabled = !track.enabled;
    setAudioEnabled(track.enabled);
  };

  const stopScreenShare = async () => {
    const screenTrack = screenTrackRef.current;
    if (!screenTrack) return;

    screenTrack.onended = null;
    screenTrack.stop();
    screenTrackRef.current = null;
    const cameraTrack = cameraTrackRef.current;

    for (const [peerId, peer] of peerConnectionsRef.current.entries()) {
      const sender = peer.getSenders().find((item) => item.track?.kind === "video" || item === peer.__screenSender);
      if (sender) {
        await sender.replaceTrack(cameraTrack || null);
      }
      if (!cameraTrack) await makeOffer(peerId);
    }

    setPreviewStream(localStreamRef.current);
    setScreenSharing(false);
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      await stopScreenShare();
      return;
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      setConnectionError("Screen sharing is not supported in this browser.");
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenTrack = displayStream.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;

      for (const [peerId, peer] of peerConnectionsRef.current.entries()) {
        let sender = peer.getSenders().find((item) => item.track?.kind === "video");
        if (sender) {
          await sender.replaceTrack(screenTrack);
        } else {
          sender = peer.addTrack(screenTrack, displayStream);
          peer.__screenSender = sender;
          await makeOffer(peerId);
        }
      }

      const previewTracks = [screenTrack];
      if (microphoneTrackRef.current) previewTracks.push(microphoneTrackRef.current);
      setPreviewStream(new MediaStream(previewTracks));
      setScreenSharing(true);
      screenTrack.onended = () => stopScreenShare();
    } catch (error) {
      if (error?.name !== "NotAllowedError") {
        setConnectionError("Unable to start screen sharing.");
      }
    }
  };

  const sendMessage = (event) => {
    event?.preventDefault();
    const cleanMessage = message.trim();
    if (!cleanMessage || !socketRef.current?.connected) return;
    socketRef.current.emit("chat-message", { message: cleanMessage });
    setMessage("");
  };

  const copyInvite = async () => {
    const inviteUrl = `${window.location.origin}/meeting/${roomId}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setConnectionError("Could not copy the invite link. Please copy it from the address bar.");
    }
  };

  const leaveMeeting = () => {
    cleanupMeeting({ stopMedia: true });
    navigate(isAuthenticated ? "/home" : "/", { replace: true });
  };

  if (!inMeeting) {
    return (
      <main className={styles.lobbyPage}>
        <header className={styles.lobbyHeader}>
          <button className={styles.brandButton} onClick={() => navigate(isAuthenticated ? "/home" : "/")}>
            <span><VideoCallRoundedIcon /></span> ApnaMeet
          </button>
          <div className={styles.secureLabel}><LockRoundedIcon /> Secure meeting room</div>
        </header>

        <section className={styles.lobbyShell}>
          <div className={styles.previewPanel}>
            <div className={styles.previewVideoWrap}>
              {previewStream?.getVideoTracks()?.length ? (
                <video ref={localVideoRef} autoPlay muted playsInline className={!videoEnabled ? styles.hiddenVideo : ""} />
              ) : null}
              {(!cameraAvailable || !videoEnabled) && (
                <div className={styles.previewFallback}>
                  <Avatar sx={{ width: 86, height: 86, fontSize: 28 }}>{initials(username)}</Avatar>
                  <span>{cameraAvailable ? "Camera is off" : "Camera unavailable"}</span>
                </div>
              )}
              <div className={styles.previewTopPill}>{roomId || "Invalid room"}</div>
              <div className={styles.previewControls}>
                <Tooltip title={videoEnabled ? "Turn camera off" : "Turn camera on"}>
                  <span>
                    <IconButton onClick={toggleVideo} disabled={!cameraAvailable} className={videoEnabled ? styles.previewControlActive : styles.previewControlOff}>
                      {videoEnabled ? <VideocamRoundedIcon /> : <VideocamOffRoundedIcon />}
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title={audioEnabled ? "Mute microphone" : "Unmute microphone"}>
                  <span>
                    <IconButton onClick={toggleAudio} disabled={!microphoneAvailable} className={audioEnabled ? styles.previewControlActive : styles.previewControlOff}>
                      {audioEnabled ? <MicRoundedIcon /> : <MicOffRoundedIcon />}
                    </IconButton>
                  </span>
                </Tooltip>
              </div>
              {!mediaReady && <div className={styles.mediaLoading}>Checking camera & microphone…</div>}
            </div>
          </div>

          <div className={styles.lobbyCard}>
            <span className={styles.lobbyKicker}>READY TO JOIN?</span>
            <h1>Enter the room</h1>
            <p>You are joining <strong>{roomId || "an invalid meeting"}</strong>. Choose the name others will see.</p>

            {connectionError && <Alert severity="error" sx={{ mb: 2 }}>{connectionError}</Alert>}

            <TextField
              label="Your display name"
              value={username}
              onChange={(event) => { setUsername(event.target.value); setConnectionError(""); }}
              fullWidth
              autoFocus={!storedUser?.name}
              inputProps={{ maxLength: 50 }}
              onKeyDown={(event) => event.key === "Enter" && joinMeeting()}
            />

            <button className={styles.joinButton} onClick={joinMeeting} disabled={connecting || !mediaReady || !roomId}>
              {connecting ? "Connecting…" : "Join meeting"}
            </button>

            <button className={styles.copyInviteButton} onClick={copyInvite} disabled={!roomId}>
              <ContentCopyRoundedIcon /> {copied ? "Invite link copied" : "Copy invite link"}
            </button>

            <div className={styles.lobbyNote}>
              <LockRoundedIcon /> Your browser will only share devices you allow.
            </div>
          </div>
        </section>
      </main>
    );
  }

  const totalTiles = participants.length + 1;

  return (
    <main className={styles.meetingPage}>
      <header className={styles.meetingHeader}>
        <div className={styles.meetingBrand}><span><VideoCallRoundedIcon /></span><strong>ApnaMeet</strong></div>
        <div className={styles.roomMeta}>
          <span className={styles.liveDot} />
          <div><strong>{roomId}</strong><small><PeopleAltRoundedIcon /> {participantCount} participant{participantCount === 1 ? "" : "s"}</small></div>
        </div>
        <button className={styles.inviteButton} onClick={copyInvite}><ContentCopyRoundedIcon /> {copied ? "Copied" : "Copy invite"}</button>
      </header>

      {connectionError && (
        <div className={styles.meetingAlert}><Alert severity="warning" onClose={() => setConnectionError("")}>{connectionError}</Alert></div>
      )}

      <section className={`${styles.meetingBody} ${chatOpen ? styles.withChat : ""}`}>
        <div className={styles.stage}>
          <div className={`${styles.videoGrid} ${totalTiles === 1 ? styles.singleGrid : totalTiles === 2 ? styles.twoGrid : ""}`}>
            <article className={styles.videoTile}>
              {previewStream?.getVideoTracks()?.length ? (
                <video ref={localVideoRef} autoPlay muted playsInline className={!videoEnabled && !screenSharing ? styles.hiddenVideo : ""} />
              ) : null}
              {(!videoEnabled && !screenSharing) || !previewStream?.getVideoTracks()?.length ? (
                <div className={styles.videoFallback}><Avatar sx={{ width: 82, height: 82, fontSize: 27 }}>{initials(username)}</Avatar></div>
              ) : null}
              <div className={styles.tileLabel}><span>You</span>{!audioEnabled && <MicOffRoundedIcon />}</div>
              {screenSharing && <div className={styles.screenBadge}>You are presenting</div>}
            </article>

            {participants.map((participant) => (
              <RemoteVideoTile key={participant.socketId} participant={participant} />
            ))}
          </div>

          {participants.length === 0 && (
            <div className={styles.waitingPill}><span className={styles.waitingPulse} /> Waiting for others to join…</div>
          )}
        </div>

        {chatOpen && (
          <aside className={styles.chatPanel}>
            <div className={styles.chatHeader}>
              <div><strong>In-call messages</strong><small>Everyone in this room can see them</small></div>
              <IconButton onClick={() => setChatOpen(false)}><CloseRoundedIcon /></IconButton>
            </div>

            <div className={styles.chatMessages}>
              {messages.length === 0 ? (
                <div className={styles.chatEmpty}><ChatBubbleRoundedIcon /><strong>No messages yet</strong><span>Start the conversation while you meet.</span></div>
              ) : (
                messages.map((item) => {
                  const mine = item.socketId === socketRef.current?.id;
                  return (
                    <div className={`${styles.chatMessage} ${mine ? styles.myMessage : ""}`} key={item.id || `${item.socketId}-${item.sentAt}`}>
                      <div className={styles.chatMessageMeta}><strong>{mine ? "You" : item.sender}</strong><small>{item.sentAt ? new Date(item.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</small></div>
                      <p>{item.message}</p>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <form className={styles.chatComposer} onSubmit={sendMessage}>
              <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Type a message…" maxLength={2000} />
              <button type="submit" disabled={!message.trim()}><SendRoundedIcon /></button>
            </form>
          </aside>
        )}
      </section>

      <footer className={styles.controlBar}>
        <div className={styles.controlSide}><span className={styles.connectionStatus}><span /> Connected</span></div>
        <div className={styles.controlCenter}>
          <ControlButton label={audioEnabled ? "Mute" : "Unmute"} active={audioEnabled} onClick={toggleAudio} icon={audioEnabled ? <MicRoundedIcon /> : <MicOffRoundedIcon />} />
          <ControlButton label={videoEnabled ? "Stop video" : "Start video"} active={videoEnabled} onClick={toggleVideo} icon={videoEnabled ? <VideocamRoundedIcon /> : <VideocamOffRoundedIcon />} />
          <ControlButton label={screenSharing ? "Stop share" : "Share screen"} active={screenSharing} highlighted={screenSharing} onClick={toggleScreenShare} icon={screenSharing ? <StopScreenShareRoundedIcon /> : <ScreenShareRoundedIcon />} />
          <div className={styles.chatControlWrap}>
            {unread > 0 && <span className={styles.unreadBadge}>{unread > 99 ? "99+" : unread}</span>}
            <ControlButton label="Chat" active={chatOpen} highlighted={chatOpen} onClick={() => setChatOpen((open) => !open)} icon={<ChatBubbleRoundedIcon />} />
          </div>
          <button className={styles.leaveButton} onClick={leaveMeeting}><CallEndRoundedIcon /><span>Leave</span></button>
        </div>
        <div className={styles.controlSideRight}>
          <button className={styles.mobileBackButton} onClick={leaveMeeting}><ArrowBackRoundedIcon /></button>
        </div>
      </footer>
    </main>
  );
}

function RemoteVideoTile({ participant }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && participant.stream) {
      ref.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  const hasVideo = Boolean(participant.stream?.getVideoTracks()?.length);

  return (
    <article className={styles.videoTile}>
      {hasVideo && <video ref={ref} autoPlay playsInline />}
      {!hasVideo && <div className={styles.videoFallback}><Avatar sx={{ width: 82, height: 82, fontSize: 27 }}>{initials(participant.username)}</Avatar></div>}
      <div className={styles.tileLabel}><span>{participant.username || "Participant"}</span></div>
    </article>
  );
}

function ControlButton({ label, icon, onClick, active, highlighted }) {
  return (
    <button
      className={`${styles.controlButton} ${!active ? styles.controlMuted : ""} ${highlighted ? styles.controlHighlighted : ""}`}
      onClick={onClick}
      type="button"
    >
      <span>{icon}</span>
      <small>{label}</small>
    </button>
  );
}
