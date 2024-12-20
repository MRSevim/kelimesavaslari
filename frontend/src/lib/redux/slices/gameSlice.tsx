import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { Letter, LettersArray, shuffle } from "../../helpers";
import { socket } from "../../socketio";
import { toast } from "react-toastify";

type Board = (Letter | null)[][];

const initialBoard: Board = Array.from({ length: 15 }, () =>
  Array(15).fill(null)
);

export interface Player {
  hand: LettersArray;
  username: string;
  turn: boolean;
  sessionId: string;
  score: number;
  timer: number;
  passCount: number;
  email?: string;
}

export interface Game {
  players: Player[];
  undrawnLetterPool: LettersArray;
  roomId: string;
  passCount: number;
  emptyLetterIds: string[];
}
interface Word {
  word: string;
  meanings: string[];
}

export interface GameState {
  status: string;
  game: Game | null;
  board: Board;
  history: {
    playerSessionId: string;
    words: Word[];
    playerPoints: number;
    type?: string;
  }[];
}
export interface Coordinates {
  row: number;
  col: number;
}

interface MoveData {
  id: number;
  coordinates: Coordinates;
  letter?: Letter;
  class?: string;
}

interface moveAction {
  targetData: MoveData;
  activeData: MoveData;
}

const initialState: GameState = {
  status: "idle",
  game: null,
  board: initialBoard,
  history: [],
};

export const gameSlice = createSlice({
  name: "game",
  initialState: initialState as GameState,
  reducers: {
    setGameStatus: (state, action: PayloadAction<string>) => {
      state.status = action.payload;
    },
    leaveGame: () => {
      localStorage.removeItem("roomId");
      localStorage.removeItem("sessionId");
      window.dispatchEvent(new Event("storage"));
      socket.auth = { ...socket.auth, sessionId: undefined, roomId: undefined };
      socket.sessionId = undefined;
      return initialState;
    },
    setGameState: (_state, action: PayloadAction<GameState>) => {
      return action.payload;
    },
    setTimer: (state, action: PayloadAction<Player[]>) => {
      action.payload.forEach((player) => {
        const _player = state.game?.players.find((Player) => {
          return Player.sessionId === player.sessionId;
        });
        if (_player) {
          _player.timer = player.timer;
        }
      });
    },

    moveLetter: (state, action: PayloadAction<moveAction>) => {
      const player = state.game?.players.find((player) => {
        return player.sessionId === socket.sessionId;
      });

      if (player) {
        const { activeData, targetData } = action.payload;

        if (activeData.coordinates || targetData.coordinates) {
          const playersTurn = checkPlayersTurn(player);
          if (!playersTurn) return;
        }

        if (activeData.coordinates && targetData.coordinates) {
          const letter = activeData.letter;

          state.board[activeData.coordinates.row - 1][
            activeData.coordinates.col - 1
          ] = null;

          state.board[targetData.coordinates.row - 1][
            targetData.coordinates.col - 1
          ] = letter
            ? { ...letter, fixed: false, class: targetData.class }
            : null;
        } else if (!activeData.coordinates && targetData.coordinates) {
          // Remove the letter from the hand
          player.hand.splice(activeData.id, 1);

          const letter = activeData.letter;

          state.board[targetData.coordinates.row - 1][
            targetData.coordinates.col - 1
          ] = letter
            ? { ...letter, fixed: false, class: targetData.class }
            : null;
        } else if (activeData.coordinates && !targetData.coordinates) {
          const letter = activeData.letter;

          state.board[activeData.coordinates.row - 1][
            activeData.coordinates.col - 1
          ] = null;
          if (letter) {
            // Insert it into the target
            player.hand.splice(targetData.id, 0, letter);
          }
        } else if (
          !activeData.coordinates &&
          !targetData.coordinates &&
          targetData.id !== null
        ) {
          if (targetData.id === 7) return;
          // Remove the letter from the hand
          const [movedElem] = player.hand.splice(activeData.id, 1);

          // Insert it into the target
          player.hand.splice(targetData.id, 0, movedElem);
        }
      }
    },
    shuffleHand: (state) => {
      const player = state.game?.players.find((player) => {
        return player.sessionId === socket.sessionId;
      });
      if (player) {
        shuffle(player.hand);
      }
    },
    _switch: (state, action: PayloadAction<number[]>) => {
      const player = state.game?.players.find((player) => {
        return player.sessionId === socket.sessionId;
      });
      const switchedIndices = action.payload;

      if (player) {
        const playersTurn = checkPlayersTurn(player);
        if (!playersTurn) return;

        if (switchedIndices.length > player.hand.length) {
          toast.error(
            "Değişmek istediğiniz harf sayısı elinizdeki harf sayısından fazla"
          );
          return;
        }

        if (
          state.game &&
          switchedIndices.length > state.game.undrawnLetterPool.length
        ) {
          toast.error("Havuzda yeterli harf yok");
          return;
        }
        const letterOnBoard = state.board.some((row) =>
          row.some((cell) => cell && !cell.fixed)
        );
        if (letterOnBoard) {
          toast.error("Tahtada harf varken değişim işlemi yapamazsınız");
          return;
        }
        socket.emit("Switch", { switchedIndices, state });
      }
    },
    pass: (state) => {
      const player = state.game?.players.find((player) => {
        return player.sessionId === socket.sessionId;
      });

      const playersTurn = checkPlayersTurn(player);
      if (!playersTurn) return;

      socket.emit("Pass", {
        state,
      });
    },
    returnEverythingToHand: (state) => {
      const player = state.game?.players.find((player) => {
        return player.sessionId === socket.sessionId;
      });
      if (player) {
        let board = state.board;
        for (let row = 0; row < board.length; row++) {
          for (let col = 0; col < board[row].length; col++) {
            const cell = board[row][col];
            if (cell && !cell.fixed) {
              player.hand.push(cell);
              board[row][col] = null;
            }
          }
        }
      }
    },
    makePlay: (state, action) => {
      const player = state.game?.players.find((player) => {
        return player.sessionId === socket.sessionId;
      });

      const playersTurn = checkPlayersTurn(player);
      if (!playersTurn) return;

      socket.emit("Play", {
        state,
        timerRanOut: action.payload,
      });
    },

    changeEmptyLetter: (
      state,
      action: PayloadAction<{
        newLetter: string;
        target: {
          coordinates?: Coordinates;
          i?: number;
        };
      }>
    ) => {
      const player = state.game?.players.find((player) => {
        return player.sessionId === socket.sessionId;
      });

      const { newLetter } = action.payload;

      if (player) {
        if (action.payload.target.i !== undefined) {
          const { i } = action.payload.target;
          player.hand[i].letter = newLetter;
        } else if (action.payload.target.coordinates) {
          const { coordinates } = action.payload.target;
          const targetCell =
            state.board[coordinates.row - 1]?.[coordinates.col - 1];
          if (targetCell && typeof targetCell !== "number") {
            targetCell.letter = newLetter;
          }
        }
      }
    },
  },
});

const checkPlayersTurn = (player: Player | undefined) => {
  if (player) {
    if (!player.turn) {
      toast.error("Sizin sıranız değil");
      return false;
    } else return true;
  }
};

socket.on("Game Error", ({ error }: { error: string }) => {
  toast.error(error);
});

// Action creators are generated for each case reducer function
export const {
  setGameStatus,
  moveLetter,
  shuffleHand,
  makePlay,
  changeEmptyLetter,
  setGameState,
  _switch,
  pass,
  setTimer,
  returnEverythingToHand,
  leaveGame,
} = gameSlice.actions;

export default gameSlice.reducer;
