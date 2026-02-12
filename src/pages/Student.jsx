import React, { useRef, useEffect, useState } from "react";
import socket from "../../src/socket";

export default function Student() {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const pc = useRef(null);
  const teacherId = useRef(null);
  const [room, setRoom] = useState("");
  const iceQueue = useRef([]); // ICE candidates queue until remoteDescription set

  useEffect(() => {
    console.log("🔥 Student useEffect run");

    pc.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // Remote video track
    pc.current.ontrack = (e) => {
      console.log("[Student] TRACK RECEIVED", e.streams);
      remoteVideo.current.srcObject = e.streams[0];
    };

    // ICE candidates
    pc.current.onicecandidate = (e) => {
      if (e.candidate && teacherId.current) {
        if (pc.current.remoteDescription) {
          socket.emit("ice-candidate", {
            to: teacherId.current,
            candidate: e.candidate,
          });
          console.log("[Student] ICE candidate sent:", e.candidate);
        } else {
          iceQueue.current.push(e.candidate);
          console.log("[Student] ICE candidate queued", e.candidate);
        }
      }
    };

    // Receive offer from teacher
    socket.on("offer", async ({ offer, from }) => {
      console.log("[Student] OFFER received from teacher", from);
      teacherId.current = from;

      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localVideo.current.srcObject = stream;
        stream.getTracks().forEach((t) => pc.current.addTrack(t, stream));
        console.log("[Student] Local media added");
      } catch (err) {
        console.error("❌ getUserMedia failed:", err);
        alert(
          "Cannot access camera/mic. Check browser permissions and that no other app is using them."
        );
        return;
      }

      try {
        await pc.current.setRemoteDescription(offer);
        const answer = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answer);
        socket.emit("answer", { to: from, answer });
        console.log("[Student] ANSWER sent to teacher");

        // Add any queued ICE candidates
        iceQueue.current.forEach((c) => {
          pc.current.addIceCandidate(c).catch((err) => {
            console.error("❌ Error adding queued ICE:", err);
          });
        });
        iceQueue.current = [];
      } catch (err) {
        console.error("❌ Error handling offer:", err);
      }
    });

    // Receive ICE candidate from teacher
    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        if (pc.current.remoteDescription) {
          await pc.current.addIceCandidate(candidate);
          console.log("[Student] ICE candidate added", candidate);
        } else {
          iceQueue.current.push(candidate);
          console.log("[Student] ICE candidate queued until remoteDescription", candidate);
        }
      } catch (err) {
        console.error("❌ Error adding ICE candidate:", err);
      }
    });
  }, []);

  const joinClass = () => {
    console.log("=== STUDENT CLICKED JOIN ===");
    console.log("Room:", room);

    socket.emit("join-room", {
      roomId: room,
      role: "student",
    });
    console.log("[Student] JOIN-ROOM event sent");
  };

  return (
    <div>
      <input
        placeholder="Room name"
        onChange={(e) => setRoom(e.target.value)}
      />
      <button
        onClick={joinClass}
        className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
      >
        Join Class
      </button>

      <h3>Student</h3>
      <video ref={localVideo} autoPlay muted playsInline width="300" />
      <video ref={remoteVideo} autoPlay playsInline width="300" />
    </div>
  );
}
