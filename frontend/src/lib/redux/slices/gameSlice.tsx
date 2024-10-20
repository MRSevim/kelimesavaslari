import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { Letter, LettersArray, shuffle } from "../../helpers";
import { socket } from "../../socketio";
import { toast } from "react-toastify";
import { validTurkishLetters } from "../../helpers";

type Board = (Letter | null)[][];

const initialBoard: Board = Array.from({ length: 15 }, () =>
  Array(15).fill(null)
);

export interface Player {
  hand: LettersArray;
  username: string;
  turn: boolean;
  socketId: string;
  score: number;
}

export interface Game {
  players: Player[];
  undrawnLetterPool: LettersArray;
  roomId: string;
}
interface Word {
  word: string;
  meanings: string[];
}

export interface GameState {
  findingGame: boolean;
  game: Game | null;
  board: Board;
  history: {
    playerSocketId: string;
    words: Word[];
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
  findingGame: false,
  game: null,
  board: initialBoard,
  history: [],
};

export const gameSlice = createSlice({
  name: "game",
  initialState: initialState as GameState,
  reducers: {
    setFindingGame: (state) => {
      state.findingGame = true;
    },
    setGame: (state, action: PayloadAction<Game>) => {
      state.findingGame = false;
      state.game = action.payload;
    },
    setGameState: (state, action: PayloadAction<GameState>) => {
      return action.payload;
    },
    moveLetter: (state, action: PayloadAction<moveAction>) => {
      const player = state.game?.players.find((player) => {
        return player.socketId === socket.id;
      });

      if (player) {
        const playersTurn = checkPlayersTurn(player);
        if (!playersTurn) return;

        const { activeData, targetData } = action.payload;

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
        return player.socketId === socket.id;
      });
      if (player) {
        shuffle(player.hand);
      }
    },
    makePlay: (state) => {
      const player = state.game?.players.find((player) => {
        return player.socketId === socket.id;
      });

      const playersTurn = checkPlayersTurn(player);
      if (!playersTurn) return;

      if (state.board[7][7] === null) {
        toast.error("Lütfen merkez hücreyi kullanınız");
        return;
      }
      const invalidLetter = state.board.some((row) =>
        row.some(
          (letter) => letter && !validTurkishLetters.includes(letter.letter)
        )
      );
      if (invalidLetter) {
        toast.error("Lütfen boş harfler için geçerli bir Türkçe harf giriniz");
        return;
      }
      socket.emit("Play", {
        state,
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
        return player.socketId === socket.id;
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
  setFindingGame,
  setGame,
  moveLetter,
  shuffleHand,
  makePlay,
  changeEmptyLetter,
  setGameState,
} = gameSlice.actions;

export default gameSlice.reducer;
