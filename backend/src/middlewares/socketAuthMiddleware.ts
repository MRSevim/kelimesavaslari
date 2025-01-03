import { NextFunction } from "express";
const { v6: uuidv6 } = require("uuid");

export const useSocketAuthMiddleware = (io: any) => {
  io.use((socket: any, next: NextFunction) => {
    const roomId = socket.handshake.auth.roomId;
    const user = socket.handshake.auth.user;
    if (user) {
      socket.user = user;
    }
    const sessionId = socket.handshake.auth.sessionId;

    if (roomId) {
      socket.roomId = roomId;
      socket.join(roomId);
    }

    if (sessionId) {
      socket.sessionId = sessionId;
      return next();
    }

    socket.sessionId = uuidv6();
    next();
  });
};
