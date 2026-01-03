import { useSocket } from "@/hooks/use-socket";
import Portal from "./portal";
import { Phone, PhoneOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useWebRtc } from "@/hooks/use-webrtc";

interface Props {
  visible?: boolean;
  callerName?: string;
  avatar?: string;
  onAccept?: () => void;
  onDecline?: () => void;
}

const RING_URL =
  "https://actions.google.com/sounds/v1/alarms/phone_alerts_and_rings.ogg";

const IncomingCall = ({
  visible = false,
  callerName = "Unknown",
  avatar,
  onAccept,
  onDecline
}: Props) => {
  const [open, setOpen] = useState(visible);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { socket, activeChatId } = useSocket();
  const { pc } = useWebRtc();
  useEffect(() => {
    setOpen(visible);
  }, [visible]);

  useEffect(() => {
    if (!open) return;
    // try play audio
    audioRef.current?.play().catch(() => {});
    return () => {
      audioRef.current?.pause();
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    };
  }, [open]);

  if (!open) return null;

  const handleCreateOffer = async () => {
    if (!pc || !socket) return;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket?.emit("call:webrtc:send_offer", activeChatId);
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60">
        <div className="bg-card rounded-lg p-6 w-full max-w-md flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
            {avatar ? (
              <img
                src={avatar}
                alt={callerName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-white text-2xl">
                {callerName?.[0] || "U"}
              </div>
            )}
          </div>

          <div className="text-lg font-semibold">Incoming call</div>
          <div className="text-sm text-muted-foreground">
            {callerName} is calling you
          </div>

          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => {
                setOpen(false);
                audioRef.current?.pause();
                onDecline?.();
                socket?.emit("call:rejected", activeChatId);
              }}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md shadow"
            >
              <PhoneOff className="w-4 h-4" /> Decline
            </button>

            <button
              onClick={async () => {
                setOpen(false);
                audioRef.current?.pause();
                onAccept?.();
                handleCreateOffer();
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md shadow"
            >
              <Phone className="w-4 h-4" /> Accept
            </button>
          </div>

          <audio ref={audioRef} src={RING_URL} autoPlay loop />
        </div>
      </div>
    </Portal>
  );
};

export default IncomingCall;
