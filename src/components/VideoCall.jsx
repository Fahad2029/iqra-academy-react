// VideoCall.jsx
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const VideoCall = () => {
  const [allUsers, setAllUsers] = useState({});
  const [joined, setJoined] = useState(false);
  const [caller, setCaller] = useState([]);
  const usernameRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const [username, setUsername] = useState(""); // store username permanently


  // Initialize socket connection and events
  useEffect(() => {
    const s = io("https://unrelinquished-uncolourably-perla.ngrok-free.dev", { transports: ["websocket"] });
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

    return () => s.disconnect();
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
        window.localStream = stream;
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

    window.localStream.getTracks().forEach((track) => pc.addTrack(track, window.localStream));

    pc.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) socketRef.current.emit("icecandidate", event.candidate);
    };

    pcRef.current = pc;
    return pc;
  };

  // Join as a user
 const handleJoin = () => {
  const name = usernameRef.current.value.trim();
  if (!name) return;
  setUsername(name);  // <-- store username
  socketRef.current.emit("join-user", name);
  setJoined(true);    // field will NOT hide
};


  // Start call to a user
 const startCall = async (user) => {
  console.log("Calling:", user);
  const pc = getPeerConnection();
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  socketRef.current.emit("offer", {
    from: username,  // <-- use state instead of ref
    to: user,
    offer: pc.localDescription,
  });

  setCaller([username, user]);
};


  // End call
  const endCall = () => {
    const pc = pcRef.current;
    if (pc) {
      pc.close();
      pcRef.current = null;
    }
    setCaller([]);
  };

return (
  <main className="main-container p-4 flex gap-4">
    {/* Sidebar with users */}
    <aside className="caller-list-wrapper w-64 border p-2">
      <h1 className="caller-list-heading text-xl font-semibold mb-2 text-black">Contacts</h1>
      <ul className="caller-list space-y-2">
        {Object.keys(allUsers).map((user) => (
          <li key={user} className="flex justify-between items-center text-black">
            <span>{user} {user === username  ? "(You)" : ""}</span>
            {user !== username  && joined && (
              <button
                onClick={() => startCall(user)}
              >
                        📞
              </button>
            )}
          </li>
        ))}
      </ul>
    </aside>

    {/* Video section */}
    <section className="video-call-container flex-1 flex flex-col gap-2">
      {/* Username input */}
      {!joined && (
        <div className="username-input mb-2">
          <input
            ref={usernameRef}
            type="text"
            placeholder="Enter Username"
            className="border p-2 rounded w-64 text-black placeholder-black"
          />
          <button
            onClick={handleJoin}
            className="ml-2 px-4 py-2 bg-accent text-white rounded"
          >
            Create
          </button>
        </div>
      )}

      {/* Video streams */}
      <div className="video-streams flex gap-2">
        <div className="local-video w-1/2 bg-gray-200">
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-auto" />
        </div>
        <div className="remote-video w-1/2 bg-gray-200">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-auto" />
        </div>
      </div>

      {/* End call button */}
      {caller.length > 0 && (
        <div className="mt-2">
          <button
            onClick={endCall}
            className="call call-disconnect bg-red-500 p-2 rounded text-white"
          >
            <img src="/images/phone-disconnect.png" alt="" className="inline-block" />
            End Call
          </button>
        </div>
      )}
    </section>
  </main>
);
};

export default VideoCall;
