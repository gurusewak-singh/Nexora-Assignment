// client/src/components/PeerAudio.jsx
import React, { useEffect, useRef } from 'react';

const PeerAudio = ({ peer }) => {
  const audioRef = useRef();

  useEffect(() => {
    peer.on('stream', stream => {
      audioRef.current.srcObject = stream;
    });
  }, [peer]);

  return (
    <audio playsInline autoPlay ref={audioRef} />
  );
};

export default PeerAudio;