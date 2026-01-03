import { useEffect } from "react";
import { useAuth } from "./hooks/use-auth";
import AppRoutes from "./routes";
import { Spinner } from "./components/ui/spinner";
import Logo from "./components/logo";
import { useLocation } from "react-router-dom";
import { isAuthRoute } from "./routes/routes";
import IncomingCall from "./components/ui/incoming-call";
import { useSocket } from "./hooks/use-socket";

function App() {
  const { pathname } = useLocation();
  const { user, isAuthStatus, isAuthStatusLoading } = useAuth();
  const isAuth = isAuthRoute(pathname);
  const { socket, setIsRecivingCall, isRecievingCall, setIsCallDeclined } =
    useSocket();
  useEffect(() => {
    if (!socket || !socket.connected) return;
    console.log("now");

    const handler = ({ chatId, from }: { chatId: string; from: string }) => {
      console.log("Incoming call from", from, chatId);
      setIsRecivingCall(true);
    };

    const declined = ({ chatId, from }: { chatId: string; from: string }) => {
      setIsCallDeclined(true);
      console.log("declined call from", from, chatId);
    };

    socket?.on("call:declined", declined);
    socket?.on("call:incoming", handler);
    return () => {
      socket?.off("call:incoming", handler);
      socket?.off("call:declined", declined);   
    };
  }, [socket, setIsRecivingCall, socket?.connected, setIsCallDeclined]);

  useEffect(() => {
    if (isAuth) return;
    isAuthStatus();
  }, [isAuthStatus, isAuth]);

  if (isAuthStatusLoading && !user) {
    return (
      <div
        className="flex flex-col items-center
       justify-center h-screen
      "
      >
        <Logo imgClass="size-20" showText={false} />
        <Spinner className="w-6 h-6" />
      </div>
    );
  }

  return (
    <>
      <AppRoutes />
      <IncomingCall visible={isRecievingCall} />
    </>
  );
}

export default App;
