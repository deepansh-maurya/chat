import { useSocket } from "@/hooks/use-socket";
import { useWebRtc } from "@/hooks/use-webrtc";
import { WebRtcPeer } from "@/hooks/webrtc";
import { Mic, Video, PhoneOff } from "lucide-react";
import { useEffect, useState, type RefObject } from "react";

// interface Props {
//   chat: ChatType;
//   currentUserId: string | null;
// }

const VideoCall = ({
  locaVideo,
  remoteVideo
}: {
  locaVideo: RefObject<HTMLVideoElement | null>;
  remoteVideo: RefObject<HTMLVideoElement | null>;
}) => {
  //   const { name, avatar, isOnline } = getOtherUserAndGroup(chat, currentUserId);
  const [muted, setMuted] = useState(false);
  const { pc, setIscallAccepted, isReciever } = useWebRtc();
  const [cameraOn, setCameraOn] = useState(true);
  const { socket, activeChatId } = useSocket();

  useEffect(() => {
    if (!socket || isReciever == false) return;
    (async () => {
      const peer = new WebRtcPeer((candidate) => {
        socket.emit("call:webrtc:send_ice", {
          activeChatId,
          candidate: candidate
        });
      });

      peer.setOnRemoteStream((stream) => {
        remoteVideo.current!.srcObject = stream;
      });

      const localStream = await peer.initMedia();
      locaVideo.current!.srcObject = localStream;

      socket.on("call:webrtc:recieve_offer", async (offer) => {
        const answer = await peer.handleOffer(offer);
        socket.emit("call:webrtc:send_answer", {
          activeChatId,
          answer
        });
        setIscallAccepted(true);
      });

      socket.on("call:webrtc:recieve_ice", async (candidate) => {
        await peer.handleIce(candidate);
      });
    })();
  }, [
    pc,
    socket,
    locaVideo,
    remoteVideo,
    activeChatId,
    setIscallAccepted,
    isReciever
  ]);

  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-4xl h-[60vh] bg-black rounded-md overflow-hidden flex items-center justify-center">
        {/* Remote video placeholder */}
        <video
          ref={remoteVideo}
          id="remote"
          className="w-full h-full object-cover bg-black"
          autoPlay
          playsInline
        />

        {/* Local small preview */}
        <div className="absolute right-4 bottom-4 w-36 h-24 bg-gray-900/70 rounded-md overflow-hidden flex items-center justify-center border border-border">
          <video
            ref={locaVideo}
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
