const { Server } = require('socket.io');

const io = new Server(8001, {
  cors: true,
});

const userToSocketMap = new Map();
const socketToUserMap = new Map();

io.on('connection', (socket) => {
  console.log("Socket connected", socket.id);

  socket.on('room:join', (data) => {
    const { roomId, userId } = data;
    console.log(userId, 'joined room', roomId);
    userToSocketMap.set(userId, socket.id);
    socketToUserMap.set(socket.id, userId);
    io.to(roomId).emit('user:joined', { userId, id: socket.id });
    socket.join(roomId);
    io.to(socket.id).emit('room:join', data);
  });

  socket.on('user:call', (data) => {
    const { to, offer } = data;
    console.log(socketToUserMap.get(socket.id), 'called', socketToUserMap.get(to));
    io.to(to).emit("incoming:call", {
			from: socket.id,
			offer,
			sender: socketToUserMap.get(socket.id),
		});
  });

  socket.on('call:accepted', (data) => {
    const { to, ans } = data;
    io.to(to).emit('call:accepted', { from: socket.id, ans });
  });

  socket.on('peer:nego:needed', (data) => {
    const { to, offer } = data;
    io.to(to).emit('peer:nego:needed', { from: socket.id, offer });
  });

  socket.on('peer:nego:done', (data) => {
    const { to, ans } = data;
    io.to(to).emit('peer:nego:final', { from: socket.id, ans });
  });

  socket.on("leave", () => {
    const userId = socketToUserMap.get(socket.id);
    console.log(userId, 'left->', "room:", socket.id);
    userToSocketMap.delete(userId);
    socketToUserMap.delete(socket.id);
    io.to(socket.id).emit('room:leave', { from: socket.id });
  });
});

io.on('disconnect', () => {
  console.log('user disconnected');
});