// client/src/pages/LiveRoomPage.jsx
import React, { useEffect, useContext, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Peer from 'peerjs';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const LiveRoomPage = () => {
  const { sessionId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [peers, setPeers] = useState({}); // { peerId: stream }
  const [isMuted, setIsMuted] = useState(true);
  const [isCameraOff, setIsCameraOff] = useState(true);
  const [recognitionSupported, setRecognitionSupported] = useState(false);

  const socketRef = useRef();
  const userVideoRef = useRef();
  const peerRef = useRef(null);
  const recognitionRef = useRef(null);
  const streamsRef = useRef(new Map()); // Track all active streams
  const mediaRecorderRef = useRef(null); // NEW REF for MediaRecorder
  const audioChunksRef = useRef([]); // To store audio data

  useEffect(() => {
    if (!user) return;

    // --- Initialize Dependencies ---
    const socket = io.connect('http://localhost:5001');
    socketRef.current = socket;
    
    const myPeer = new Peer(user.id, {
      host: 'localhost',
      port: 5002,
      path: '/peerjs',
      debug: 3 // Enable verbose logging
    });
    peerRef.current = myPeer;

    // --- Main Logic ---
    let myStream;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        myStream = stream;
        streamsRef.current.set('local', stream); // Store local stream
        userVideoRef.current.srcObject = stream;
        stream.getAudioTracks()[0].enabled = false;
        stream.getVideoTracks()[0].enabled = false;

        // Setup MediaRecorder
        mediaRecorderRef.current = new MediaRecorder(stream);
        const recorder = mediaRecorderRef.current;
        
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const formData = new FormData();
          formData.append('audio', audioBlob);
          formData.append('sessionId', sessionId);
          formData.append('userName', user.name);

          try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5001/api/analysis/transcribe', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
                'x-auth-token': token,
              }
            });
          } catch (error) {
            console.error("Error uploading audio chunk:", error);
          }

          audioChunksRef.current = []; // Clear chunks for the next recording
          
          // If user is still unmuted, start recording again
          if (recorder.state === 'inactive' && !isMuted) {
            recorder.start(5000);
          }
        };

        // Initialize speech recognition if supported
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          recognitionRef.current = new SpeechRecognition();
          const recognition = recognitionRef.current;
          recognition.continuous = true;
          recognition.interimResults = false;
          recognition.lang = 'en-US';
          recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.trim();
            if (transcript) {
              socket.emit('new-transcript-chunk', {
                sessionId,
                userName: user.name,
                text: transcript,
              });
            }
          };
          setRecognitionSupported(true);
        }
      })
      .catch(err => console.error("Media permission error:", err));

    // When our PeerJS connection is ready
    myPeer.on('open', id => {
      console.log('PeerJS connection open with ID:', id);
      socket.emit('join-room-for-video', sessionId, id);
    });

    // Handle incoming calls
    myPeer.on('call', call => {
      console.log('Incoming call from:', call.peer);
      const stream = streamsRef.current.get('local');
      if (stream) {
        call.answer(stream);
        call.on('stream', remoteStream => {
          console.log('Received remote stream from:', call.peer);
          streamsRef.current.set(call.peer, remoteStream);
          setPeers(prev => ({ ...prev, [call.peer]: remoteStream }));
        });
        call.on('close', () => {
          console.log('Call closed with:', call.peer);
          streamsRef.current.delete(call.peer);
          setPeers(prev => {
            const newPeers = { ...prev };
            delete newPeers[call.peer];
            return newPeers;
          });
        });
      }
    });

    // Handle new user connections
    socket.on('user-connected-for-video', otherUserId => {
      console.log('New user connected:', otherUserId);
      // Skip if trying to connect to self
      if (otherUserId === myPeer.id) return;

      setTimeout(() => {
        const stream = streamsRef.current.get('local');
        if (stream) {
          console.log('Calling user:', otherUserId);
          const call = myPeer.call(otherUserId, stream);
          call.on('stream', remoteStream => {
            console.log('Received remote stream from call:', otherUserId);
            streamsRef.current.set(otherUserId, remoteStream);
            setPeers(prev => ({ ...prev, [otherUserId]: remoteStream }));
          });
          call.on('close', () => {
            console.log('Call closed with:', otherUserId);
            streamsRef.current.delete(otherUserId);
            setPeers(prev => {
              const newPeers = { ...prev };
              delete newPeers[otherUserId];
              return newPeers;
            });
          });
        }
      }, 1000);
    });

    // Handle user disconnections
    socket.on('user-disconnected-for-video', userId => {
      console.log('User disconnected:', userId);
      streamsRef.current.delete(userId);
      setPeers(prev => {
        const newPeers = { ...prev };
        delete newPeers[userId];
        return newPeers;
      });
    });

    // Handle errors
    myPeer.on('error', err => {
      console.error('PeerJS error:', err);
    });

    // --- Cleanup ---
    return () => {
      console.log('Cleaning up...');
      socket.disconnect();
      myPeer.destroy();
      streamsRef.current.forEach(stream => {
        stream.getTracks().forEach(track => track.stop());
      });
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [sessionId, user, isMuted]);

  const toggleMute = () => {
    const stream = streamsRef.current.get('local');
    if (!stream) return;

    const audioTrack = stream.getAudioTracks()[0];
    const newMutedState = !audioTrack.enabled;
    audioTrack.enabled = newMutedState;
    setIsMuted(!newMutedState);

    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    
    if (!newMutedState) { // If we are unmuting
      // Start recording and stop every 5 seconds to send a chunk
      recorder.start(5000); // The number is the timeslice in ms
    } else { // If we are muting
      if (recorder.state === 'recording') {
        recorder.stop();
      }
    }

    // Handle speech recognition if available
    if (recognitionRef.current) {
      if (newMutedState) {
        recognitionRef.current.stop();
      } else {
        recognitionRef.current.start()
          .catch(err => console.error('Speech recognition error:', err));
      }
    }
  };

  const toggleCamera = () => {
    const stream = streamsRef.current.get('local');
    if (!stream) return;

    const videoTrack = stream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    setIsCameraOff(!videoTrack.enabled);
  };

  const leaveSession = () => {
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-dark text-brand-text">
      <header className="flex items-center justify-between p-4">
        <h1 className="text-2xl font-bold">Live Session</h1>
        <button 
          onClick={leaveSession} 
          className="px-4 py-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700"
        >
          Leave
        </button>
      </header>

      <main className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
        {/* Local video */}
        <div className="relative bg-brand-mid rounded-lg overflow-hidden">
          <video 
            ref={userVideoRef} 
            muted 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover" 
          />
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded">
            <p>{user?.name} (You)</p>
          </div>
          {isCameraOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="text-5xl font-bold">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
          )}
        </div>
        
        {/* Remote peers */}
        {Object.entries(peers).map(([peerId, stream]) => (
          <div key={peerId} className="relative bg-brand-mid rounded-lg overflow-hidden">
            <video
              playsInline
              autoPlay
              ref={video => { 
                if (video) video.srcObject = stream;
              }}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded">
              <p>Participant</p>
            </div>
          </div>
        ))}
      </main>

      <footer className="flex justify-center items-center p-4 space-x-4">
        <button 
          onClick={toggleMute} 
          className={`p-3 rounded-full ${isMuted ? 'bg-red-600' : 'bg-brand-primary'}`}
          disabled={!recognitionSupported}
          title={!recognitionSupported ? "Speech recognition not supported in your browser" : ""}
        >
          {isMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          )}
        </button>
        <button 
          onClick={toggleCamera} 
          className={`p-3 rounded-full ${isCameraOff ? 'bg-red-600' : 'bg-brand-primary'}`}
        >
          {isCameraOff ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </footer>
    </div>
  );
};

export default LiveRoomPage;