import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

const userSocketMap = {}; // { userId: socketId }

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    socket.userId = userId;
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // 🔴 Handle incoming message and forward to receiver
  socket.on("sendMessage", ({ receiverId, message }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", message);
    }
  });

  // 🟢 Handle message read acknowledgment
  socket.on("messageRead", ({ senderId }) => {
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesRead", { senderId: socket.userId });
    }
  });

  // 🔌 Clean up on disconnect
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    delete userSocketMap[socket.userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
