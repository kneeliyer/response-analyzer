// API service for handling calls to AI providers

class ApiService {
    constructor() {
      this.claudeApiKey = process.env.REACT_APP_CLAUDE_API_KEY;
      this.openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY;
      this.currentProvider = localStorage.getItem('aiProvider') || 'claude';
    }
  
    setProvider(provider) {
      if (provider !== 'claude' && provider !== 'openai') {
        throw new Error('Invalid provider. Choose "claude" or "openai"');
      }
      
      this.currentProvider = provider;
      localStorage.setItem('aiProvider', provider);
    }
  
    getProvider() {
      return this.currentProvider;
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
        Give the response a score out of 10 and explain your reasoning.
      `;
  
      if (this.currentProvider === 'claude') {
        return this.callClaudeApi(prompt);
      } else {
        return this.callOpenAiApi(prompt);
      }
    }
  
    async callClaudeApi(prompt) {
      if (!this.claudeApiKey) {
        throw new Error('Claude API key not found. Please check your environment variables.');
      }
  
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.claudeApiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-opus-20240229',
            max_tokens: 1024,
            messages: [
              { role: 'user', content: prompt }
            ]
          })
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Claude API request failed');
        }
  
        const data = await response.json();
        return data.content[0].text;
      } catch (error) {
        console.error('Error calling Claude API:', error);
        throw error;
      }
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
              { role: 'system', content: 'You are an expert at analyzing responses to requirements. You provide detailed analysis and score responses out of 10.' },
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