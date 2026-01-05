import { useSocket } from "@/hooks/use-socket";
import Portal from "./portal";
import { Phone, PhoneOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useWebRtc } from "@/hooks/use-webrtc";

interface Props {
  visible?: boolean;
  callerName?: string;
  avatar?: string;
  onAccept?: () => void;
  onDecline?: () => void;
}

const IncomingCall = ({
  visible = false,
  callerName = "Unknown",
  avatar,
  onAccept,
  onDecline
}: Props) => {
  const [open, setOpen] = useState(visible);
  const { socket, activeChatId } = useSocket();
  const { setActiveTab, setIsReciever } = useWebRtc();
  useEffect(() => {
    setOpen(visible);
  }, [visible]);

  if (!open) return null;

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
                onAccept?.();
                // connectWebRtc();

                console.log("call accepted", activeChatId);

                socket?.emit("call-accepted", activeChatId);
                setActiveTab("call");
                setIsReciever(true);
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md shadow"
            >
              <Phone className="w-4 h-4" /> Accept
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default IncomingCall;
