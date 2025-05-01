// filepath: /Users/bkmobil/Projects/extensions/prompt_keeper_chrome_extension/common/openai.js

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o'; // Or specify another model like 'gpt-3.5-turbo'

/**
 * Generates a system prompt using the OpenAI API.
 * @param {string} apiKey - The user's OpenAI API key.
 * @param {string[]} tags - Array of tags to base the prompt on.
 * @param {string} [notes] - Optional additional notes or context.
 * @returns {Promise<string>} - The generated prompt content.
 * @throws {Error} - If the API call fails or returns an error.
 */
async function generatePrompt(apiKey, tags, notes = '') {
    if (!apiKey) {
        throw new Error("API Key is required to generate prompts.");
    }
    if (!tags || tags.length === 0) {
        throw new Error("At least one tag is required for generation.");
    }

    const systemMessageContent = `You are an expert assistant specialized in creating concise and effective system prompts for large language models (LLMs). Generate a system prompt based on the provided tags and notes. The prompt should clearly define the role, context, and desired output format or behavior for an LLM. Be specific and actionable.`;

    let userMessageContent = `Generate a system prompt for an LLM based on the following requirements:\n\nTags: ${tags.join(', ')}`;
    if (notes && notes.trim()) {
        userMessageContent += `\n\nAdditional Notes: ${notes.trim()}`;
    }
     userMessageContent += `\n\nOutput only the system prompt itself, without any introductory text, explanation, or markdown formatting.`;


    try {
        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: "system", content: systemMessageContent },
                    { role: "user", content: userMessageContent }
                ],
                temperature: 0.7, // Adjust creativity vs. determinism
                // max_tokens: 250, // Limit response length if needed
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("OpenAI API Error:", errorData);
            throw new Error(`API request failed with status ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();

        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            return data.choices[0].message.content.trim();
        } else {
            console.error("Invalid response structure from OpenAI:", data);
            throw new Error("Failed to parse generated prompt from API response.");
        }

    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        // Re-throw specific errors or a generic one
        if (error instanceof Error && error.message.includes('API key')) {
             throw new Error("Invalid OpenAI API Key provided.");
        }
        throw new Error(`Failed to generate prompt: ${error.message}`);
    }
}


/**
 * Optimizes an existing system prompt using the OpenAI API.
 * @param {string} apiKey - The user's OpenAI API key.
 * @param {string} existingPrompt - The prompt content to be optimized.
 * @returns {Promise<string>} - The optimized prompt content.
 * @throws {Error} - If the API call fails or returns an error.
 */
async function optimizePrompt(apiKey, existingPrompt) {
     if (!apiKey) {
        throw new Error("API Key is required to optimize prompts.");
    }
    if (!existingPrompt || !existingPrompt.trim()) {
        throw new Error("Existing prompt content is required for optimization.");
    }

    const systemMessageContent = `You are an expert assistant specialized in refining and optimizing system prompts for large language models (LLMs). Analyze the provided system prompt and improve its clarity, conciseness, effectiveness, and actionability. Focus on making the LLM's role, context, constraints, and desired output clearer.`;

    const userMessageContent = `Please optimize the following system prompt:\n\n---\n${existingPrompt}\n---\n\nOutput only the optimized system prompt itself, without any introductory text, explanation, or markdown formatting.`;

     try {
        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: MODEL, // Or maybe a different model optimized for editing?
                messages: [
                    { role: "system", content: systemMessageContent },
                    { role: "user", content: userMessageContent }
                ],
                temperature: 0.5, // Lower temperature for more focused refinement
                // max_tokens: 300, // Adjust as needed
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("OpenAI API Error (Optimize):", errorData);
            throw new Error(`API request failed with status ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();

        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            return data.choices[0].message.content.trim();
        } else {
            console.error("Invalid response structure from OpenAI (Optimize):", data);
            throw new Error("Failed to parse optimized prompt from API response.");
        }

    } catch (error) {
        console.error("Error calling OpenAI API (Optimize):", error);
         if (error instanceof Error && error.message.includes('API key')) {
             throw new Error("Invalid OpenAI API Key provided.");
        }
        throw new Error(`Failed to optimize prompt: ${error.message}`);
    }
}