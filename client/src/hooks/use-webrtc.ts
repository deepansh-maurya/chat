import { create } from "zustand";

interface WebRtcState {
  pc: RTCPeerConnection | null;
  connectWebRtc: (socket: any, chatId: any) => void;
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
  isCallAccepted: boolean;
  isCaller: boolean;
  setIsCaller: (val: boolean) => void;
  setIsReciever: (val: boolean) => void;
  isReciever: boolean;
  setIscallAccepted: (val: boolean) => void;
  activeTab: string;
  setActiveTab: (val: string) => void;
}

export const useWebRtc = create<WebRtcState>()((set) => ({
  pc: null,
  isCallAccepted: false,
  remoteStream: null,
  isReciever: false,

  activeTab: "",
  setActiveTab: (val: string) => {
    set((state) => ({
      ...state,
      activeTab: val
    }));
  },
  localStream: null,
  isCaller: false,
  setIsCaller: (val: boolean) => {
    set((state) => ({
      ...state,
      isCaller: val
    }));
  },

  setIsReciever: (val: boolean) => {
    set((state) => ({
      ...state,
      isReciever: val
    }));
  },

  setIscallAccepted: (val: boolean) => {
    set((state) => ({
      ...state,
      isCallAccepted: val
    }));
  },
  connectWebRtc: (socket: any, chatId: any) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:global.stun.twilio.com:3478"
          ]
        }
      ]
    });
    console.log(pc, "created webrtc insance");
    set({ pc: pc });

    pc.onicecandidate = (event) => {
      console.log(event);
      if (event.candidate) {
        socket.emit("call:webrtc:send_ice", {
          activeChatId: chatId,
          candidate: event.candidate
        });

        console.log(event.candidate, "got candidate and send");
      }
    };

    // pc.ontrack = (event) => {
    //   // set({ remoteStream: event.streams[0] });
    //   console.log("getting remote video audio");
    // };
  }
}));
