import { create } from "zustand";

interface WebRtcState {
  pc: RTCPeerConnection | null;
  //   connectWebRtc: any;
  connectWebRtc: () => void;
}

export const useWebRtc = create<WebRtcState>()((set) => ({
  pc: null,
  connectWebRtc: () => {
    const newPc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    set({ pc: newPc });
  }
}));
