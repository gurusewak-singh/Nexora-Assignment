// client/src/components/PeerVideo.jsx
import React, { useEffect, useRef } from 'react';

const PeerVideo = ({ peer }) => {
  const ref = useRef();

  useEffect(() => {
    peer.on('stream', stream => {
      ref.current.srcObject = stream;
    });
  }, [peer]);

  return (
    <video
      playsInline
      autoPlay
      ref={ref}
      className="w-full h-full object-cover rounded-lg"
    />
  );
};

export default PeerVideo;