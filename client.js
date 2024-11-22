import React, { useState, useRef, useEffect } from 'react';
import io from 'socket.io-client';

const VideoRecorder = () => {
  const socket = useRef(io('http://localhost:12345'));
  const videoRef = useRef(null);
  const screenCaptureRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    socket.current.on('connect', () => {
      console.log('Connected to server');
    });

    socket.current.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return () => {
      socket.current.disconnect();
    };
  }, []);

  const handleStartRecording = async () => {
    if (screenCaptureRef.current && videoRef.current) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

        screenCaptureRef.current.srcObject = stream;

        const mediaRecorder = new MediaRecorder(stream);
        const dataArray = [];

        mediaRecorder.ondataavailable = (e) => {
          dataArray.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(dataArray, { type: 'video/webm' });
          socket.current.emit('screenData', blob);
        };

        mediaRecorder.start();
        setIsRecording(true);

        document.getElementById('stopButton').disabled = false;
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    }
  };

  const handleStopRecording = () => {
    if (screenCaptureRef.current && videoRef.current) {
      screenCaptureRef.current.srcObject.getTracks().forEach(track => track.stop());
      mediaRecorder.current.stop();
      setIsRecording(false);
      document.getElementById('stopButton').disabled = true;
    }
  };

  return (
    <div>
      <video ref={videoRef} autoPlay muted />
      <canvas ref={screenCaptureRef} />
      <button onClick={handleStartRecording} disabled={isRecording}>
        Start Recording
      </button>
      <button id="stopButton" onClick={handleStopRecording} disabled={!isRecording}>
        Stop Recording
      </button>
    </div>
  );
};

export default VideoRecorder;
