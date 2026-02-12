import { io } from "socket.io-client";

const LAPTOP_IP = "192.168.1.103"; // aapka current IPv4 from ipconfig
const SOCKET_URL = `http://${LAPTOP_IP}:5000`;

const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: true,
});

export default socket;
