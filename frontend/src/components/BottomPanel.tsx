import { useAppDispatch, useAppSelector } from "../lib/redux/hooks";
import { RootState } from "../lib/redux/store";
import { Letter, LetterSkeleton } from "./Letter";
import {
  _switch,
  makePlay,
  pass,
  returnEverythingToHand,
  shuffleHand,
} from "../lib/redux/slices/gameSlice";
import { toggleSwitching } from "../lib/redux/slices/switchSlice";
import { useDroppable } from "@dnd-kit/core";
import { toggleSidePanel } from "../lib/redux/slices/sidePanelToggleSlice";
import { getPlayer, LettersArray } from "../lib/helpers";

export const BottomPanel = ({
  setLetterPoolOpen,
}: {
  setLetterPoolOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const dispatch = useAppDispatch();

  const gameStatus = useAppSelector((state) => state.game.status);
  const playerHand: LettersArray | null =
    useAppSelector((state: RootState) => {
      const player = getPlayer(state);
      return player?.hand;
    }) ?? null;

  const switching = useAppSelector(
    (state: RootState) => state.switch.switching
  );
  const switchValues = useAppSelector(
    (state: RootState) => state.switch.switchValues
  );

  if (playerHand) {
    const LeftPanel = () => {
      return (
        <div className="flex gap-2">
          <Button
            classes="bi bi-archive"
            title="Harf Havuzu"
            onClick={() => {
              setLetterPoolOpen((prev) => !prev);
            }}
          />
          <Button
            classes={
              "bi bi-arrow-down-up " + (switching ? "animate-bounce" : "")
            }
            title="Harf Havuzu İle Harf Değiştir"
            onClick={() => {
              if (gameStatus !== "ended") {
                dispatch(toggleSwitching(playerHand));
              }
            }}
          />
          <Button
            classes="bi bi-arrow-left-right"
            title="Eldeki Harfleri Karıştır"
            onClick={() => {
              if (gameStatus !== "ended") {
                dispatch(shuffleHand());
              }
            }}
          />
          <Button
            classes="bi bi-arrow-down"
            title="Harfleri Ele Geri Getir"
            onClick={() => {
              if (gameStatus !== "ended") {
                dispatch(returnEverythingToHand());
              }
            }}
          />
        </div>
      );
    };
    const RightPanel = () => {
      return (
        <div className="flex gap-2">
          <Button
            classes="bi bi bi-three-dots-vertical block lg:hidden"
            title="Yan Paneli Aç"
            onClick={() => {
              dispatch(toggleSidePanel());
            }}
          />{" "}
          <Button
            classes="bi bi-arrow-right"
            title="Sıra Geç"
            onClick={() => {
              if (gameStatus !== "ended") {
                dispatch(pass());
              }
            }}
          />{" "}
          <Button
            classes="bi bi-arrow-right-square"
            title="Oyunu Gönder"
            onClick={() => {
              if (gameStatus !== "ended") {
                if (switching) {
                  dispatch(_switch(switchValues));
                  dispatch(toggleSwitching(playerHand));
                  if (playerHand.length !== 7) {
                    dispatch(returnEverythingToHand());
                  }
                } else {
                  dispatch(makePlay(false));
                }
              }
            }}
          />
        </div>
      );
    };

    return (
      <div className="p-4 bg-slate-500 w-full flex flex-col md:flex-row justify-between relative">
        <TimerIndicator />
        <div className="hidden md:block">
          <LeftPanel />
        </div>

        <div className="flex gap-2 self-center">
          {playerHand.map((letter, i) => {
            const draggable = gameStatus !== "ended" && !letter.fixed;
            return (
              <Letter
                letter={letter}
                key={letter.id}
                draggable={draggable}
                droppable={gameStatus !== "ended" && !letter.fixed}
                i={i}
              >
                <LetterSkeleton
                  draggable={draggable}
                  letter={letter}
                  i={i}
                ></LetterSkeleton>
              </Letter>
            );
          })}
          {playerHand.length !== 7 && (
            <LastLetterSpot
              handLength={playerHand.length}
              droppable={gameStatus !== "ended"}
            />
          )}
        </div>
        <div className="block md:hidden flex pt-2 justify-between">
          <LeftPanel />
          <RightPanel />
        </div>
        <div className="hidden md:block">
          <RightPanel />
        </div>
      </div>
    );
  }
};

const Button = ({
  onClick,
  classes,
  title,
}: {
  onClick: React.MouseEventHandler<HTMLDivElement>;
  classes: string;
  title: string;
}) => {
  return (
    <i
      onMouseDown={onClick}
      title={title}
      className={
        "bg-orange-900 rounded-lg w-9 h-9 text-center leading-9 text-white cursor-pointer " +
        classes
      }
    ></i>
  );
};

const LastLetterSpot = ({
  handLength,
  droppable,
}: {
  droppable: boolean;
  handLength: number;
}) => {
  const isSwitching = useAppSelector(
    (state: RootState) => state.switch.switching
  );
  const { isOver, setNodeRef } = useDroppable({
    id: handLength ? handLength + 1 : "last",
    disabled: !droppable || isSwitching,
  });
  return (
    <div
      ref={setNodeRef}
      className={"w-9 h-9 " + (isOver ? "bg-green-400 rounded-lg" : "")}
    ></div>
  );
};

const TimerIndicator = () => {
  const playerTurn: boolean | null =
    useAppSelector((state: RootState) => {
      const player = getPlayer(state);
      return player?.turn;
    }) ?? null;
  const playerTimer: number | null =
    useAppSelector((state: RootState) => {
      const player = getPlayer(state);
      return player?.timer;
    }) ?? null;
  if (playerTimer && playerTurn) {
    return (
      <div
        className={
          "w-4 h-4 rounded-full absolute right-0 top-0  me-0.5 mt-0.5 " +
          (playerTimer > 30
            ? "bg-green-500"
            : playerTimer > 10
            ? "bg-yellow-500"
            : "bg-red-500")
        }
      ></div>
    );
  }
};
