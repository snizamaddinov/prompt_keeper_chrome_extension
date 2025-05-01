// filepath: /Users/bkmobil/Projects/extensions/prompt_keeper_chrome_extension/common/storage.js
const STORAGE_KEY_PROMPTS = 'prompts';
const STORAGE_KEY_API_KEY = 'openai_api_key';
const STORAGE_KEY_TAGS = 'user_tags'; // To store custom tags

// --- Prompts ---

async function getPrompts() {
    const result = await chrome.storage.local.get(STORAGE_KEY_PROMPTS);
    // Ensure result.prompts is always an array, even if undefined/null
    return Array.isArray(result.prompts) ? result.prompts : [];
}

async function savePrompts(prompts) {
    if (!Array.isArray(prompts)) {
        console.error("Error saving prompts: Input must be an array.");
        return;
    }
    await chrome.storage.local.set({ [STORAGE_KEY_PROMPTS]: prompts });
}

async function addPrompt(newPrompt) {
    const prompts = await getPrompts();
    // Assign a simple unique ID (timestamp + random number)
    newPrompt.id = newPrompt.id || Date.now() + Math.random().toString(16).slice(2);
    prompts.push(newPrompt);
    await savePrompts(prompts);
    return newPrompt; // Return the prompt with its ID
}

async function updatePrompt(updatedPrompt) {
    if (!updatedPrompt.id) {
        console.error("Error updating prompt: ID is missing.");
        return;
    }
    const prompts = await getPrompts();
    const index = prompts.findIndex(p => p.id === updatedPrompt.id);
    if (index !== -1) {
        prompts[index] = updatedPrompt;
        await savePrompts(prompts);
    } else {
        console.error(`Error updating prompt: Prompt with ID ${updatedPrompt.id} not found.`);
    }
}

async function deletePrompt(promptId) {
     if (!promptId) {
        console.error("Error deleting prompt: ID is missing.");
        return;
    }
    let prompts = await getPrompts();
    prompts = prompts.filter(p => p.id !== promptId);
    await savePrompts(prompts);
}

// --- API Key ---

async function getApiKey() {
    const result = await chrome.storage.local.get(STORAGE_KEY_API_KEY);
    return result[STORAGE_KEY_API_KEY] || null;
}

async function saveApiKey(apiKey) {
    await chrome.storage.local.set({ [STORAGE_KEY_API_KEY]: apiKey });
}

// --- Tags ---
// Store custom tags separately to easily merge with predefined ones
async function getUserTags() {
    const result = await chrome.storage.local.get(STORAGE_KEY_TAGS);
    return Array.isArray(result[STORAGE_KEY_TAGS]) ? result[STORAGE_KEY_TAGS] : [];
}

async function saveUserTags(tags) {
     if (!Array.isArray(tags)) {
        console.error("Error saving tags: Input must be an array.");
        return;
    }
    // Store unique tags, case-insensitive comparison but preserve original case
    const uniqueTags = [...new Map(tags.map(tag => [tag.toLowerCase(), tag])).values()];
    await chrome.storage.local.set({ [STORAGE_KEY_TAGS]: uniqueTags });
}

async function addUserTag(newTag) {
    if (!newTag || typeof newTag !== 'string' || !newTag.trim()) return; // Ignore empty/invalid tags
    const currentTags = await getUserTags();
    const lowerCaseTag = newTag.trim().toLowerCase();
    // Add only if it doesn't exist (case-insensitive check)
    if (!currentTags.some(tag => tag.toLowerCase() === lowerCaseTag)) {
        currentTags.push(newTag.trim()); // Preserve original case
        await saveUserTags(currentTags);
    }
}