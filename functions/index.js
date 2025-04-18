const { onCall } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const axios = require("axios");

// Use v2 functions syntax with onCall and explicitly define environment variables
exports.analyzeResponse = onCall({
  region: "us-central1",
  memory: "256MiB",
  timeoutSeconds: 60,
  // Define secrets directly in the function configuration
  secrets: ["OPENAI_API_KEY"]
}, async (request) => {
  // Log function invocation
  logger.info("analyzeResponse function invoked", {timestamp: new Date().toISOString()});
  
  // Get data from request
  const {data} = request;
  const {requirement, response} = data;
  
  // Check for required fields
  if (!requirement || !response) {
    logger.warn("Invalid arguments provided");
    throw new Error("The function must be called with 'requirement' and 'response' arguments");
  }
  
  try {
    // Access the secret directly from process.env
    const apiKey = process.env.OPENAI_API_KEY;
    
    // Log if the key is available (without logging the key itself)
    logger.info("API key status", { 
      keyAvailable: !!apiKey
    });
    
    if (!apiKey) {
      logger.error("OpenAI API key not found in environment variables");
      throw new Error("OpenAI API key not configured. Please set the OPENAI_API_KEY secret.");
    }
    
    // System prompt for analysis
    const systemPrompt = "You are an expert communication analyst specializing in evaluating how well responses address requirements. Your analysis matches the quality of advanced AI systems. Always provide structured, evidence-based assessments with direct quotes as evidence.";
    
    // User prompt with input data
    const userPrompt = `I need a thorough analysis of this requirement-response pair:
Requirement: "${requirement}"
Response: "${response}"
Follow this exact analytical framework:
1. First, identify all explicit and implicit components of the requirement
2. For each component, assess if the response addresses it fully, partially, or not at all
3. Evaluate tone, clarity, completeness, and relevance
4. Score the response out of 10 based on comprehensive criteria
Format your analysis with these exact sections:
Score: [number]/10
Strengths:
- [List specific strengths with evidence/quotes]
Major gaps:
- [List specific requirements not addressed or poorly addressed with evidence]
Recommendations for improvement:
- [Provide specific, actionable recommendations]
The response as written [provide brief overall assessment focusing on whether the response is ready to send]`;

    logger.info("Calling OpenAI API");
    
    // Call OpenAI API with improved error handling
    const openaiResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {role: "system", content: systemPrompt},
          {role: "user", content: userPrompt}
        ],
        max_tokens: 800,
        temperature: 0.3,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
      }
    );
    
    logger.info("OpenAI API response received");
    
    // Validate that we have a proper response
    if (!openaiResponse.data || !openaiResponse.data.choices || !openaiResponse.data.choices[0]) {
      logger.error("Invalid response from OpenAI API", {response: JSON.stringify(openaiResponse.data)});
      throw new Error("Invalid response received from OpenAI API");
    }
    
    // Return the analysis result
    return {
      analysis: openaiResponse.data.choices[0].message.content,
    };
    
  } catch (error) {
    // Enhanced error logging
    logger.error("Error in analyzeResponse function", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      stack: error.stack
    });
    
    // Return a more descriptive error message based on status code
    if (error.response?.status === 401) {
      throw new Error("Authentication failed with OpenAI API. Please check your API key.");
    } else if (error.response?.status === 429) {
      throw new Error("OpenAI API rate limit exceeded. Please try again later.");
    } else if (error.response) {
      throw new Error(`OpenAI API error (${error.response.status}): ${error.response.data?.error?.message || error.message}`);
    } else {
      throw new Error(`Error analyzing response: ${error.message}`);
    }
  }
});