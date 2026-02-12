import React, { useRef, useEffect, useState } from "react";
import socket from "../../src/socket";

export default function Teacher() {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const pc = useRef(null);
  const studentId = useRef(null);
  const [room, setRoom] = useState("");
  const iceQueue = useRef([]); // ICE candidates queue until remoteDescription set

  useEffect(() => {
    console.log("🔥 Teacher useEffect run");

    pc.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // Remote video track
    pc.current.ontrack = (e) => {
      console.log("[Teacher] TRACK RECEIVED", e.streams);
      remoteVideo.current.srcObject = e.streams[0];
    };

    // ICE candidates
    pc.current.onicecandidate = (e) => {
      if (e.candidate && studentId.current) {
        if (pc.current.remoteDescription) {
          socket.emit("ice-candidate", {
            to: studentId.current,
            candidate: e.candidate,
          });
          console.log("[Teacher] Sending ICE candidate to student", e.candidate);
        } else {
          iceQueue.current.push(e.candidate);
          console.log("[Teacher] ICE candidate queued", e.candidate);
        }
      }
    };

    // When student joins room
    socket.on("user-joined", async (studentSocketId) => {
      console.log("📥 STUDENT JOINED:", studentSocketId);
      studentId.current = studentSocketId;

      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localVideo.current.srcObject = stream;
        stream.getTracks().forEach((t) => pc.current.addTrack(t, stream));
        console.log("[Teacher] Local media added");
      } catch (err) {
        console.error("❌ Failed to get local media:", err);
        alert(
          "Cannot access camera/mic. Check browser permissions and that no other app is using them."
        );
        return;
      }

      try {
        const offer = await pc.current.createOffer();
        await pc.current.setLocalDescription(offer);
        socket.emit("offer", { to: studentSocketId, offer });
        console.log("[Teacher] OFFER sent to student:", studentSocketId);

        // Add any queued ICE candidates (in case some arrived early)
        iceQueue.current.forEach((c) => {
          pc.current.addIceCandidate(c).catch((err) => {
            console.error("❌ Error adding queued ICE:", err);
          });
        });
        iceQueue.current = [];
      } catch (err) {
        console.error("❌ Failed to create/send offer:", err);
      }
    });

    // Receive answer from student
    socket.on("answer", async ({ answer }) => {
      try {
        await pc.current.setRemoteDescription(answer);
        console.log("[Teacher] ANSWER received from student");

        // Add any queued ICE candidates
        iceQueue.current.forEach((c) => {
          pc.current.addIceCandidate(c).catch((err) => {
            console.error("❌ Error adding queued ICE after answer:", err);
          });
        });
        iceQueue.current = [];
      } catch (err) {
        console.error("❌ Error setting remote description:", err);
      }
    });

    // Receive ICE candidate from student
    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        if (pc.current.remoteDescription) {
          await pc.current.addIceCandidate(candidate);
          console.log("[Teacher] ICE candidate added from student", candidate);
        } else {
          iceQueue.current.push(candidate);
          console.log("[Teacher] ICE candidate queued until remoteDescription", candidate);
        }
      } catch (err) {
        console.error("❌ Error adding ICE candidate from student:", err);
      }
    });
  }, []);

  const startClass = () => {
    console.log("=== TEACHER CLICKED START ===");
    console.log("Room:", room);

    socket.emit("join-room", {
      roomId: room,
      role: "teacher",
    });
    console.log("JOIN-ROOM EVENT SENT FROM TEACHER");
  };

 

  return (
    <div>
      <input
        placeholder="Room name"
        onChange={(e) => setRoom(e.target.value)}
      />
      <button
        onClick={startClass}
        className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
      >
        Start Class
      </button>
    

      <h3>Teacher</h3>
      <video ref={localVideo} autoPlay muted playsInline width="300" />
      <video ref={remoteVideo} autoPlay playsInline width="300" />
    </div>
  );
}
