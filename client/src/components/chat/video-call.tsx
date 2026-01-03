import { useSocket } from "@/hooks/use-socket";
import { useWebRtc } from "@/hooks/use-webrtc";
// import { getOtherUserAndGroup } from "@/lib/helper";
// import type { ChatType } from "@/types/chat.type";
import { Mic, Video, PhoneOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// interface Props {
//   chat: ChatType;
//   currentUserId: string | null;
// }

const VideoCall = () => {
//   const { name, avatar, isOnline } = getOtherUserAndGroup(chat, currentUserId);
  const [muted, setMuted] = useState(false);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const { pc } = useWebRtc();
  const { socket, activeChatId } = useSocket();
  const [cameraOn, setCameraOn] = useState(true);

  useEffect(() => {
    if (!pc || !socket || !remoteVideoRef.current || !localVideoRef.current)
      return;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        remoteVideoRef.current!.srcObject = stream;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("call:webrtc:send_ice", {
          activeChatId,
          candidate: event.candidate
        });
      }
    };

    socket.on("call:webrtc:recive_offer", async (offer) => {
      await pc.setRemoteDescription(offer);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("call:webrtc:send_answer", { activeChatId, answer });
    });

    socket.on("call:webrtc:recieve_answer", async (answer) => {
      await pc.setRemoteDescription(answer);
    });

    socket.on("call:webrtc:recieve_ice", async (candidate) => {
      await pc.addIceCandidate(candidate);
    });
  }, [pc]);

  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-4xl h-[60vh] bg-black rounded-md overflow-hidden flex items-center justify-center">
        {/* Remote video placeholder */}
        <video
          ref={remoteVideoRef}
          id="remote"
          className="w-full h-full object-cover bg-black"
          autoPlay
          playsInline
        />

        {/* Local small preview */}
        <div className="absolute right-4 bottom-4 w-36 h-24 bg-gray-900/70 rounded-md overflow-hidden flex items-center justify-center border border-border">
          <video
            ref={localVideoRef}
            id="local"
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
        </div>
      </div>

      <div className="mt-4 w-full max-w-4xl flex items-center justify-center gap-4">
        <button
          onClick={() => setMuted((s) => !s)}
          className={`p-3 rounded-full bg-card border border-border hover:bg-muted-foreground/5 flex items-center justify-center`}
          aria-pressed={muted}
        >
          <Mic className="w-5 h-5" />
        </button>

        <button
          onClick={() => setCameraOn((s) => !s)}
          className={`p-3 rounded-full bg-card border border-border hover:bg-muted-foreground/5 flex items-center justify-center`}
          aria-pressed={!cameraOn}
        >
          <Video className="w-5 h-5" />
        </button>

        <button className="p-3 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-3 text-sm text-muted-foreground">
        P2P one-to-one video design (UI only)
      </div>
    </div>
  );
};

export default VideoCall;
