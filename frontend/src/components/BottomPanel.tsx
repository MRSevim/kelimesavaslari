import { LettersArray } from "../lib/helpers";
import { useAppSelector } from "../lib/redux/hooks";
import { RootState } from "../lib/redux/store";
import { Letter } from "./Letter";
import { socket } from "../lib/socketio";
import { useState } from "react";

export interface DraggingValues {
  active: number | null;
  over: number | null;
}

export const BottomPanel = () => {
  const playerHand: LettersArray =
    useAppSelector((state: RootState) => {
      let id = socket.id;
      const player = state.game?.game?.players.find((player) => {
        return player.socketId === id;
      });
      return player?.hand;
    }) ?? [];

  const [draggingValues, setDraggingValues] = useState<DraggingValues>({
    active: null,
    over: null,
  });

  if (playerHand) {
    return (
      <div className="p-4 bg-slate-500 w-full flex justify-between">
        <div className="flex gap-2">
          <Button classes="bi bi-archive" title="Harf Havuzu" />
          <Button classes="bi bi-arrow-down-up" title="Değiştir" />
          <Button classes="bi bi-arrow-left-right" title="Karıştır" />
        </div>

        <div className="flex gap-2">
          {playerHand.map((letter, i) => {
            return (
              <Letter
                draggingValues={draggingValues}
                setDraggingValues={setDraggingValues}
                letter={letter}
                key={i}
                draggable={true}
                droppable={true}
                i={i}
              />
            );
          })}
        </div>

        <div className="flex gap-2">
          <Button classes="bi bi-arrow-right" title="Geç" />{" "}
          <Button classes="bi bi-arrow-right-square" title="Gönder" />
        </div>
      </div>
    );
  }
};

export const Button = ({
  classes,
  title,
}: {
  classes: string;
  title: string;
}) => {
  return (
    <i
      title={title}
      className={
        "bg-orange-900 rounded-lg w-9 h-9 text-center leading-9 text-white cursor-pointer " +
        classes
      }
    ></i>
  );
};
