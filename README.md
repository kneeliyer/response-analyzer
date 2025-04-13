# Response Analyzer

A web application to analyze responses against requirements using AI. The app provides feedback on the quality of responses and offers suggestions for improvement.

## Features

- Google Sign-In authentication
- AI-powered response analysis
- Support for both Claude and OpenAI models
- Usage tracking (limit of 100 requests per user)
- Detailed feedback with scoring system
- Visual indicators for response quality

## Setup Instructions

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Firebase account
- Claude API key (and optionally OpenAI API key)

### Environment Setup

1. Clone this repository
2. Copy `.env.example` to `.env.local` and fill in your API keys and Firebase configuration
3. Install dependencies:

```bash
npm install
# or
yarn install
```

### Firebase Setup

1. Create a new Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Google Authentication in the Firebase console:
   - Go to Authentication > Sign-in method
   - Enable Google provider
3. Enable Firestore database:
   - Create a Firestore database in the Firebase console
   - Start in production mode

### Deployment

1. Install Firebase CLI:

```bash
npm install -g firebase-tools
```

2. Login to Firebase:

```bash
firebase login
```

3. Initialize Firebase:

```bash
firebase init
```

4. Build the project:

```bash
npm run build
# or
yarn build
```

5. Deploy to Firebase:

```bash
firebase deploy
```

## Usage

1. Sign in with your Google account
2. Enter a question/requirement and your response
3. Click "Analyze Response" to get AI feedback
4. View the detailed analysis with strengths, gaps, and recommendations

## Technology Stack

- React.js
- Firebase (Authentication, Firestore)
- TailwindCSS
- Claude API / OpenAI API

## License

This project is licensed under the MIT License - see the LICENSE file for details.