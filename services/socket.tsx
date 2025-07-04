import { io } from "socket.io-client";

//ovaina adresse IPv4 le http://XXX.XXX.XXX.XX:3000
const socket = io("http://XXX.XXX.XXX.XX:3000", {
  transports: ["websocket"]
});

export default socket;
