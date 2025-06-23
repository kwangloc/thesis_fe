import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface TranscriptState {
  autoScrollEnabled: boolean;
  userHasScrolled: boolean;
}

const initialState: TranscriptState = {
  autoScrollEnabled: true,
  userHasScrolled: false,
};

const transcriptSlice = createSlice({
  name: "transcript",
  initialState,
  reducers: {
    setAutoScrollEnabled: (state, action: PayloadAction<boolean>) => {
      state.autoScrollEnabled = action.payload;
    },
    setUserHasScrolled: (state, action: PayloadAction<boolean>) => {
      state.userHasScrolled = action.payload;
    },
    toggleAutoScroll: (state) => {
      state.autoScrollEnabled = !state.autoScrollEnabled;
      if (state.autoScrollEnabled) {
        state.userHasScrolled = false;
      }
    },
    resetScrollState: (state) => {
      state.userHasScrolled = false;
      state.autoScrollEnabled = true;
    },
  },
});

export const {
  setAutoScrollEnabled,
  setUserHasScrolled,
  toggleAutoScroll,
  resetScrollState,
} = transcriptSlice.actions;

export default transcriptSlice.reducer;
