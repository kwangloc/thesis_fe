# Medical Audio Transcript Analyzer (HealthScribe)

This project is a Next.js application designed to analyze and display medical consultation audio transcripts. It provides a user-friendly interface for clinicians and medical scribes to review audio, read synchronized transcripts, view extracted insights, and manage transcript display preferences.

The application is inspired by services like AWS HealthScribe, aiming to reduce the administrative burden of clinical documentation.

## Key Features

- **Audio Playback**:
  - Play, pause, skip forward/backward functionality.
  - Volume control.
  - Playback speed adjustment (0.5x to 2.0x).
  - Visual waveform display with progress indicator, time markers, and hover interactions.
  - Loading indicators for audio buffering.
- **Synchronized Transcript Display**:
  - Displays transcript segments with speaker identification (Clinician/Patient).
  - Highlights the currently spoken segment in sync with audio playback.
  - Word-level highlighting: shows the exact word being spoken.
  - Medical term highlighting: identifies and flags medical terms in the transcript and during playback.
- **Transcript Controls**:
  - Option to hide/show small talk and silences (future enhancement, currently UI only).
  - Search functionality for keywords within the transcript.
  - **Persistent Scroll Lock**: Users can toggle auto-scrolling. This preference (Auto/Manual scroll) is saved and persists across page reloads using Redux Persist.
  - Button to quickly jump to the current audio position in the transcript.
- **Insights Panel**:
  - Displays a summary of the consultation categorized by sections like "Chief Complaint", "History of Present Illness", "Assessment", and "Plan".
  - Clicking on a summary point highlights the related segment(s) in the transcript and seeks the audio to that point.
- **Data Handling**:
  - Uses mock data for consultation details, transcript segments, and word-level timings.
  - Demonstrates loading word-level timing data from a JSON file (`fever_stomach_word.json`).
  - Audio files are served from the `public/data` directory.
- **State Management**:
  - Utilizes Redux Toolkit and Redux Persist for managing and persisting UI preferences, specifically the transcript panel's auto-scroll state.

## Technologies Used

- **Frontend Framework**: [Next.js](https://nextjs.org/) (v13.5.1)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn/ui](https://ui.shadcn.com/) (implicitly, based on Radix UI usage and `components.json`)
  - Radix UI primitives for accessible components (Dropdown, Slider, ScrollArea, Checkbox, etc.)
- **State Management**:
  - [Redux Toolkit](https://redux-toolkit.js.org/)
  - [React Redux](https://react-redux.js.org/)
  - [Redux Persist](https://github.com/rt2zz/redux-persist) (for localStorage persistence)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Linting**: ESLint
- **Package Manager**: npm

## Project Structure

```
Healthscribe/
├── app/                      # Next.js App Router (pages, layout)
│   ├── page.tsx              # Main application page
│   └── layout.tsx            # Root layout, including Redux and Theme providers
├── components/
│   ├── ui/                   # Shadcn/ui based components (Button, Slider, etc.)
│   ├── audio-controls.tsx    # Controls for filtering transcript (search, hide small talk/silences)
│   ├── audio-player.tsx      # Core audio playback and waveform component
│   ├── insights-panel.tsx    # Displays consultation summary
│   ├── redux-provider.tsx    # Wraps application with Redux Provider & PersistGate
│   ├── theme-provider.tsx    # For Next-Themes
│   └── transcript-panel.tsx  # Displays interactive transcript
├── data/                     # Original data files (not directly served)
│   ├── fever_stomach.mp3
│   ├── fever_stomach_transcript.json # Segment-level transcript
│   └── fever_stomach_word.json       # Word-level transcript
├── docs/                     # Project documentation (e.g., introduction.md)
├── hooks/                    # Custom React hooks (if any)
├── lib/
│   ├── mock-data.ts          # Mock consultation data structure
│   ├── store/                # Redux store configuration
│   │   ├── index.ts          # Store setup with persistReducer
│   │   ├── hooks.ts          # Typed Redux hooks
│   │   └── transcriptSlice.ts# Reducer and actions for transcript preferences
│   └── utils.ts              # Utility functions (e.g., formatTime)
├── public/                   # Static assets served by Next.js
│   └── data/
│       └── fever_stomach.mp3 # Audio file accessible by the application
├── types/                    # TypeScript type definitions
│   └── index.ts
├── .eslintrc.json
├── .gitignore
├── next.config.js            # Next.js configuration (output: 'export')
├── package.json              # Project dependencies and scripts
├── README.md                 # This file
├── tailwind.config.ts
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js (version recommended by Next.js 13, e.g., v18.x or later)
- npm (or yarn/pnpm)

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd Healthscribe
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
    _If you encounter peer dependency issues during installation, you might need to use the `--legacy-peer-deps` flag:_
    ```bash
    npm install --legacy-peer-deps
    ```

### Running the Development Server

1.  Start the development server:
    ```bash
    npm run dev
    ```
2.  Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

### Building for Production

The `next.config.js` is configured for static export (`output: 'export'`).

1.  Build the application:

    ```bash
    npm run build
    ```

    This will generate an `out` folder with the static assets.

2.  (Optional) Start a local server to serve the static build (requires `serve` package or similar):
    ```bash
    npx serve out
    ```

## Data Source

The application currently uses mock data defined in `lib/mock-data.ts`. This data includes:

- Consultation ID and title.
- URL to the audio file (expected to be in `public/data/`).
- Audio duration.
- Speaker information (ID, name, role).
- Transcript segments (ID, speaker ID, text, start/end times, flags for small talk/silence).
- Consultation summary points (ID, category, text, related segment IDs).

Word-level timing data is loaded from `data/fever_stomach_word.json` and passed to the `AudioPlayer` component.

## Key Functionality Walkthrough

1.  **Audio Player**: Interacts with the audio file, manages playback state, and displays current time/duration. The waveform visualizes the audio and allows seeking.
2.  **Transcript Panel**: Renders the transcript segments. It highlights the active segment based on `currentTime` from the audio player. Users can click on segments to seek audio. The auto-scroll behavior is managed by Redux and persists across sessions.
3.  **Insights Panel**: Shows a structured summary. Clicking on an insight seeks the audio and highlights the corresponding transcript segment.
4.  **Audio Controls**: Provides (currently placeholder) UI for filtering transcript content (e.g., hide small talk, search).
5.  **Redux Store for Transcript Preferences**: The `autoScrollEnabled` and `userHasScrolled` states for the transcript panel are managed by Redux and persisted in `localStorage`, so your scroll lock preference is remembered.

## Future Enhancements (Suggestions)

- **Actual Data Integration**: Connect to a backend or a service like AWS HealthScribe to process real audio files and receive transcripts/insights.
- **Dynamic Audio Loading**: Implement the "Change Audio" button functionality to load different consultations.
- **Functional Transcript Filtering**: Make "Hide Small Talk" and "Hide Silences" checkboxes in `AudioControls` fully functional.
- **Advanced Search**: Improve search functionality with highlighting of all matches in the transcript.
- **User Authentication**: Secure the application if sensitive data is handled.
- **API for Medical Term Extraction**: Replace the simple keyword-based medical term detection with a more robust NLP solution or API.
- **Error Handling**: More comprehensive error handling for audio loading, data fetching, etc.
- **Testing**: Implement unit and integration tests.
- **Accessibility (A11y)**: Further review and enhance accessibility based on WCAG guidelines.

This README provides a good overview of your project. Feel free to modify or add sections as your project evolves!
