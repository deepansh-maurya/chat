import ChatBody from "@/components/chat/chat-body";
import ChatFooter from "@/components/chat/chat-footer";
import ChatHeader from "@/components/chat/chat-header";
import VideoCall from "@/components/chat/video-call";
import CallingScreen from "@/components/chat/calling-screen";
import Portal from "@/components/ui/portal";
import EmptyState from "@/components/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import useChatId from "@/hooks/use-chat-id";
import { useSocket } from "@/hooks/use-socket";
import { getOtherUserAndGroup } from "@/lib/helper";
import type { MessageType } from "@/types/chat.type";
import { useEffect, useRef, useState } from "react";
import { useWebRtc } from "@/hooks/use-webrtc";
import { WebRtcPeer } from "@/hooks/webrtc";

const SingleChat = () => {
  const chatId = useChatId();

  const { fetchSingleChat, isSingleChatLoading, singleChat } = useChat();
  const { socket, isCallDeclined, setActiveChatId, activeChatId } = useSocket();
  const { user } = useAuth();
  const {
    connectWebRtc,
    isCallAccepted,
    setIsCaller,
    activeTab: tab,
    setIscallAccepted
  } = useWebRtc();
  const [replyTo, setReplyTo] = useState<MessageType | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "call">("chat");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isCalling, setIsCalling] = useState(false);

  const currentUserId = user?._id || null;
  const chat = singleChat?.chat;
  const messages = singleChat?.messages || [];
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (chatId) setActiveChatId(chatId);
  }, [chatId, setActiveChatId]);

  useEffect(() => {
    if (tab) setActiveTab(tab as "call");
  }, [tab]);

  useEffect(() => {
    if (isCallDeclined == true || isCallAccepted == true) setIsCalling(false);
  }, [isCallDeclined, isCallAccepted]);

  useEffect(() => {
    if (!chatId) return;
    fetchSingleChat(chatId);
  }, [fetchSingleChat, chatId, setActiveChatId]);

  useEffect(() => {
    if (!chatId || !socket) return;

    socket.emit("chat:join", chatId);

    socket.on("request_accepted", async () => {
      alert();
      setIscallAccepted(true);

      if (!chatId || !socket) return;
      setActiveChatId(chatId);
      const peer = new WebRtcPeer((candidate) => {
        socket.emit("call:webrtc:send_ice", {
          activeChatId,
          candidate: candidate
        });
      });

      peer.setOnRemoteStream((stream) => {
        remoteVideoRef.current!.srcObject = stream;
      });

      const localStream = await peer.initMedia();
      localVideoRef.current!.srcObject = localStream;

      const offer = await peer.createOffer();
      socket.emit("call:webrtc:send_offer", {
        activeChatId,
        offer
      });

      socket.on("call:webrtc:recieve_answer", async (answer) => {
        await peer.handleAnswer(answer);
      });

      socket.on("call:webrtc:recieve_ice", async (candidate) => {
        await peer.handleIce(candidate);
      });
    });

    return () => {
      socket.emit("chat:leave", chatId);
    };
  }, [
    chatId,
    socket,
    activeChatId,
    connectWebRtc,
    setActiveChatId,
    setIscallAccepted
  ]);

  if (isSingleChatLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner className="w-11 h-11 !text-primary" />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-lg">Chat not found</p>
      </div>
    );
  }

  const other = getOtherUserAndGroup(chat, currentUserId);

  return (
    <div className="relative h-svh flex flex-col">
      <ChatHeader
        chat={chat}
        chatId={chatId}
        currentUserId={currentUserId}
        activeTab={activeTab}
        onTabChange={(t) => {
          if (t === "call") {
            setConfirmOpen(true);
            return;
          }
          setActiveTab(t);
        }}
      />

      <div className="flex-1 overflow-y-auto bg-background">
        {activeTab === "chat" ? (
          messages.length === 0 ? (
            <EmptyState
              title="Start a conversation"
              description="No messages yet. Send the first message"
            />
          ) : (
            <ChatBody
              chatId={chatId}
              messages={messages}
              onReply={setReplyTo}
            />
          )
        ) : (
          <VideoCall locaVideo={localVideoRef} remoteVideo={remoteVideoRef} />
        )}
      </div>

      {activeTab === "chat" && (
        <ChatFooter
          replyTo={replyTo}
          chatId={chatId}
          currentUserId={currentUserId}
          onCancelReply={() => setReplyTo(null)}
        />
      )}

      {confirmOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-card rounded-lg p-6 w-full max-w-sm flex flex-col items-center gap-4">
              <div className="text-lg font-semibold">Call {other.name}?</div>
              <div className="text-sm text-muted-foreground">
                {other.isOnline
                  ? `Do you want to start a call with ${other.name}?`
                  : `${other.name} is offline — cannot call right now.`}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="px-4 py-2 rounded-md border border-border bg-card"
                >
                  Quit
                </button>

                <button
                  onClick={() => {
                    if (!other.isOnline) return;
                    setConfirmOpen(false);
                    setIsCalling(true);
                    setActiveTab("call");
                    setIsCaller(true);
                  }}
                  disabled={!other.isOnline}
                  className={`px-4 py-2 rounded-md text-white ${
                    other.isOnline
                      ? "bg-primary"
                      : "bg-muted-foreground/10 text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  Call
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {isCalling && (
        <Portal>
          <CallingScreen
            name={other.name}
            avatar={other.avatar}
            onEnd={() => {
              setIsCalling(false);
              setActiveTab("chat");
            }}
          />
        </Portal>
      )}
    </div>
  );
};

export default SingleChat;
