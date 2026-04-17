// VideoCall.jsx
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const VideoCall = () => {
  const env = import.meta.env || {};
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const socketUrl =
    env.VITE_SOCKET_URL || env.VITE_BACKEND_URL || "http://localhost:5000";
  const [allUsers, setAllUsers] = useState({});
  const [joined, setJoined] = useState(false);
  const [caller, setCaller] = useState([]);
  const usernameRef = useRef(null);
  const fileInputRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localScreenRef = useRef(null);
  const remoteScreenRef = useRef(null);
  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const dataChannelRef = useRef(null);
  const localStreamRef = useRef(null);
  const localScreenStreamRef = useRef(null);
  const remoteCameraStreamRef = useRef(new MediaStream());
  const remoteScreenStreamRef = useRef(new MediaStream());
  const incomingDocumentRef = useRef({
    meta: null,
    buffers: [],
    received: 0,
  });
  const activeDocumentUrlRef = useRef(null);
  const [username, setUsername] = useState(""); // store username permanently
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRemoteScreenSharing, setIsRemoteScreenSharing] = useState(false);
  const [sharedDocument, setSharedDocument] = useState(null);
  const [isReceivingDocument, setIsReceivingDocument] = useState(false);

  /** Display-capture tracks expose displaySurface in getSettings() (Chrome, Edge, Firefox). */
  const isScreenTrack = (track) => {
    if (!track || track.kind !== "video") return false;
    try {
      const settings =
        typeof track.getSettings === "function" ? track.getSettings() : {};
      if (settings.displaySurface) return true;
    } catch {
      /* ignore */
    }
    const label = (track.label || "").toLowerCase();
    return (
      label.includes("screen") ||
      label.includes("window") ||
      label.includes("display") ||
      label.includes("monitor") ||
      label.includes("desktop") ||
      label.includes("entire") ||
      label.includes("tab") ||
      label.includes("capture")
    );
  };

  const getPeerUser = () => {
    if (caller.length < 2 || !username) return "";
    return caller[0] === username ? caller[1] : caller[0];
  };

  const updateSharedDocument = ({ name, type, url, source }) => {
    if (activeDocumentUrlRef.current) {
      URL.revokeObjectURL(activeDocumentUrlRef.current);
    }
    activeDocumentUrlRef.current = url;
    setSharedDocument({
      name,
      type,
      url,
      source,
    });
  };

  const resetSharedDocument = () => {
    if (activeDocumentUrlRef.current) {
      URL.revokeObjectURL(activeDocumentUrlRef.current);
      activeDocumentUrlRef.current = null;
    }
    setSharedDocument(null);
  };

  const setupDataChannel = (channel) => {
    dataChannelRef.current = channel;

    channel.onopen = () => console.log("Document channel connected");
    channel.onclose = () => console.log("Document channel closed");
    channel.onerror = (error) => {
      console.error("Document channel error:", error);
    };

    channel.onmessage = async (event) => {
      if (typeof event.data === "string") {
        let payload;
        try {
          payload = JSON.parse(event.data);
        } catch {
          return;
        }

        if (payload.type === "doc-meta") {
          incomingDocumentRef.current = {
            meta: payload,
            buffers: [],
            received: 0,
          };
          setIsReceivingDocument(true);
          return;
        }

        if (payload.type === "doc-complete") {
          const incoming = incomingDocumentRef.current;
          const blob = new Blob(incoming.buffers, {
            type: incoming.meta?.mime || "application/octet-stream",
          });
          const url = URL.createObjectURL(blob);
          updateSharedDocument({
            name: incoming.meta?.name || "shared-document",
            type: incoming.meta?.mime || "application/octet-stream",
            url,
            source: "remote",
          });
          incomingDocumentRef.current = { meta: null, buffers: [], received: 0 };
          setIsReceivingDocument(false);
        }
        return;
      }

      const incoming = incomingDocumentRef.current;
      if (!incoming.meta) return;

      if (event.data instanceof ArrayBuffer) {
        incoming.buffers.push(event.data);
        incoming.received += event.data.byteLength;
      } else if (event.data instanceof Blob) {
        const buffer = await event.data.arrayBuffer();
        incoming.buffers.push(buffer);
        incoming.received += buffer.byteLength;
      }
    };
  };

  const sendControlMessage = (payload) => {
    const channel = dataChannelRef.current;
    if (!channel || channel.readyState !== "open") return false;
    channel.send(JSON.stringify(payload));
    return true;
  };

  // Initialize socket connection and events
  useEffect(() => {
    const s = io(socketUrl, { transports: ["websocket"] });
    socketRef.current = s;

    s.on("connect", () => console.log("Socket connected:", s.id));

    s.on("joined", (users) => {
      console.log("Users received:", users);
      setAllUsers(users);
    });

    s.on("offer", async ({ from, to, offer }) => {
      console.log("Offer received from:", from);
      const pc = getPeerConnection();
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      s.emit("answer", { from, to, answer: pc.localDescription });
      setCaller([from, to]);
    });

    s.on("answer", async ({ from, to, answer }) => {
      console.log("Answer received from:", to);
      const pc = getPeerConnection();
      await pc.setRemoteDescription(answer);
      setCaller([from, to]);
    });

    s.on("icecandidate", async (candidate) => {
      const pc = getPeerConnection();
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    s.on("call-ended", () => {
      endCall();
    });

    return () => {
      s.disconnect();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (localScreenStreamRef.current) {
        localScreenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      resetSharedDocument();
    };
  }, []);

  // Start local video
  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localVideoRef.current.srcObject = stream;
        localStreamRef.current = stream;
      } catch (err) {
        console.error("Error accessing camera/mic:", err);
      }
    };
    startVideo();
  }, []);

  // Create or return existing peer connection
  const getPeerConnection = () => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    if (localStreamRef.current) {
      localStreamRef.current
        .getTracks()
        .forEach((track) => pc.addTrack(track, localStreamRef.current));
    }
    if (localScreenStreamRef.current) {
      localScreenStreamRef.current
        .getTracks()
        .forEach((track) => pc.addTrack(track, localScreenStreamRef.current));
    }

    pc.ontrack = (event) => {
      const track = event.track;
      if (track.kind === "audio") {
        remoteCameraStreamRef.current.addTrack(track);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteCameraStreamRef.current;
        }
        return;
      }

      // Check traditional hints (often stripped over WebRTC on mobile browsers)
      let treatAsScreen = isScreenTrack(track);

      // Fallback: If we already have a remotely received camera video track, 
      // the new incoming video track is very likely the screen share track.
      if (!treatAsScreen && track.kind === "video") {
        if (remoteCameraStreamRef.current.getVideoTracks().length > 0) {
          treatAsScreen = true;
        }
      }

      if (treatAsScreen) {
        if (
          !remoteScreenStreamRef.current
            .getTracks()
            .some((existingTrack) => existingTrack.id === track.id)
        ) {
          remoteScreenStreamRef.current.addTrack(track);
        }
        if (remoteScreenRef.current) {
          remoteScreenRef.current.srcObject = remoteScreenStreamRef.current;
          remoteScreenRef.current.play?.().catch(() => { });
        }
        setIsRemoteScreenSharing(true);
      } else {
        if (
          !remoteCameraStreamRef.current
            .getTracks()
            .some((existingTrack) => existingTrack.id === track.id)
        ) {
          remoteCameraStreamRef.current.addTrack(track);
        }
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteCameraStreamRef.current;
          remoteVideoRef.current.play?.().catch(() => { });
        }
      }

      track.onended = () => {
        if (treatAsScreen) {
          remoteScreenStreamRef.current.removeTrack(track);
          if (remoteScreenStreamRef.current.getTracks().length === 0) {
            setIsRemoteScreenSharing(false);
            if (remoteScreenRef.current) {
              remoteScreenRef.current.srcObject = null;
            }
          }
        } else {
          remoteCameraStreamRef.current.removeTrack(track);
        }
      };
    };

    pc.ondatachannel = (event) => {
      setupDataChannel(event.channel);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate)
        socketRef.current.emit("icecandidate", event.candidate);
    };

    pcRef.current = pc;
    return pc;
  };

  // Join as a user
  const handleJoin = () => {
    const name = usernameRef.current.value.trim();
    if (!name) return;
    setUsername(name); // <-- store username
    socketRef.current.emit("join-user", name);
    setJoined(true); // field will NOT hide
  };

  // Start call to a user
  const startCall = async (user) => {
    console.log("Calling:", user);
    const pc = getPeerConnection();
    if (!dataChannelRef.current || dataChannelRef.current.readyState === "closed") {
      const dataChannel = pc.createDataChannel("document-share");
      setupDataChannel(dataChannel);
    }
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socketRef.current.emit("offer", {
      from: username, // <-- use state instead of ref
      to: user,
      offer: pc.localDescription,
    });

    setCaller([username, user]);
  };

  const renegotiate = async () => {
    const pc = pcRef.current;
    const peerUser = getPeerUser();
    if (!pc || !peerUser || !username) return;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current.emit("offer", {
      from: username,
      to: peerUser,
      offer: pc.localDescription,
    });
  };

  const handleStartScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      localScreenStreamRef.current = screenStream;
      if (localScreenRef.current) {
        localScreenRef.current.srcObject = screenStream;
      }

      const pc = getPeerConnection();
      screenStream.getTracks().forEach((track) => {
        pc.addTrack(track, screenStream);
      });

      const [screenTrack] = screenStream.getVideoTracks();
      if (screenTrack) {
        screenTrack.onended = () => {
          handleStopScreenShare();
        };
      }

      setIsScreenSharing(true);
      await renegotiate();
    } catch (err) {
      console.error("Unable to start screen sharing:", err);
    }
  };

  const handleStopScreenShare = async () => {
    const screenStream = localScreenStreamRef.current;
    const pc = pcRef.current;
    if (!screenStream) return;

    const trackIds = new Set(screenStream.getTracks().map((track) => track.id));
    if (pc) {
      pc.getSenders().forEach((sender) => {
        if (sender.track && trackIds.has(sender.track.id)) {
          pc.removeTrack(sender);
        }
      });
    }

    screenStream.getTracks().forEach((track) => track.stop());
    localScreenStreamRef.current = null;
    if (localScreenRef.current) {
      localScreenRef.current.srcObject = null;
    }
    setIsScreenSharing(false);
    await renegotiate();
  };

  const handleOpenDocumentPicker = () => {
    if (!caller.length) return;
    fileInputRef.current?.click();
  };

  const handleDocumentSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const channel = dataChannelRef.current;
    if (!channel || channel.readyState !== "open") {
      alert("Document channel not connected yet. Please wait for call to connect.");
      event.target.value = "";
      return;
    }

    const buffer = await file.arrayBuffer();
    const localBlob = new Blob([buffer], { type: file.type || "application/octet-stream" });
    const localUrl = URL.createObjectURL(localBlob);
    updateSharedDocument({
      name: file.name,
      type: file.type || "application/octet-stream",
      url: localUrl,
      source: "local",
    });

    sendControlMessage({
      type: "doc-meta",
      name: file.name,
      mime: file.type || "application/octet-stream",
      size: buffer.byteLength,
    });

    const CHUNK_SIZE = 16 * 1024;
    for (let offset = 0; offset < buffer.byteLength; offset += CHUNK_SIZE) {
      const chunk = buffer.slice(offset, offset + CHUNK_SIZE);
      channel.send(chunk);
    }

    sendControlMessage({ type: "doc-complete" });
    event.target.value = "";
  };

  // Sync newly mounted video elements with their streams
  useEffect(() => {
    if (isScreenSharing && localScreenRef.current && localScreenStreamRef.current) {
      localScreenRef.current.srcObject = localScreenStreamRef.current;
      localScreenRef.current.play?.().catch(() => { });
    }
  }, [isScreenSharing]);

  useEffect(() => {
    if (isRemoteScreenSharing && !isScreenSharing && remoteScreenRef.current && remoteScreenStreamRef.current) {
      remoteScreenRef.current.srcObject = remoteScreenStreamRef.current;
      remoteScreenRef.current.play?.().catch(() => { });
    }
  }, [isRemoteScreenSharing, isScreenSharing]);

  // End call
  const endCall = () => {
    const pc = pcRef.current;
    if (pc) {
      pc.close();
      pcRef.current = null;
    }
    if (localScreenStreamRef.current) {
      localScreenStreamRef.current.getTracks().forEach((track) => track.stop());
      localScreenStreamRef.current = null;
    }
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    remoteCameraStreamRef.current = new MediaStream();
    remoteScreenStreamRef.current = new MediaStream();
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (remoteScreenRef.current) {
      remoteScreenRef.current.srcObject = null;
    }
    setIsScreenSharing(false);
    setIsRemoteScreenSharing(false);
    setIsReceivingDocument(false);
    resetSharedDocument();
    setCaller([]);
  };

  const isPdf = sharedDocument?.type?.includes("pdf");
  const isImage = sharedDocument?.type?.startsWith("image/");
  const hasActiveSharedContent = isScreenSharing || isRemoteScreenSharing || sharedDocument;
  const showingLocalScreen = isScreenSharing;

  return (
    <main className="main-container min-h-screen bg-slate-100 p-4">
      {/* Sidebar with users */}
      <div className="mx-auto flex max-w-[1600px] gap-4">
        <aside className="caller-list-wrapper w-64 shrink-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <h1 className="caller-list-heading mb-2 text-xl font-semibold text-black">
            Contacts
          </h1>
          <ul className="caller-list space-y-2">
            {Object.keys(allUsers).map((user) => (
              <li
                key={user}
                className="flex items-center justify-between rounded-md border border-slate-200 px-2 py-2 text-black"
              >
                <span>
                  {user} {user === username ? "(You)" : ""}
                </span>
                {user !== username && joined && (
                  <button
                    onClick={() => startCall(user)}
                    className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    Call
                  </button>
                )}
              </li>
            ))}
          </ul>
        </aside>

        {/* Share area */}
        <section className="video-call-container flex-1 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          {/* Username input */}
          {!joined && (
            <div className="username-input mb-3 flex items-center gap-2">
              <input
                ref={usernameRef}
                type="text"
                placeholder="Enter Username"
                className="w-64 rounded border border-slate-300 p-2 text-black placeholder-black"
              />
              <button
                onClick={handleJoin}
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Join
              </button>
            </div>
          )}

          {caller.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {!isScreenSharing ? (
                <button
                  onClick={handleStartScreenShare}
                  className="rounded bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
                >
                  Share Screen
                </button>
              ) : (
                <button
                  onClick={handleStopScreenShare}
                  className="rounded bg-amber-500 px-3 py-2 text-sm text-white hover:bg-amber-600"
                >
                  Stop Screen
                </button>
              )}
              <button
                onClick={handleOpenDocumentPicker}
                className="rounded bg-violet-600 px-3 py-2 text-sm text-white hover:bg-violet-700"
              >
                Share Document
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleDocumentSelect}
              />
            </div>
          )}

          <div className="rounded-lg border border-slate-200 bg-slate-900 p-2">
            <p className="mb-2 text-sm text-slate-200">
              {isReceivingDocument
                ? "Receiving document..."
                : "Shared content (visible on both browsers)"}
            </p>
            <div className="h-[72vh] overflow-hidden rounded-md bg-black">
              {!hasActiveSharedContent && (
                <div className="flex h-full items-center justify-center text-sm text-slate-300">
                  Start screen share or share a document after call starts.
                </div>
              )}

              {isScreenSharing && (
                <video
                  ref={localScreenRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full object-contain"
                />
              )}

              {isRemoteScreenSharing && !showingLocalScreen && (
                <video
                  ref={remoteScreenRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-contain"
                />
              )}

              {!isScreenSharing && !isRemoteScreenSharing && sharedDocument && (
                <div className="relative h-full w-full">
                  {/* Actions overlay for desktop if iframe/img is showing */}
                  {(!isMobile || isImage) && (
                    <div className="absolute right-2 top-2 z-10 flex gap-2 rounded-md bg-black/50 p-1">
                      <button
                        onClick={() => window.open(sharedDocument.url, "_blank")}
                        className="rounded bg-indigo-600 px-3 py-1 text-sm font-medium text-white shadow hover:bg-indigo-700"
                      >
                        Open
                      </button>
                      <a
                        href={sharedDocument.url}
                        download={sharedDocument.name}
                        className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white shadow hover:bg-blue-700"
                      >
                        Download
                      </a>
                    </div>
                  )}

                  {isPdf && !isMobile ? (
                    <iframe
                      src={sharedDocument.url}
                      title="Shared PDF"
                      className="h-full w-full bg-white"
                    />
                  ) : isImage ? (
                    <img
                      src={sharedDocument.url}
                      alt={sharedDocument.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-4 text-white">
                      <div className="flex items-center justify-center rounded-full bg-slate-800 p-6">
                        <svg
                          className="h-16 w-16 text-blue-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-xl font-medium tracking-wide">{sharedDocument.name}</p>
                      <p className="max-w-xs text-center text-sm text-slate-300">
                        This document cannot be previewed directly on mobile.
                      </p>
                      <div className="mt-2 flex gap-4">
                        <button
                          onClick={() => window.open(sharedDocument.url, "_blank")}
                          className="rounded bg-indigo-600 px-6 py-2.5 text-sm font-semibold tracking-wide hover:bg-indigo-700"
                        >
                          Open In New Tab
                        </button>
                        <a
                          href={sharedDocument.url}
                          download={sharedDocument.name}
                          className="rounded bg-blue-600 px-6 py-2.5 text-sm font-semibold tracking-wide hover:bg-blue-700"
                        >
                          Download File
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {caller.length > 0 && (
            <div className="mt-2">
              <button
                onClick={endCall}
                className="call call-disconnect rounded bg-red-600 p-2 text-white hover:bg-red-700"
              >
                End Call
              </button>
            </div>
          )}
        </section>

        {/* Right side videos */}
        <aside className="w-72 shrink-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-black">Live Videos</h2>
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-900 p-2">
              <p className="mb-1 text-xs text-slate-200">Your Camera</p>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="h-48 w-full rounded bg-black object-cover"
              />
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-900 p-2">
              <p className="mb-1 text-xs text-slate-200">Remote Camera</p>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="h-48 w-full rounded bg-black object-cover"
              />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
};

export default VideoCall;
