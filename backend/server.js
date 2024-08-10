const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);


io.on('connection', (socket) => {
  console.log('A user connected');

  // Emit events to clients
  socket.emit('event-1', 'Hello from the server!');

  // Handle event received from clients
  socket.on('event2', (data) => {
    console.log('Received event2:', data);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Start the server
const port = 3000;
http.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});