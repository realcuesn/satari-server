import { Server } from 'socket.io';

export function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    /* 🌐 Socket.io options */
  });

  io.on('connection', (socket) => {
    // 🤝 Handle socket connections here
  });

  return io;
}
