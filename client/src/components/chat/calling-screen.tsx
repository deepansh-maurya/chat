import { PhoneOff } from "lucide-react";
interface Props {
  name: string;
  avatar?: string;
  onEnd: () => void;
}


const CallingScreen = ({ name, avatar, onEnd }: Props) => {

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card rounded-lg p-6 w-full max-w-md flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
          {avatar ? (
            <img src={avatar} alt={name} />
          ) : (
            <div className="text-white">{name?.[0]}</div>
          )}
        </div>

        <div className="text-lg fo  nt-semibold">Calling {name}...</div>
        <div className="text-sm text-muted-foreground">Ringing</div>

        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={onEnd}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md shadow"
          >
            <PhoneOff className="w-4 h-4" /> End
          </button>
        </div>

      </div>
    </div>
  );
};

export default CallingScreen;
