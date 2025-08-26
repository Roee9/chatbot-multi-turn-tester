# Chatbot Security Scanner - Web Interface

A modern React-based web interface for the Chatbot Multi-turn Security Tester. This application provides a user-friendly interface to configure, start, and monitor security scans for AI chatbots.

## Features

- **ScanForm**: Configure and start new security scans with customizable parameters
- **ProgressCard**: Real-time progress tracking with status updates and completion percentage
- **ResultsTable**: Comprehensive results display with severity-based findings
- **TranscriptDialog**: Detailed conversation transcripts for each security finding
- **Modern UI**: Built with Tailwind CSS and shadcn/ui components
- **Real-time Updates**: Automatic polling for scan status updates
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **TanStack Query** for data fetching
- **React Router** for navigation
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- The API server running on `http://localhost:3000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. **Start a Scan**: Fill out the scan form with your chatbot URL and desired test suite
2. **Monitor Progress**: Watch real-time progress updates as the scan runs
3. **Review Results**: View detailed findings with severity levels and descriptions
4. **View Transcripts**: Click on findings to see the conversation that triggered them

## API Configuration

The application expects the API server to be running on `http://localhost:3000`. You can modify the API base URL in `src/lib/api.ts` if needed.

## Available Test Suites

- **Persuasion Tests**: Tests for emotional manipulation and persuasion techniques
- **Jailbreak Tests**: Tests for attempts to bypass AI safety restrictions  
- **Data Leak Tests**: Tests for attempts to extract sensitive information

## Project Structure

```
src/
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── ScanForm.tsx  # Scan configuration form
│   ├── ProgressCard.tsx # Progress tracking
│   ├── ResultsTable.tsx # Results display
│   └── TranscriptDialog.tsx # Transcript viewer
├── lib/
│   ├── api.ts        # API client functions
│   └── utils.ts      # Utility functions
├── App.tsx           # Main application component
└── main.tsx          # Application entry point
```

## Development

### Adding New Components

1. Create your component in the `src/components/` directory
2. Import and use shadcn/ui components from `src/components/ui/`
3. Use Tailwind CSS classes for styling

### API Integration

The API client is located in `src/lib/api.ts`. It provides functions for:
- Starting scans (`startScan`)
- Polling status (`pollScanStatus`) 
- Fetching results (`getScanResults`)

### Styling

The application uses Tailwind CSS with a custom design system. The color scheme and design tokens are defined in `src/index.css` and `tailwind.config.js`.

## Contributing

1. Follow the existing code style and patterns
2. Use TypeScript for all new code
3. Test your changes thoroughly
4. Update documentation as needed

## License

This project is part of the Chatbot Multi-turn Security Tester.
