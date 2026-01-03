import { io, Socket } from "socket.io-client";
import { create } from "zustand";

const BASE_URL = import.meta.env.VITE_API_URL;

interface SocketState {
  socket: Socket | null;
  onlineUsers: string[];
  connectSocket: () => void;
  disconnectSocket: () => void;
  isRecievingCall: boolean;
  activeChatId: string;
  setActiveChatId: (val: string) => void;
  isCallDeclined: boolean | undefined;
  setIsRecivingCall: (value: boolean) => void;
  setIsCallDeclined: (value: boolean|undefined) => void;
}

export const useSocket = create<SocketState>()((set, get) => ({
  socket: null,
  onlineUsers: [],
  isRecievingCall: false,
  isCallDeclined: undefined,
  activeChatId: "",
  setActiveChatId: (val: string) => {
    set((state) => ({
      ...state,
      activeChatId: val
    }));
  },
  connectSocket: () => {
    const { socket } = get();
    console.log(socket, "socket");
    if (socket?.connected) return;

    const newSocket = io(BASE_URL, {
      withCredentials: true,
      autoConnect: true
    });

    set({ socket: newSocket });

    newSocket.on("connect", () => {
      console.log("Socket connected", newSocket.id);
    });

    newSocket.on("online:users", (userIds) => {
      console.log("Online users", userIds);
      set({ onlineUsers: userIds });
    });
  },

  setIsCallDeclined: (value: boolean | undefined) => {
    set((state) => ({
      ...state,
      isCallDeclined: value
    }));
  },
  setIsRecivingCall: (value) => {
    set((state) => ({
      ...state,
      isRecievingCall: value
    }));
  },
  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  }
}));
