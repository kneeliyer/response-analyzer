# Deployment Guide for Response Analyzer

This guide provides step-by-step instructions for deploying the Response Analyzer app to Firebase, including Firebase Functions.

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "response-analyzer")
4. Choose whether to enable Google Analytics (recommended)
5. Follow the prompts to complete project creation

## 2. Configure Firebase Authentication

1. In the Firebase Console, select your project
2. Navigate to "Authentication" in the left sidebar
3. Click "Get Started" or "Set up sign-in method"
4. Enable "Google" as a sign-in provider:
   - Click on "Google"
   - Toggle the "Enable" switch
   - Enter a project support email
   - Save

## 3. Create Firestore Database

1. In the Firebase Console, navigate to "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode" 
4. Select a database location closest to your users
5. Click "Enable"

## 4. Register a Web App

1. In the Firebase Console, go to "Project Overview"
2. Click the web icon (</>) to add a web app
3. Register your app with a nickname (e.g., "response-analyzer-web")
4. Check the box for "Also set up Firebase Hosting"
5. Click "Register app"
6. Note down the Firebase configuration values (you'll need these for your .env file)

## 5. Configure Environment Variables

1. Create a file named `.env.local` in your project root
2. Fill in the environment variables using the template from `.env.example`:

```
# API Keys
REACT_APP_CLAUDE_API_KEY=your_claude_api_key_here
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here

# Firebase Config
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
```

## 6. Install Firebase CLI

1. Open your terminal
2. Install the Firebase CLI globally:

```bash
npm install -g firebase-tools
```

## 7. Create and Deploy Firebase Functions

1. Initialize Firebase Functions in your project directory (if not already done):

```bash
firebase init functions
```

2. Select your preferred language (JavaScript or TypeScript)
3. Choose to install dependencies with npm (Yes)
4. This will create a `functions` directory in your project

5. Navigate to the functions directory:

```bash
cd functions
```

6. Install required dependencies for OpenAI and other services:

```bash
npm install axios
```

7. Create your function in `index.js` (for the Response Analyzer):

```javascript
const { onCall } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const axios = require("axios");

// Response analyzer function using OpenAI
exports.analyzeResponse = onCall({
  region: "us-central1",
  memory: "256MiB",
  timeoutSeconds: 60,
  secrets: ["OPENAI_API_KEY"]
}, async (request) => {
  // Function code here
  // ...
});
```

8. Set up your function secrets:

```bash
firebase functions:secrets:set OPENAI_API_KEY
```
When prompted, enter your OpenAI API key

9. Deploy your functions:

```bash
firebase deploy --only functions
```

## 8. Deploy Frontend to Firebase Hosting

1. Return to your project root:

```bash
cd ..
```

2. Initialize Firebase in your project directory (if not already done):

```bash
firebase init
```

3. Select the following features:
   - Firestore
   - Hosting
   - Functions (if not already selected)
   - Storage (if needed)

4. Select your Firebase project

5. Accept the default Firestore rules file (`firestore.rules`)

6. Accept the default Firestore indexes file (`firestore.indexes.json`)

7. For the hosting setup:
   - Specify `build` as your public directory
   - Configure as a single-page app (SPA): Yes
   - Set up automatic builds and deploys with GitHub: No (or Yes if you want CI/CD)

8. Build your React application:

```bash
npm run build
# or
yarn build
```

9. Deploy to Firebase:

```bash
firebase deploy
```

   This single command from your project root will deploy all configured components:
   - Frontend hosting files
   - Firebase Functions 
   - Firestore rules and indexes
   - Storage rules (if configured)

   For selective deployment during development, you can use:
   ```bash
   firebase deploy --only hosting       # Deploy just the frontend
   firebase deploy --only functions     # Deploy all functions
   firebase deploy --only functions:analyzeResponse  # Deploy a specific function
   ```

10. Your application is now live! Visit the URL displayed in the terminal.

## 9. Setting Up Firestore Security Rules

The deployment includes basic security rules in the `firestore.rules` file, but you may want to customize them further. Review the rules to ensure they match your application's security requirements.

## 10. Functions Configuration and Management

### Setting Environment Variables for Functions

For Firebase Functions, you have two options to set environment variables:

1. Using secrets (recommended for sensitive data):
```bash
firebase functions:secrets:set SECRET_NAME
```

2. Using config variables:
```bash
firebase functions:config:set openai.key="your-api-key-here"
```

To access these values in your function:
- Secrets: `process.env.SECRET_NAME`
- Config: Parse `process.env.FIREBASE_CONFIG` or use the functions.config() method

### Managing Functions

- To view logs:
```bash
firebase functions:log
```

- To delete a function:
```bash
firebase functions:delete functionName
```

- To list all functions:
```bash
firebase functions:list
```

### Upgrading Functions

To upgrade to Firebase Functions v2:
1. Update your package.json dependencies
2. Modify your function code to use the v2 syntax:
```javascript
const { onCall } = require("firebase-functions/v2/https");
// Instead of
// const functions = require("firebase-functions");
```

## 11. Monitoring and Analytics

1. In the Firebase Console, navigate to "Analytics" to monitor user activity
2. Use the "Functions" section to monitor API calls, execution times, and error rates
3. Check "Hosting" to see deployment history and traffic metrics
4. Set up Functions monitoring alerts in the Firebase Console

## 12. Understanding Deployment Process

When you run `firebase deploy` from the project root:

1. Firebase CLI reads your `firebase.json` configuration file
2. It identifies all configured services (Functions, Hosting, Firestore, etc.)
3. For Functions:
   - Automatically locates code in the `/functions` directory
   - Installs dependencies if needed
   - Bundles and optimizes your code
   - Uploads and deploys to the Firebase infrastructure
4. For Hosting:
   - Uploads files from your build/public directory
   - Configures CDN and routing rules
5. For Firestore/Storage:
   - Applies security rules and index configurations
6. All services are deployed together in a coordinated way

This project-level deployment ensures consistency across all your Firebase services.

## 13. Troubleshooting

If you encounter issues during deployment:

1. Check Firebase deployment logs: `firebase deploy --debug`
2. View function-specific logs: `firebase functions:log --only functionName`
3. Verify your environment variables and secrets are correctly set
4. Ensure API keys have sufficient permissions and are not expired
5. Check Firebase Authentication is properly configured
6. Verify Firestore rules to ensure they're not blocking legitimate requests
7. For 401 errors with OpenAI API, check that your API key is correctly set as a secret

## Next Steps

- Configure a custom domain in Firebase Hosting
- Set up automatic backups for your Firestore database
- Implement Firebase Remote Config for feature flags
- Add Firebase Performance Monitoring
- Set up Firebase Test Lab for application testing
- Create a CI/CD pipeline using GitHub Actions