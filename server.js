const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 12345;

app.use(express.static(path.join(__dirname, 'public')));

let clients = new Map();

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('screenData', (data) => {
    const clientID = socket.id;
    clients.set(clientID, data);

    io.emit('screenData', data);
  });

  socket.on('stopRecording', () => {
    console.log(`Client ${socket.id} stopped recording`);
    clients.delete(socket.id);
    io.emit('stopRecording', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    clients.delete(socket.id);
  });
});

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Функция для сохранения видео
const saveVideo = async (data, filename) => {
  const videoBlob = new Blob(data, { type: 'video/webm' });
  const url = URL.createObjectURL(videoBlob);

  await fs.writeFile(filename, videoBlob);
  URL.revokeObjectURL(url);
};

// Обработка завершения записи
io.on('stopRecording', () => {
  Object.values(clients).forEach((data) => {
    const chunks = [];
    data.on('data', event => {
      chunks.push(event.data);
    });

    data.on('stop', async () => {
      await saveVideo(chunks, `recording_${Date.now()}.webm`);
      console.log('Recording saved successfully');
    });
  });
});
