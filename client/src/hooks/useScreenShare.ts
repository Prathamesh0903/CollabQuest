import { useCallback, useEffect, useRef, useState } from 'react';

export interface RemoteScreenStream {
  userId: string;
  displayName?: string;
  stream: MediaStream;
}

interface UseScreenShareOptions {
  socket: any | null;
  roomId?: string;
}

export const useScreenShare = ({ socket, roomId }: UseScreenShareOptions) => {
  const [isSharing, setIsSharing] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, RemoteScreenStream>>(new Map());
  const [activeSharers, setActiveSharers] = useState<string[]>([]);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  const stopLocalStreamTracks = (stream: MediaStream | null) => {
    if (!stream) return;
    stream.getTracks().forEach((t) => t.stop());
  };

  // Create RTCPeerConnection with basic STUN servers
  const createPeerConnection = useCallback((targetUserId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket && roomId) {
        socket.emit('screenshare-ice-candidate', {
          roomId,
          targetUserId: targetUserId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.set(event.transceiver?.mid || targetUserId, {
          userId: targetUserId,
          stream
        });
        return next;
      });
    };

    peerConnectionsRef.current.set(targetUserId, pc);
    return pc;
  }, [roomId, socket]);

  const startScreenShare = useCallback(async () => {
    if (!socket || !roomId || isSharing) return;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 15, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      setLocalStream(stream);
      setIsSharing(true);
      socket.emit('screenshare-start', { roomId });

      // Create a peer connection per viewer on demand (offer broadcast); viewers answer back
      const pc = createPeerConnection('room-broadcast');
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      const offer = await pc.createOffer({ offerToReceiveVideo: false, offerToReceiveAudio: false });
      await pc.setLocalDescription(offer);
      socket.emit('screenshare-offer', { roomId, sdp: offer });

      // Stop if user manually ends capture via browser UI
      const [videoTrack] = stream.getVideoTracks();
      if (videoTrack) {
        videoTrack.onended = () => stopScreenShare();
      }
    } catch (err) {
      console.error('Failed to start screen share:', err);
    }
  }, [createPeerConnection, isSharing, roomId, socket]);

  const stopScreenShare = useCallback(() => {
    if (!socket || !roomId) return;
    setIsSharing(false);
    socket.emit('screenshare-stop', { roomId });
    stopLocalStreamTracks(localStream);
    setLocalStream(null);
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
  }, [localStream, roomId, socket]);

  // Socket signaling handlers
  useEffect(() => {
    if (!socket || !roomId) return;

    const handleSharers = (data: any) => {
      if (data?.roomId !== roomId) return;
      setActiveSharers(data.sharers || []);
    };

    const handleOffer = async (data: any) => {
      if (data?.roomId !== roomId) return;
      const fromUserId: string = data.fromUserId || 'unknown-sharer';
      const pc = createPeerConnection(fromUserId);
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('screenshare-answer', { roomId, targetUserId: fromUserId, sdp: answer });
    };

    const handleAnswer = async (data: any) => {
      if (data?.roomId !== roomId) return;
      // Initial implementation uses broadcast offer; ignore answers without a specific PC
      const targetUserId: string = data.fromUserId;
      const pc = peerConnectionsRef.current.get('room-broadcast') || peerConnectionsRef.current.get(targetUserId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      }
    };

    const handleIce = async (data: any) => {
      if (data?.roomId !== roomId) return;
      const fromUserId: string = data.fromUserId;
      const pc = peerConnectionsRef.current.get('room-broadcast') || peerConnectionsRef.current.get(fromUserId);
      if (pc && data.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error('Failed to add ICE candidate', e);
        }
      }
    };

    const handleStarted = (data: any) => {
      if (data?.roomId !== roomId) return;
      setActiveSharers((prev) => Array.from(new Set([...(prev || []), data.userId])));
    };

    const handleStopped = (data: any) => {
      if (data?.roomId !== roomId) return;
      setActiveSharers((prev) => (prev || []).filter((id) => id !== data.userId));
      // Clean remote stream for that user
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        Array.from(next.keys()).forEach((key) => {
          const item = next.get(key);
          if (item?.userId === data.userId) next.delete(key);
        });
        return next;
      });
    };

    socket.on('screenshare-sharers', handleSharers);
    socket.on('screenshare-offer', handleOffer);
    socket.on('screenshare-answer', handleAnswer);
    socket.on('screenshare-ice-candidate', handleIce);
    socket.on('screenshare-started', handleStarted);
    socket.on('screenshare-stopped', handleStopped);

    return () => {
      socket.off('screenshare-sharers', handleSharers);
      socket.off('screenshare-offer', handleOffer);
      socket.off('screenshare-answer', handleAnswer);
      socket.off('screenshare-ice-candidate', handleIce);
      socket.off('screenshare-started', handleStarted);
      socket.off('screenshare-stopped', handleStopped);
    };
  }, [createPeerConnection, roomId, socket]);

  return {
    isSharing,
    localStream,
    remoteStreams,
    activeSharers,
    startScreenShare,
    stopScreenShare
  };
};


