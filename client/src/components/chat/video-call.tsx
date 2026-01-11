import { useSocket } from "@/hooks/use-socket";
import { useWebRtc } from "@/hooks/use-webrtc";
import { WebRtcPeer } from "@/hooks/webrtc";
import { PhoneOff } from "lucide-react";
import { useCallback, useEffect, useRef, type RefObject } from "react";

const VideoCall = ({
  locaVideo,
  remoteVideo,
  callerCleanUp,
  stopMedia
}: {
  locaVideo: RefObject<HTMLVideoElement | null>;
  remoteVideo: RefObject<HTMLVideoElement | null>;
  callerCleanUp: () => Promise<void>;
  stopMedia(videoEl: HTMLVideoElement | null): void;
}) => {
  const peer = useRef<WebRtcPeer | undefined>(undefined);
  const { setIscallAccepted, isReciever } = useWebRtc();
  const { socket, activeChatId } = useSocket();

  const calleeCleanUp = useCallback(async () => {
    if (peer.current && socket) {
      peer.current.close();
      locaVideo.current!.srcObject = null;
      remoteVideo.current!.srcObject = null;
      stopMedia(locaVideo.current);
      stopMedia(remoteVideo.current);
      socket.emit("call:end", activeChatId);
      window.location.reload()
    }
  }, [socket, locaVideo, remoteVideo, stopMedia, activeChatId]);

  useEffect(() => {
    if (!socket || isReciever == false) return;
    (async () => {
      peer.current = new WebRtcPeer((candidate) => {
        socket.emit("call:webrtc:send_ice", {
          activeChatId,
          candidate: candidate
        });
      });

      peer.current.setOnRemoteStream((stream) => {
        remoteVideo.current!.srcObject = stream;
      });

      const localStream = await peer.current.initMedia();
      locaVideo.current!.srcObject = localStream;

      socket.on("call:webrtc:recieve_offer", async (offer) => {
        const answer = await peer.current?.handleOffer(offer);
        socket.emit("call:webrtc:send_answer", {
          activeChatId,
          answer
        });
        setIscallAccepted(true);
      });

      socket.on("call:webrtc:recieve_ice", async (candidate) => {
        await peer.current?.handleIce(candidate);
      });
    })();

    socket.on("call:end:accepted", () => {
      calleeCleanUp();
    });
  }, [
    socket,
    locaVideo,
    remoteVideo,
    activeChatId,
    setIscallAccepted,
    isReciever,
    calleeCleanUp,
    stopMedia
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
          onClick={() => {
            if (isReciever) calleeCleanUp();
            else callerCleanUp();
          }}
          className="p-3 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md"
        >
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
