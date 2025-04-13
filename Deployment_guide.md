# Deployment Guide for Response Analyzer

This guide provides step-by-step instructions for deploying the Response Analyzer app to Firebase.

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

## 7. Deploy to Firebase

1. Login to Firebase from the command line:

```bash
firebase login
```

2. Initialize Firebase in your project directory:

```bash
firebase init
```

3. Select the following features:
   - Firestore
   - Hosting
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

10. Your application is now live! Visit the URL displayed in the terminal.

## 8. Setting Up Firestore Security Rules

The deployment includes basic security rules in the `firestore.rules` file, but you may want to customize them further. Review the rules to ensure they match your application's security requirements.

## 9. Monitoring and Analytics

1. In the Firebase Console, navigate to "Analytics" to monitor user activity
2. Use the "Functions" section to monitor API calls if you implement Cloud Functions
3. Check "Hosting" to see deployment history and traffic metrics

## 10. Troubleshooting

If you encounter issues during deployment:

1. Check Firebase deployment logs: `firebase deploy --debug`
2. Verify your environment variables are correctly set
3. Ensure Firebase Authentication is properly configured
4. Check Firestore rules to ensure they're not blocking legitimate requests
5. Verify API keys are valid and have sufficient permissions

## Next Steps

- Configure a custom domain in Firebase Hosting
- Set up Firebase Cloud Functions for server-side operations
- Implement Firebase Remote Config for feature flags
- Add Firebase Performance Monitoring