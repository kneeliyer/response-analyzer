// API service for handling calls to OpenAI API

class ApiService {
  constructor() {
    this.openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY;
  }

  async analyzeResponse(requirement, response) {
    const prompt = `
      I need to analyze a response to a specific requirement/question.
      
      Here is the requirement/question:
      "${requirement}"
      
      Here is the response provided:
      "${response}"
      
      Can you analyze and tell me whether this response is good or bad? 
      Did it answer all of the questions/concerns and points that were raised?
      Please provide a detailed assessment and suggestions for improvement if needed.
      
      Format your response using the following structure:
      
      Score: X/10
      
      Strengths:
      - Strength 1
      - Strength 2
      - ...
      
      Major gaps:
      - Gap 1
      - Gap 2
      - ...
      
      Recommendations for improvement:
      - Recommendation 1
      - Recommendation 2
      - ...
      
      The response as written... [overall assessment]
    `;

    return this.callOpenAiApi(prompt);
  }

  async callOpenAiApi(prompt) {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not found. Please check your environment variables.');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert at analyzing responses to requirements. You provide detailed analysis and score responses out of 10. Always follow the format specified by the user, with sections for Score, Strengths, Major gaps, Recommendations for improvement, and an overall assessment.'
            },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'OpenAI API request failed');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }
}

export default new ApiService();