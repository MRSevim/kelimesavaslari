import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { Letter } from "../../helpers";

export interface DraggingValues {
  active: number | null;
  over: number | null;
  activeLetter: Letter | null;
}

const initialState: DraggingValues = {
  active: null,
  over: null,
  activeLetter: null,
};
export const dragSlice = createSlice({
  name: "dragValues",
  initialState: initialState,
  reducers: {
    setDraggingValues: (
      state,
      action: PayloadAction<Partial<DraggingValues>>
    ) => {
      return { ...state, ...action.payload };
    },
  },
});

// Action creators are generated for each case reducer function
export const { setDraggingValues } = dragSlice.actions;

export default dragSlice.reducer;
