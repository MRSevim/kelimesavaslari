import { useAppDispatch, useAppSelector } from "../lib/redux/hooks";
import { RootState } from "../lib/redux/store";
import { makePlay, pass, Player } from "../lib/redux/slices/gameSlice";
import { socket } from "../lib/socketio";
import { GameHistory } from "./GameHistory";
import { useEffect, useState } from "react";
import { toggleSwitching } from "../lib/redux/slices/switchSlice";
import { toast } from "react-toastify";

export const SidePanel = () => {
  const game = useAppSelector((state: RootState) => state.game.game);

  return (
    <div className="w-1/3 bg-slate-400">
      {game && (
        <>
          <div className="flex align-center justify-around my-8">
            <PlayerContainer player={game?.players[0]} />
            <PlayerContainer player={game?.players[1]} />
          </div>
          <GameHistory />
        </>
      )}
    </div>
  );
};

const PlayerContainer = ({ player }: { player: Player | undefined }) => {
  const playerTurn = player?.turn;
  const timer = player?.timer;
  const dispatch = useAppDispatch();
  const [ran, setRan] = useState<boolean>(false);
  const switching = useAppSelector(
    (state: RootState) => state.switch.switching
  );

  useEffect(() => {
    if (!playerTurn) setRan(false);

    if (playerTurn && timer === 0 && player?.socketId === socket.id && !ran) {
      if (switching) {
        dispatch(pass());
        toast.error("Zamanında değişmediğiniz için sıranız pas geçildi");
        dispatch(toggleSwitching());
      } else dispatch(makePlay(true));
      setRan(true);
    }
  }, [playerTurn, timer, dispatch, ran]);

  return (
    <div
      className={
        "flex flex-col bg-white text-center border-solid border-2 rounded p-7 " +
        (player?.socketId === socket.id ? "border-amber-500" : "")
      }
    >
      <p>{player?.username}</p>
      <p>Derece:xx</p>
      Puan: {player?.score}
      {player && (
        <div className="mt-2 w-20">
          <p
            className={
              "text-lg font-semibold " +
              (player.timer > 30
                ? "text-green-500"
                : player.timer > 10
                ? "text-yellow-500"
                : "text-red-500")
            }
          >
            {player.timer} saniye
          </p>
        </div>
      )}
    </div>
  );
};
