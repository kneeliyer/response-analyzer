import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebase/config';

class ApiService {
  constructor() {
    this.functions = getFunctions();
    this.analyzeResponseFunction = httpsCallable(this.functions, 'analyzeResponse');
  }
  
  async analyzeResponse(requirement, response) {
    try {
      // Verify user is logged in
      if (!auth.currentUser) {
        throw new Error('You must be logged in to use this feature');
      }
      
      // Call the cloud function
      const result = await this.analyzeResponseFunction({ requirement, response });
      return result.data.analysis;
    } catch (error) {
      console.error('Analysis error:', error);
      throw new Error(error.message || 'Failed to analyze response');
    }
  }
}

export default new ApiService();