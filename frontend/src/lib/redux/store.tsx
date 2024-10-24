import { configureStore } from "@reduxjs/toolkit";
import gameSlice from "./slices/gameSlice";
import dragSlice from "./slices/dragSlice";
import switchSlice from "./slices/switchSlice";

export const store = configureStore({
  reducer: {
    game: gameSlice,
    draggingValues: dragSlice,
    switch: switchSlice,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
