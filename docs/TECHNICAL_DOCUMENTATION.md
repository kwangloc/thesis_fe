# Technical Documentation: Medical Audio Transcript Analyzer

This document provides a detailed technical overview of the Medical Audio Transcript Analyzer (HealthScribe) project. It covers the architecture, data flow, component interactions, state management, and key functionalities.

## 1. Introduction

The project is a Next.js web application designed for analyzing medical consultation audio. It features synchronized audio playback with transcript highlighting (both segment and word-level), medical term identification, categorized insights, and persistent UI preferences.

## 2. Technical Architecture

- **Framework**: Next.js 13.5.1 utilizing the App Router.
- **Rendering Strategy**: Primarily client-side rendering, with components marked with `"use client"`.
- **Deployment Output**: Configured for static export (`output: 'export'` in `next.config.js`), making it suitable for deployment on static hosting platforms.
- **Language**: TypeScript for type safety and improved developer experience.
- **Styling**: Tailwind CSS for utility-first styling, combined with Shadcn/ui (implicitly, through Radix UI primitives and project structure) for UI components.
- **State Management**: Redux Toolkit with Redux Persist for global state and localStorage persistence, primarily for UI preferences.
- **Component-Based Design**: The UI is broken down into reusable React components.

## 3. Core Components Deep Dive

### 3.1. `app/page.tsx` (Main Page)

- **Role**: Orchestrator of the main application view.
- **State Management (Local)**:
  - `currentTime`: Number, tracks the current playback time of the audio. Updated by `AudioPlayer` and used by `TranscriptPanel`.
  - `highlightedSegmentId`: String, ID of the transcript segment to be highlighted (e.g., when clicking an insight). Used by `TranscriptPanel`.
  - `activePointId`: String, ID of the currently active insight. Used by `InsightsPanel`.
  - `searchQuery`: String, for future transcript search functionality.
- **Data Handling**:
  - Imports `mockAudioData` from `lib/mock-data.ts`.
  - Imports raw `wordTimingsData` from `@/data/fever_stomach_word.json` and maps it to the format expected by `AudioPlayer`.
- **Interactions**:
  - Passes `currentTime` and relevant callbacks (`onTimeUpdate`, `onSeek`) to `AudioPlayer`.
  - Passes transcript data, `currentTime`, and callbacks (`onSegmentClick`) to `TranscriptPanel`.
  - Passes summary data and callbacks (`onSummaryPointClick`) to `InsightsPanel`.
  - `handleSegmentClick`: Sets `currentTime` when a transcript segment is clicked.
  - `handleSummaryPointClick`: Sets `highlightedSegmentId`, `activePointId`, and `currentTime` when an insight is clicked.

### 3.2. `components/audio-player.tsx`

- **Role**: Manages audio playback, displays controls, waveform, and current word.
- **Core Element**: Uses the HTML5 `<audio>` element, controlled via a `useRef` (`audioRef`).
- **Local State**:
  - `isPlaying`: Boolean, tracks play/pause state.
  - `currentTime`: Number, local copy of audio current time (syncs with parent via `onTimeUpdate`).
  - `volume`: Number (0-1), controls audio volume.
  - `playbackRate`: Number (0.5-2.0), controls audio playback speed.
  - `isLoading`: Boolean, indicates if the audio is buffering/loading.
- **Audio Event Handling** (`useEffect` hook):
  - `timeupdate`: Updates `currentTime` state and calls `onTimeUpdate` prop.
  - `ended`: Sets `isPlaying` to `false`.
  - `loadstart`, `waiting`: Sets `isLoading` to `true`.
  - `canplay`, `playing`: Sets `isLoading` to `false`.
- **Key Functions**:
  - `togglePlayPause()`: Plays or pauses the audio.
  - `handleSeek(newTime: number[])`: Sets `audioRef.current.currentTime`.
  - `skipBackward()`, `skipForward()`: Skips audio by 10 seconds.
  - `getCurrentWord()`: Finds the word in `wordTimings` that corresponds to `currentTime`.
  - `getMedicalTerms()`: Filters `wordTimings` based on a predefined list of `medicalKeywords`. (Note: This is a simplistic approach for demonstration).
- **Props**: `audioUrl`, `title`, `duration`, `onTimeUpdate` (callback), `onPlay` (callback), `onPause` (callback), `onSeek` (callback), `wordTimings`.
- **UI Elements**: Play/Pause, Skip, Volume Slider, Playback Speed Dropdown (Shadcn/ui), Waveform, Current Word Display.
- **Current Word Display**: Shows the `currentWord.word`. If `isMedicalTerm` is true (based on `getMedicalTerms`), a "Medical Term" badge is shown. The container has a `min-h-[1.25rem]` and a transparent placeholder to prevent layout shifts.

### 3.3. `components/ui/waveform.tsx`

- **Role**: Visualizes the audio waveform and allows seeking by clicking.
- **Rendering**: Uses HTML5 Canvas API for drawing.
- **Local State**: `hoveredPosition` (for visual feedback on hover).
- **Props**: `className`, `progress` (0-1), `audioData` (currently generates mock data if not provided), `duration` (for time markers).
- **Drawing Logic** (`useEffect` hook, depends on `waveformData`, `progress`, `hoveredPosition`, `duration`):
  - Generates mock waveform data if `audioData` is not supplied (currently 200 bars with some randomization to simulate speech).
  - Clears and redraws canvas on prop changes.
  - Draws bars: `isPlayed` bars have a primary color, `isHovered` bars have a slightly different primary color, others are gray.
  - Draws a progress indicator line (red) at `rect.width * progress`.
  - Draws time markers with labels (e.g., "0:10", "0:20") if `duration` is provided.
- **Interaction**: `onClick` on the canvas calculates the percentage clicked and calls `handleSeek` (passed down from `AudioPlayer`). `onMouseMove` and `onMouseLeave` update `hoveredPosition`.

### 3.4. `components/transcript-panel.tsx`

- **Role**: Displays the interactive transcript, synchronizes with audio, and manages scroll behavior.
- **Redux State Integration**:
  - `autoScrollEnabled`: Boolean, from `state.transcript`.
  - `userHasScrolled`: Boolean, from `state.transcript`.
  - Uses `useAppDispatch` to dispatch actions: `setUserHasScrolled`, `setAutoScrollEnabled`, `toggleAutoScroll`.
- **Local State**: `activeSegmentId`: String, ID of the segment matching `currentTime`.
- **Refs**:
  - `segmentRefs`: `Record<string, HTMLDivElement | null>`, stores references to each transcript segment `div` for scrolling.
  - `scrollAreaRef`: `HTMLDivElement | null`, reference to the `ScrollArea` component for attaching scroll event listeners.
  - `lastScrollTime`, `autoScrollInProgress`: `useRef`s to manage and debounce scroll events, preventing conflicts between user and programmatic scrolling.
- **Key `useEffect` Hooks**:
  1.  **User Scroll Detection**: Attaches a `scroll` event listener to the `ScrollArea`'s viewport. If a scroll occurs not initiated by `autoScrollInProgress` and `autoScrollEnabled` is true, it dispatches actions to set `userHasScrolled(true)` and `autoScrollEnabled(false)`.
  2.  **Active Segment Tracking & Auto-Scrolling**: When `currentTime`, `autoScrollEnabled`, or `userHasScrolled` changes:
      - Finds `currentSegment` based on `currentTime`.
      - Sets `activeSegmentId`.
      - If `autoScrollEnabled` is true and `userHasScrolled` is false, it scrolls the `currentSegment` into view (`block: 'center'`). Uses `autoScrollInProgress` and `lastScrollTime` to flag this as a programmatic scroll.
  3.  **Highlighted Segment Scrolling**: When `highlightedSegmentId` (from `InsightsPanel` click) changes, it always scrolls that segment into view.
- **Key Functions**:
  - `handleToggleAutoScroll()`: Dispatches `toggleAutoScroll()`. If auto-scroll is being re-enabled, it also scrolls the current segment into view.
  - `handleGoToCurrentSegment()`: Scrolls the segment corresponding to the current audio time into view.
- **UI**: Renders `filteredTranscript`. Each segment is clickable (`onSegmentClick`). `activeSegmentId` and `highlightedSegmentId` receive distinct styling.

### 3.5. `components/insights-panel.tsx`

- **Role**: Displays categorized consultation summary points.
- **Props**: `summary` (array of `SummaryPoint`), `onSummaryPointClick` (callback), `activePointId`.
- **Logic**: Groups `summary` points by their `category`. Renders each category as a section with its points.
- **Interaction**: When a summary point is clicked, it calls `onSummaryPointClick(point)`, which is handled by `app/page.tsx` to update `currentTime`, `highlightedSegmentId`, and `activePointId`.
- **UI**: Uses Shadcn/ui `Tabs` (though only one tab "Summarizations" is currently implemented) and `ScrollArea`.

### 3.6. `components/audio-controls.tsx` (Partial Implementation)

- **Role**: Intended for controls like filtering transcript (hide small talk/silences) and search.
- **Props**: `onSearch` (callback for search input changes).
- **Current State**: UI for checkboxes (Hide Small Talk, Hide Silences) and speaker selection dropdown are present but not fully functional in terms of filtering the transcript data (this logic would typically reside in `TranscriptPanel` or be lifted to `app/page.tsx`). Search input calls `onSearch`.

## 4. Data Flow and Management

1.  **Initial Data Load** (`app/page.tsx`):
    - `wordTimingsData` (word-level transcript) is imported from `@/data/fever_stomach_word.json`.
    - Audio file URL points to `/data/fever_stomach.mp3`, which Next.js serves from `public/data/fever_stomach.mp3`.
    - `mockAudioData` (consultation metadata, segment transcript, summary) is imported directly from `lib/mock-data.ts`.
2.  **Audio Playback and Time Updates**:
    - `AudioPlayer` plays the audio from `audioUrl`.
    - On `timeupdate`, `AudioPlayer` updates its internal `currentTime` and calls `onTimeUpdate(audio.currentTime)`.
    - `app/page.tsx` receives this via `setCurrentTime`, updating its `currentTime` state.
3.  **Transcript Synchronization**:
    - `app/page.tsx` passes its `currentTime` state to `TranscriptPanel`.
    - `TranscriptPanel`'s `useEffect` hook listens for `currentTime` changes to identify and highlight the `activeSegmentId`.
    - `AudioPlayer` also uses its internal `currentTime` and `wordTimings` prop to display the `currentWord`.
4.  **User Interactions -> State Changes -> UI Updates**:
    - **Clicking Waveform/Slider in `AudioPlayer`**: Calls `handleSeek`, which updates `audioRef.current.currentTime`. The `timeupdate` event then propagates the change.
    - **Clicking Transcript Segment in `TranscriptPanel`**: Calls `onSegmentClick(segment)`, which `app/page.tsx` handles by calling `setCurrentTime(segment.startTime)`. This, in turn, causes `AudioPlayer` to seek (as its `audio.currentTime` is updated if `currentTime` prop changes, though direct seeking via `audioRef` is more robust and seems to be the pattern when `onSeek` is called).
    - **Clicking Insight in `InsightsPanel`**: Calls `onSummaryPointClick(point)`. `app/page.tsx` updates `currentTime`, `highlightedSegmentId`, and `activePointId`. These prop changes trigger updates in `AudioPlayer` (seek) and `TranscriptPanel` (scroll and highlight).
    - **Transcript Scroll Controls**: Interactions with "Auto"/"Manual" or "Current" buttons in `TranscriptPanel` dispatch Redux actions, updating the persisted state and local component behavior.

## 5. State Management with Redux and Redux Persist

- **Purpose**: To manage and persist UI preferences, specifically the auto-scroll behavior of the `TranscriptPanel`.
- **Store Configuration** (`lib/store/index.ts`):
  - Uses `configureStore` from Redux Toolkit.
  - `persistReducer` wraps the `rootReducer` (which combines all slices).
  - `storage`: Configured to use `redux-persist/lib/storage` (which defaults to `localStorage`).
  - `persistConfig`: `key: "healthscribe"`, `whitelist: ["transcript"]` ensures only the `transcript` slice is saved to `localStorage`.
  - Middleware: Includes `serializableCheck` with `ignoredActions` for Redux Persist's internal actions (`persist/PERSIST`, `persist/REHYDRATE`).
  - `persistor`: Created using `persistStore(store)` for use with `PersistGate`.
- **`transcriptSlice.ts`** (`lib/store/transcriptSlice.ts`):
  - **State Shape**: `{ autoScrollEnabled: boolean, userHasScrolled: boolean }`.
  - **Initial State**: `{ autoScrollEnabled: true, userHasScrolled: false }`.
  - **Reducers (Actions)**:
    - `setAutoScrollEnabled(state, action: PayloadAction<boolean>)`
    - `setUserHasScrolled(state, action: PayloadAction<boolean>)`
    - `toggleAutoScroll(state)`: Toggles `autoScrollEnabled`. If it becomes true, `userHasScrolled` is reset to `false`.
    - `resetScrollState(state)`: Resets both to initial values (not actively used but available).
- **Typed Hooks** (`lib/store/hooks.ts`):
  - `useAppDispatch = () => useDispatch<AppDispatch>()`
  - `useAppSelector: TypedUseSelectorHook<RootState> = useSelector`
  - These provide type safety when interacting with the store.
- **Redux Provider** (`components/redux-provider.tsx`):
  - A client component (`"use client"`) that wraps its children with `<Provider store={store}>` and `<PersistGate loading={<div>Loading...</div>} persistor={persistor}>`.
  - `PersistGate` delays rendering of the UI until the persisted state has been retrieved and rehydrated.
- **Usage in `TranscriptPanel`**:
  - `autoScrollEnabled` and `userHasScrolled` are selected from the store using `useAppSelector`.
  - Actions are dispatched using `useAppDispatch` in response to user interactions (manual scrolling, toggle button clicks).

## 6. Key Functionalities - Technical Details

### 6.1. Audio Synchronization & Seeking

- The primary driver is the HTML5 audio element's `currentTime` property and its `timeupdate` event.
- Seeking is achieved by directly setting `audioRef.current.currentTime`.
- The `app/page.tsx` `currentTime` state acts as a shared source of truth for components that need to react to time changes but don't directly control the audio element.

### 6.2. Persistent Scroll Lock (Auto-Scroll Logic)

- The `TranscriptPanel` combines local `useRef`s (`autoScrollInProgress`, `lastScrollTime`) with Redux state (`autoScrollEnabled`, `userHasScrolled`).
- **User Scroll**: A `scroll` event listener on the `ScrollArea`'s viewport. If the scroll is not programmatic (checked via `autoScrollInProgress` and a small time buffer `lastScrollTime.current < 100`), it dispatches actions to update Redux state, effectively disabling auto-scroll.
- **Programmatic Scroll**: When auto-scroll is active or an insight/segment is clicked, `scrollIntoView({ behavior: 'smooth', block: 'center' })` is used. `autoScrollInProgress` is set to `true` before the scroll and `false` in a `setTimeout` after the typical scroll duration to differentiate it from user scrolls.
- **State Restoration**: On page load, `PersistGate` rehydrates the `transcript` slice from `localStorage`, restoring the user's last scroll preference.

### 6.3. Medical Term Detection

- Located in `AudioPlayer`'s `getMedicalTerms()` function.
- Currently, it iterates through `wordTimings` and checks if `word.word.toLowerCase()` includes any term from a hardcoded `medicalKeywords` array.
- This is a basic implementation and would need a more sophisticated NLP approach for production accuracy.

## 7. Build Process and Static Export

- `next.config.js` contains `output: 'export'`. This tells Next.js to generate a fully static site during `npm run build`.
- The output is placed in the `out/` directory.
- This allows the site to be hosted on any static web server or CDN without needing a Node.js runtime environment for serving.

## 8. Styling

- Tailwind CSS is used for utility-first styling, configured in `tailwind.config.ts`.
- `globals.css` contains base Tailwind directives and any global styles.
- Components from `components/ui/` (likely based on Shadcn/ui) provide pre-styled, accessible building blocks (e.g., `Button`, `Slider`, `ScrollArea`, `DropdownMenu`).
- Lucide React provides icons.

## 9. Known Limitations & Future Technical Considerations

- **Data Source Scalability**: The current mock data and direct JSON import approach is not scalable for many consultations. A backend API would be necessary.
- **Performance with Large Transcripts**: Rendering and managing very long transcripts with many word-level timings might lead to performance issues. Virtualization techniques for the transcript display could be explored.
- **Medical Term Detection Accuracy**: The current keyword-based detection is very basic and prone to false positives/negatives. Integration with a dedicated medical NLP service or library is recommended for real-world use.
- **State Management for Audio Controls**: The `AudioControls` component's filtering options (hide small talk/silences) are not yet tied to application state or transcript filtering logic. This would likely involve lifting more state to `app/page.tsx` or managing it within Redux if persistence is desired.
- **Error Handling**: Robust error handling for audio loading failures, data fetching issues (if a backend is added), etc., needs to be more comprehensively implemented.
- **Code Splitting and Lazy Loading**: While Next.js handles much of this automatically, for a larger application, manual review of bundle sizes and lazy loading for non-critical components or libraries might be beneficial.

This document provides a detailed technical foundation for the HealthScribe project. It should be updated as the project evolves.
