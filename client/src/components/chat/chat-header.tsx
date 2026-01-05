import { getOtherUserAndGroup } from "@/lib/helper";
import { PROTECTED_ROUTES } from "@/routes/routes";
import type { ChatType } from "@/types/chat.type";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AvatarWithBadge from "../avatar-with-badge";
import { useSocket } from "@/hooks/use-socket";

interface Props {
  chat: ChatType;
  currentUserId: string | null;
}
type Tab = "chat" | "call";

interface HeaderProps extends Props {
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
  chatId: string | null;
}

const ChatHeader = ({
  chat,
  chatId,
  currentUserId,
  activeTab = "chat",
  onTabChange
}: HeaderProps) => {
  const navigate = useNavigate();
  const { name, subheading, avatar, isOnline, isGroup } = getOtherUserAndGroup(
    chat,
    currentUserId
  );

  const { socket ,setIsCallDeclined} = useSocket();

  return (
    <div
      className="sticky top-0
    flex items-center gap-5 border-b border-border
    bg-card px-2 z-50
    "
    >
      <div className="h-14 px-4 flex items-center">
        <div>
          <ArrowLeft
            className="w-5 h-5 inline-block lg:hidden
          text-muted-foreground cursor-pointer
          mr-2
          "
            onClick={() => navigate(PROTECTED_ROUTES.CHAT)}
          />
        </div>
        <AvatarWithBadge
          name={name}
          src={avatar}
          isGroup={isGroup}
          isOnline={isOnline}
        />
        <div className="ml-2">
          <h5 className="font-semibold">{name}</h5>
          <p
            className={`text-sm ${
              isOnline ? "text-green-500" : "text-muted-foreground"
            }`}
          >
            {subheading}
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => onTabChange?.("chat")}
          className={`flex-1 text-center py-4 h-full border-b-2 font-medium transition-colors
            ${
              activeTab === "chat"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-primary"
            }`}
        >
          Chat
        </button>

        <button
          onClick={() => {

            setIsCallDeclined(undefined)
            onTabChange?.("call");
            socket?.emit("call:request", chatId);
          }}
          className={`flex-1 text-center py-4 h-full border-b-2 font-medium transition-colors
            ${
              activeTab === "call"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-primary"
            }`}
        >
          Call
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
