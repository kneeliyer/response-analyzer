import { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, logAnalyticsEvent } from '../firebase/config';
import apiService from '../services/apiService';

const ResponseAnalyzer = () => {
  // User state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [userUsage, setUserUsage] = useState({ used: 0, limit: 100 });
  
  // Analysis state
  const [requirement, setRequirement] = useState('');
  const [response, setResponse] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [score, setScore] = useState(0);
  const [readiness, setReadiness] = useState('');
  const [readinessClass, setReadinessClass] = useState('');

  // Check authentication state on mount
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        setIsLoggedIn(true);
        await getUserUsage(user.uid);
        
        // Log login event
        logAnalyticsEvent('login', {
          method: 'Google'
        });
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Extract score from analysis and set readiness status
  useEffect(() => {
    if (analysis) {
      const scoreMatch = analysis.match(/Score:\s*(\d+)\/10/i);
      if (scoreMatch && scoreMatch[1]) {
        setScore(parseInt(scoreMatch[1], 10));
      }
    }
  }, [analysis]);

  useEffect(() => {
    // Set readiness message and class based on score
    if (score >= 8) {
      setReadiness('Ready to send');
      setReadinessClass('bg-green-100 border-green-500 text-green-800');
    } else if (score >= 6) {
      setReadiness('Needs minor improvements');
      setReadinessClass('bg-yellow-100 border-yellow-500 text-yellow-800');
    } else if (score > 0) {
      setReadiness('Not ready to send - significant changes needed');
      setReadinessClass('bg-red-100 border-red-500 text-red-800');
    } else {
      setReadiness('');
      setReadinessClass('');
    }
  }, [score]);

  // Get user's usage information
  const getUserUsage = async (uid) => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserUsage(userData.usage || { used: 0, limit: 100 });
      } else {
        // Create user document if it doesn't exist
        await setDoc(userDocRef, {
          email: auth.currentUser.email,
          usage: { used: 0, limit: 100 },
          createdAt: serverTimestamp()
        });
        setUserUsage({ used: 0, limit: 100 });
        
        // Log new user event
        logAnalyticsEvent('sign_up', {
          method: 'Google'
        });
      }
    } catch (err) {
      console.error("Error getting user usage:", err);
      setError("Error loading user data. Please try again.");
    }
  };

  // Increment usage counter in Firestore
  const incrementUsage = async () => {
    try {
      const newUsage = { used: userUsage.used + 1, limit: userUsage.limit };
      const userDocRef = doc(db, 'users', user.uid);
      
      await updateDoc(userDocRef, {
        'usage.used': newUsage.used
      });
      
      setUserUsage(newUsage);
      return true;
    } catch (err) {
      console.error("Error incrementing usage:", err);
      return false;
    }
  };

  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError("Error signing in with Google: " + err.message);
      
      // Log login error
      logAnalyticsEvent('login_error', {
        error_message: err.message
      });
    }
  };

  // Handle logout
  const handleLogout = () => {
    auth.signOut();
    
    // Log logout event
    logAnalyticsEvent('logout');
  };

  // Handle analysis request
  const handleAnalyze = async () => {
    if (!requirement.trim() || !response.trim()) {
      setError('Please fill in both the requirement and response fields');
      return;
    }
    
    if (userUsage.used >= userUsage.limit) {
      setError('You have reached your usage limit of 100 requests.');
      
      // Log limit reached
      logAnalyticsEvent('usage_limit_reached', {
        current_usage: userUsage.used,
        limit: userUsage.limit
      });
      
      return;
    }
    
    // Clear existing analysis and set loading state
    setAnalysis('');
    setScore(0);
    setLoading(true);
    setError('');
    
    // Log analysis request start
    logAnalyticsEvent('analysis_started', {
      requirement_length: requirement.length,
      response_length: response.length
    });
    
    try {
      // Call API service
      const result = await apiService.analyzeResponse(requirement, response);
      
      // Update analysis state
      setAnalysis(result);
      
      // Extract score for analytics
      const scoreMatch = result.match(/Score:\s*(\d+)\/10/i);
      const extractedScore = scoreMatch && scoreMatch[1] ? parseInt(scoreMatch[1], 10) : 0;
      
      // Log successful analysis
      logAnalyticsEvent('analysis_completed', {
        score: extractedScore
      });
      
      // Increment usage counter
      await incrementUsage();
      
      // Log analysis in Firestore
      await addDoc(collection(db, 'analyses'), {
        userId: user.uid,
        requirement,
        response,
        analysis: result,
        score: extractedScore,
        timestamp: serverTimestamp()
      });
      
    } catch (err) {
      console.error('Analysis error:', err);
      setError(`Error: ${err.message}`);
      
      // Log analysis error
      logAnalyticsEvent('analysis_error', {
        error_message: err.message
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Function to get score color based on value
  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    if (score > 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // Helper function to extract sections from the analysis
  const extractSection = (sectionName, fallback = []) => {
    if (!analysis) return fallback;
    
    // Create different regex patterns based on section name
    let regex;
    if (sectionName === 'Strengths') {
      regex = new RegExp(`${sectionName}:\\s*\\n(.*?)(?=\\n\\s*(?:Major gaps|Recommendations|The response|$))`, 's');
    } else if (sectionName === 'Major gaps') {
      regex = new RegExp(`${sectionName}:\\s*\\n(.*?)(?=\\n\\s*(?:Recommendations|The response|$))`, 's');
    } else if (sectionName === 'Recommendations') {
      regex = new RegExp(`Recommendations(?:\\s*for\\s*improvement)?:\\s*\\n(.*?)(?=\\n\\s*(?:The response|$))`, 's');
    } else if (sectionName === 'Overall') {
      regex = /(?:The response as written.*?)$/s;
      const match = analysis.match(regex);
      return match ? match[0] : '';
    }
    
    const match = analysis.match(regex);
    if (!match || !match[1]) return fallback;
    
    // Split by line and clean up items
    return match[1].split('\n')
      .map(item => item.trim())
      .filter(item => item && item !== '-' && !item.match(/^\s*$/));
  };
  
  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
            Response Analyzer
          </h2>
          
          <p className="text-center text-gray-600 mb-8">
            Sign in to analyze your responses and track your usage.
          </p>
          
          {error && (
            <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <svg className="h-6 w-6 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
              </g>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }
  
  // Main application
  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-700">Response Analyzer</h1>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm bg-blue-50 p-2 rounded-md border border-blue-200">
            <span className="font-medium">Requests: </span>
            <span className="font-bold">{userUsage.used}</span>
            <span className="text-gray-500"> / </span>
            <span className="font-bold">{userUsage.limit}</span>
          </div>
          
          <button
            onClick={handleLogout}
            className="text-sm py-1 px-3 bg-gray-200 hover:bg-gray-300 rounded-md transition"
          >
            Logout
          </button>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Question/Requirement
          </label>
          <textarea
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            placeholder="Enter the question or requirement here"
            rows={8}
          />
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Your Response
          </label>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            placeholder="Enter your response here"
            rows={8}
          />
        </div>
      </div>
      
      <button
        onClick={handleAnalyze}
        disabled={loading || userUsage.used >= userUsage.limit}
        className="w-full py-3 px-6 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 shadow-md transition duration-300"
      >
        {loading ? 
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyzing...
          </span> : 
          'Analyze Response'
        }
      </button>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {loading && (
        <div className="mt-8 p-10 flex flex-col items-center justify-center bg-white rounded-lg shadow-md">
          <div className="w-16 h-16 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Analyzing your response...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
        </div>
      )}
      
      {!loading && analysis && (
        <div className="mt-8 rounded-lg shadow-md overflow-hidden">
          <div className={`p-4 ${readinessClass} flex justify-between items-center border-b`}>
            <h2 className="text-xl font-bold">Analysis Results</h2>
            <div className="flex items-center">
              <span className="font-bold mr-2">Status:</span>
              <span className="font-semibold">{readiness}</span>
            </div>
          </div>
          
          <div className="p-5 bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Quality Score:</h3>
              <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
                {score}/10
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Strengths:</h3>
              <div className="pl-4 border-l-4 border-green-500 bg-green-50 p-3 rounded-r-md">
                {extractSection('Strengths').map((item, index) => (
                  <div key={index} className="mb-1">{item}</div>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Major Gaps:</h3>
              <div className="pl-4 border-l-4 border-red-500 bg-red-50 p-3 rounded-r-md">
                {extractSection('Major gaps').map((item, index) => (
                  <div key={index} className="mb-1">{item}</div>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Recommendations:</h3>
              <div className="pl-4 border-l-4 border-blue-500 bg-blue-50 p-3 rounded-r-md">
                {extractSection('Recommendations').map((item, index) => (
                  <div key={index} className="mb-1">{item}</div>
                ))}
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gray-100 rounded-md">
              <h3 className="text-lg font-semibold mb-2">Overall Assessment:</h3>
              <p className="text-gray-700">
                {extractSection('Overall')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponseAnalyzer;