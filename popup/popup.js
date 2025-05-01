// filepath: /Users/bkmobil/Projects/extensions/prompt_keeper_chrome_extension/popup/popup.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const searchInput = document.getElementById('search-input');
    const addPromptBtn = document.getElementById('add-prompt-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const promptListView = document.getElementById('prompt-list-view');
    const promptListUl = document.getElementById('prompt-list');
    const promptDetailView = document.getElementById('prompt-detail-view');
    const generatePromptView = document.getElementById('generate-prompt-view');
    const settingsView = document.getElementById('settings-view');
    const backToListBtn = document.getElementById('back-to-list-btn');
    const backToListFromGenerateBtn = document.getElementById('back-to-list-from-generate-btn');
    const backToListFromSettingsBtn = document.getElementById('back-to-list-from-settings-btn');
    const promptForm = document.getElementById('prompt-form');
    const promptIdInput = document.getElementById('prompt-id');
    const promptTitleInput = document.getElementById('prompt-title');
    const promptContentInput = document.getElementById('prompt-content');
    const promptTagsInput = document.getElementById('prompt-tags');
    const tagSuggestionsContainer = document.getElementById('tag-suggestions'); // Added
    const savePromptBtn = document.getElementById('save-prompt-btn');
    const deletePromptBtn = document.getElementById('delete-prompt-btn');
    const copyPromptBtn = document.getElementById('copy-prompt-btn');
    const detailTitle = document.getElementById('detail-title');
    // New elements for AI suggestions in detail view
    const generateAiBtn = document.getElementById('generate-ai-btn');
    const optimizeAiBtn = document.getElementById('optimize-ai-btn');
    const aiSuggestionArea = document.getElementById('ai-suggestion-area');
    const aiStatusMessage = document.getElementById('ai-status-message');
    const aiResultContainer = document.getElementById('ai-result-container');
    const aiSuggestedContent = document.getElementById('ai-suggested-content');
    const useAiSuggestionBtn = document.getElementById('use-ai-suggestion-btn');
    const discardAiSuggestionBtn = document.getElementById('discard-ai-suggestion-btn');

    // Settings View Elements
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    const apiKeyStatus = document.getElementById('api-key-status');

    // Generate View Elements
    const generateTagsInput = document.getElementById('generate-tags');
    const generateNotesInput = document.getElementById('generate-notes');
    const triggerGenerateBtn = document.getElementById('trigger-generate-btn');
    const generatedPromptArea = document.getElementById('generated-prompt-area');
    const generatedPromptContent = document.getElementById('generated-prompt-content');
    const saveGeneratedBtn = document.getElementById('save-generated-btn');
    const discardGeneratedBtn = document.getElementById('discard-generated-btn');
    const generationStatus = document.getElementById('generation-status');

    // --- State ---
    let allPrompts = [];
    let currentFilter = '';
    let predefinedTags = [
        'Python Developer', 'PHP Developer', 'JavaScript Developer', 'Frontend Developer',
        'Backend Developer', 'Fullstack Developer', 'DevOps Engineer', 'System Architect',
        'Database Administrator', 'QA Engineer', 'Data Scientist', 'Machine Learning Engineer',
        'React', 'Vue.js', 'Angular', 'Node.js', 'Django', 'Flask', 'Symfony', 'Laravel',
        'SQL', 'NoSQL', 'Cloud', 'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes'
    ]; // Add more as needed
    let userDefinedTags = [];
    let combinedTags = []; // Added: For suggestions
    let currentApiKey = null;

    // --- Initialization ---
    async function initialize() {
        await loadApiKey(); // Load API key first
        await loadUserTags(); // Load user tags before prompts might need them
        await loadPrompts(); // Load prompts after tags are ready
        updateCombinedTags(); // Initial combination
        setupEventListeners();
        renderPromptList();
        updateApiKeyStatus();
    }

    // --- Data Loading ---
    async function loadPrompts() {
        allPrompts = await getPrompts();
        renderPromptList(); // Re-render after loading
    }

    async function loadUserTags() {
        userDefinedTags = await getUserTags();
        updateCombinedTags(); // Update combined list when user tags change
    }

    async function loadApiKey() {
        currentApiKey = await getApiKey();
        if (currentApiKey) {
            apiKeyInput.value = currentApiKey; // Pre-fill for user convenience (masked)
        }
        updateApiKeyStatus();
        updateGenerateButtonState(); // Enable/disable generate button based on key
    }

    // --- Rendering ---
    function renderPromptList() {
        promptListUl.innerHTML = ''; // Clear existing list
        const filteredPrompts = allPrompts.filter(prompt => {
            const searchTerm = currentFilter.toLowerCase();
            const titleMatch = prompt.title.toLowerCase().includes(searchTerm);
            const tagMatch = prompt.tags && prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm));
            return titleMatch || tagMatch;
        });

        if (filteredPrompts.length === 0) {
            promptListUl.innerHTML = '<li class="prompt-item">No prompts found.</li>';
            return;
        }

        filteredPrompts.sort((a, b) => a.title.localeCompare(b.title)) // Sort alphabetically by title
            .forEach(prompt => {
                const li = document.createElement('li');
                li.classList.add('prompt-item');
                li.dataset.id = prompt.id; // Store ID for easy access

                const titleSpan = document.createElement('span');
                titleSpan.classList.add('prompt-item-title');
                titleSpan.textContent = prompt.title;
                li.appendChild(titleSpan);

                if (prompt.tags && prompt.tags.length > 0) {
                    const tagsDiv = document.createElement('div');
                    tagsDiv.classList.add('prompt-item-tags');
                    prompt.tags.slice(0, 3).forEach(tag => { // Show max 3 tags in list view
                        const tagSpan = document.createElement('span');
                        tagSpan.classList.add('prompt-item-tag');
                        tagSpan.textContent = tag;
                        tagsDiv.appendChild(tagSpan);
                    });
                     if (prompt.tags.length > 3) {
                         const moreTagsSpan = document.createElement('span');
                         moreTagsSpan.classList.add('prompt-item-tag');
                         moreTagsSpan.textContent = `+${prompt.tags.length - 3}`;
                         tagsDiv.appendChild(moreTagsSpan);
                     }
                    li.appendChild(tagsDiv);
                }

                li.addEventListener('click', () => showPromptDetail(prompt.id));
                promptListUl.appendChild(li);
            });
    }

    // --- Tag Suggestions --- (New Section)

    function updateCombinedTags() {
        // Combine predefined and user tags, ensuring uniqueness (case-insensitive)
        const allTags = [...predefinedTags, ...userDefinedTags];
        combinedTags = [...new Map(allTags.map(tag => [tag.toLowerCase(), tag])).values()].sort();
    }

    function renderTagSuggestions(searchTerm, existingTags) {
        tagSuggestionsContainer.innerHTML = ''; // Clear previous suggestions
        if (!searchTerm) return; // Don't show suggestions if search term is empty

        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const lowerCaseExistingTags = existingTags.map(t => t.toLowerCase());

        const filteredTags = combinedTags.filter(tag => {
            const lowerCaseTag = tag.toLowerCase();
            // Check if tag includes the search term and is not already in the input
            return lowerCaseTag.includes(lowerCaseSearchTerm) && !lowerCaseExistingTags.includes(lowerCaseTag);
        });

        filteredTags.slice(0, 10).forEach(tag => { // Limit suggestions shown
            const div = document.createElement('div');
            div.classList.add('tag-suggestion-item');
            div.textContent = tag;
            div.addEventListener('mousedown', (e) => { // Use mousedown to avoid blur event firing first
                e.preventDefault(); // Prevent input from losing focus
                selectTagSuggestion(tag);
            });
            tagSuggestionsContainer.appendChild(div);
        });
    }

    function selectTagSuggestion(tag) {
        const currentTagsValue = promptTagsInput.value.trim();
        const tagsArray = currentTagsValue.split(',')
            .map(t => t.trim())
            .filter(t => t !== ''); // Get current tags

        // Remove the part the user was typing
        const lastCommaIndex = currentTagsValue.lastIndexOf(',');
        let baseTags = '';
        if (lastCommaIndex !== -1) {
            baseTags = currentTagsValue.substring(0, lastCommaIndex + 1).trim() + ' '; // Keep space after comma
        }

        // Append the selected tag
        promptTagsInput.value = baseTags + tag + ', ';

        // Clear suggestions and refocus
        tagSuggestionsContainer.innerHTML = '';
        promptTagsInput.focus();
    }

    // --- View Switching ---
    function showView(viewToShow) {
        promptListView.classList.add('hidden');
        promptDetailView.classList.add('hidden');
        generatePromptView.classList.add('hidden');
        settingsView.classList.add('hidden');

        if (viewToShow === 'list') {
            promptListView.classList.remove('hidden');
        } else if (viewToShow === 'detail') {
            promptDetailView.classList.remove('hidden');
        } else if (viewToShow === 'generate') {
            generatePromptView.classList.remove('hidden');
            updateGenerateButtonState(); // Ensure button state is correct when view shown
        } else if (viewToShow === 'settings') {
            settingsView.classList.remove('hidden');
        }
    }

    function showPromptDetail(promptId) {
        const prompt = allPrompts.find(p => p.id === promptId);
        if (prompt) {
            detailTitle.textContent = "Edit Prompt";
            promptIdInput.value = prompt.id;
            promptTitleInput.value = prompt.title;
            promptContentInput.value = prompt.content;
            promptTagsInput.value = prompt.tags ? prompt.tags.join(', ') : '';
            deletePromptBtn.classList.remove('hidden'); // Show delete button for existing prompts
            generateAiBtn.style.display = 'none'; // Hide Generate button
            optimizeAiBtn.style.display = 'inline-block'; // Show Optimize button
            hideAiSuggestionArea(); // Ensure AI area is hidden on view switch
            showView('detail');
        } else {
            console.error("Prompt not found for ID:", promptId);
        }
    }

    function showNewPromptForm() {
        detailTitle.textContent = "Add New Prompt";
        promptForm.reset(); // Clear form fields
        promptIdInput.value = ''; // Ensure no ID is set
        deletePromptBtn.classList.add('hidden'); // Hide delete button for new prompts
        generateAiBtn.style.display = 'inline-block'; // Show Generate button
        optimizeAiBtn.style.display = 'none'; // Hide Optimize button
        hideAiSuggestionArea(); // Ensure AI area is hidden on view switch
        showView('detail');
    }

    function showSettings() {
        showView('settings');
    }

    function showGeneratePrompt() {
        // Reset generate view state
        generateTagsInput.value = '';
        generateNotesInput.value = '';
        generatedPromptArea.classList.add('hidden');
        generatedPromptContent.value = '';
        generationStatus.textContent = '';
        showView('generate');
    }


    // --- Event Handlers ---
    function setupEventListeners() {
        searchInput.addEventListener('input', (e) => {
            currentFilter = e.target.value;
            renderPromptList();
        });

        addPromptBtn.addEventListener('click', showNewPromptForm);
        settingsBtn.addEventListener('click', showSettings);

        backToListBtn.addEventListener('click', () => showView('list'));
        backToListFromGenerateBtn.addEventListener('click', () => showView('list'));
        backToListFromSettingsBtn.addEventListener('click', () => showView('list'));


        promptForm.addEventListener('submit', handleSavePrompt);
        deletePromptBtn.addEventListener('click', handleDeletePrompt);
        copyPromptBtn.addEventListener('click', handleCopyPrompt);

        // Tag input listener for suggestions
        promptTagsInput.addEventListener('input', handleTagInput);
        promptTagsInput.addEventListener('blur', () => {
            // Delay hiding suggestions slightly to allow click events on suggestions
            setTimeout(() => {
                tagSuggestionsContainer.innerHTML = '';
            }, 150);
        });
        promptTagsInput.addEventListener('focus', handleTagInput); // Show suggestions on focus too

        // AI Buttons in Detail View
        generateAiBtn.addEventListener('click', handleGenerateForNewPrompt);
        optimizeAiBtn.addEventListener('click', handleOptimizeExistingPrompt);
        useAiSuggestionBtn.addEventListener('click', handleUseAiSuggestion);
        discardAiSuggestionBtn.addEventListener('click', handleDiscardAiSuggestion);

        // Settings listeners
        saveApiKeyBtn.addEventListener('click', handleSaveApiKey);

        // Generate listeners
        triggerGenerateBtn.addEventListener('click', handleGeneratePrompt);
        saveGeneratedBtn.addEventListener('click', handleSaveGeneratedPrompt);
        discardGeneratedBtn.addEventListener('click', handleDiscardGeneratedPrompt);
    }

    function handleTagInput() {
        const value = promptTagsInput.value;
        const cursorPos = promptTagsInput.selectionStart; // Get cursor position

        // Find the text segment the cursor is in (between commas or start/end)
        let startIndex = value.lastIndexOf(',', cursorPos - 1) + 1;
        let endIndex = value.indexOf(',', cursorPos);
        if (endIndex === -1) {
            endIndex = value.length;
        }

        const currentTagFragment = value.substring(startIndex, endIndex).trim();

        // Get tags already fully entered
        const existingTags = value.substring(0, startIndex).split(',')
                                .map(t => t.trim())
                                .filter(t => t !== '');

        renderTagSuggestions(currentTagFragment, existingTags);
    }

    async function handleSavePrompt(event) {
        event.preventDefault();
        const id = promptIdInput.value;
        const title = promptTitleInput.value.trim();
        const content = promptContentInput.value.trim(); // Content might have been updated by AI
        const tagsString = promptTagsInput.value.trim().replace(/,$/, ''); // Remove trailing comma if any

        if (!title || !content) {
            alert("Title and Content cannot be empty.");
            return;
        }

        // Process tags: split, trim, filter empty, ensure uniqueness (case-insensitive)
        const rawTags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
        const uniqueTagsMap = new Map(rawTags.map(tag => [tag.toLowerCase(), tag]));
        const tags = [...uniqueTagsMap.values()];


        const promptData = { title, content, tags };

        try {
            if (id) { // Update existing prompt
                promptData.id = id;
                await updatePrompt(promptData);
            } else { // Add new prompt
                await addPrompt(promptData);
            }
            // Add any new tags entered by the user to the user tag list
            let tagsChanged = false;
            for (const tag of tags) {
                 const lowerCaseTag = tag.toLowerCase();
                 if (!userDefinedTags.some(udTag => udTag.toLowerCase() === lowerCaseTag) &&
                     !predefinedTags.some(pdTag => pdTag.toLowerCase() === lowerCaseTag)) {
                    await addUserTag(tag);
                    tagsChanged = true;
                 }
            }

            await loadPrompts(); // Reload prompts from storage
            if (tagsChanged) {
                await loadUserTags(); // Reload user tags ONLY if they might have changed
            }
            showView('list'); // Go back to the list view
        } catch (error) {
            console.error("Error saving prompt:", error);
            alert("Failed to save prompt. See console for details.");
        }
    }

    async function handleDeletePrompt() {
        const id = promptIdInput.value;
        if (id && confirm("Are you sure you want to delete this prompt?")) {
            try {
                await deletePrompt(id);
                await loadPrompts();
                showView('list');
            } catch (error) {
                console.error("Error deleting prompt:", error);
                alert("Failed to delete prompt. See console for details.");
            }
        }
    }

    function handleCopyPrompt() {
        const content = promptContentInput.value;
        if (content) {
            navigator.clipboard.writeText(content)
                .then(() => {
                    // Optional: Show temporary success message
                    const originalText = copyPromptBtn.textContent;
                    copyPromptBtn.textContent = 'Copied!';
                    setTimeout(() => {
                        copyPromptBtn.textContent = originalText;
                    }, 1500);
                })
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                    alert('Failed to copy prompt content.');
                });
        }
    }

    async function handleSaveApiKey() {
        const newApiKey = apiKeyInput.value.trim();
        if (newApiKey) {
            try {
                await saveApiKey(newApiKey);
                currentApiKey = newApiKey; // Update local state
                updateApiKeyStatus(true); // Show success
                updateGenerateButtonState();
                // Optionally clear the input field after saving for security,
                // but keep it pre-filled (masked) on load for convenience.
                // apiKeyInput.value = '';
                alert("API Key saved successfully.");
            } catch (error) {
                console.error("Error saving API key:", error);
                alert("Failed to save API Key. See console for details.");
                updateApiKeyStatus(false); // Show error/default
            }
        } else {
            // If user clears the key and saves, remove it
             try {
                await saveApiKey(''); // Save empty string to remove
                currentApiKey = null;
                updateApiKeyStatus();
                updateGenerateButtonState();
                alert("API Key removed.");
            } catch (error) {
                 console.error("Error removing API key:", error);
                 alert("Failed to remove API Key. See console for details.");
            }
        }
    }

    async function handleGeneratePrompt() {
        const tagsString = generateTagsInput.value.trim();
        const notes = generateNotesInput.value.trim();

        if (!currentApiKey) {
            generationStatus.textContent = 'Error: OpenAI API Key not set. Please add it in Settings.';
            generationStatus.style.color = 'var(--danger-color)';
            return;
        }

        if (!tagsString) {
            generationStatus.textContent = 'Error: Please enter at least one tag.';
            generationStatus.style.color = 'var(--danger-color)';
            return;
        }

        const tags = tagsString.split(',').map(t => t.trim()).filter(t => t);

        generationStatus.textContent = 'Generating...';
        generationStatus.style.color = 'var(--text-color-secondary)';
        triggerGenerateBtn.disabled = true;
        generatedPromptArea.classList.add('hidden');

        try {
            const generatedContent = await generatePrompt(currentApiKey, tags, notes);
            generatedPromptContent.value = generatedContent;
            generatedPromptArea.classList.remove('hidden');
            generationStatus.textContent = 'Generation successful!';
            generationStatus.style.color = 'var(--link-color)'; // Use a success-like color

             // Add any new tags used for generation to the user tag list
             let tagsChanged = false;
            for (const tag of tags) {
                 const lowerCaseTag = tag.toLowerCase();
                 if (!userDefinedTags.some(udTag => udTag.toLowerCase() === lowerCaseTag) &&
                     !predefinedTags.some(pdTag => pdTag.toLowerCase() === lowerCaseTag)) {
                    await addUserTag(tag);
                    tagsChanged = true;
                 }
            }
            if (tagsChanged) {
                await loadUserTags(); // Reload tags if new ones were added during generation
            }

        } catch (error) {
            console.error("Generation failed:", error);
            generationStatus.textContent = `Error: ${error.message}`;
            generationStatus.style.color = 'var(--danger-color)';
            generatedPromptArea.classList.add('hidden');
        } finally {
            triggerGenerateBtn.disabled = false;
        }
    }

     function handleSaveGeneratedPrompt() {
        const generatedContent = generatedPromptContent.value;
        const tags = generateTagsInput.value.trim(); // Keep original tags used for generation

        if (!generatedContent) return;

        // Pre-fill the add/edit form with the generated content
        detailTitle.textContent = "Save Generated Prompt";
        promptForm.reset();
        promptIdInput.value = ''; // New prompt
        promptTitleInput.value = `Generated Prompt (${tags.split(',')[0].trim()}...)`; // Suggest a title
        promptContentInput.value = generatedContent;
        promptTagsInput.value = tags; // Pre-fill tags used for generation
        deletePromptBtn.classList.add('hidden');

        showView('detail'); // Switch to the detail view for saving
    }

     function handleDiscardGeneratedPrompt() {
        // Simply hide the generated area and clear status
        generatedPromptArea.classList.add('hidden');
        generatedPromptContent.value = '';
        generationStatus.textContent = '';
        // Optionally clear tags/notes inputs or leave them for refinement
        // generateTagsInput.value = '';
        // generateNotesInput.value = '';
    }

    // --- AI Generation/Optimization Handlers (Detail View) ---

    function showAiSuggestionArea(message, isLoading = false) {
        aiSuggestionArea.classList.remove('hidden');
        aiStatusMessage.textContent = message;
        aiStatusMessage.style.color = isLoading ? 'var(--text-color-secondary)' : 'var(--link-color)'; // Default to success color if not loading
        if (isLoading) {
            aiResultContainer.classList.add('hidden'); // Hide result area while loading
        }
    }

    function displayAiSuggestionResult(content) {
        aiStatusMessage.textContent = 'Suggestion ready:';
        aiStatusMessage.style.color = 'var(--link-color)';
        aiSuggestedContent.value = content;
        aiResultContainer.classList.remove('hidden');
    }

    function displayAiSuggestionError(errorMessage) {
         aiStatusMessage.textContent = `Error: ${errorMessage}`;
         aiStatusMessage.style.color = 'var(--danger-color)';
         aiResultContainer.classList.add('hidden'); // Hide result area on error
    }

    function hideAiSuggestionArea() {
        aiSuggestionArea.classList.add('hidden');
        aiStatusMessage.textContent = '';
        aiSuggestedContent.value = '';
        aiResultContainer.classList.add('hidden');
    }

    async function handleGenerateForNewPrompt() {
        if (!currentApiKey) {
            alert("OpenAI API Key not set. Please add it in Settings.");
            return;
        }
        const tagsString = promptTagsInput.value.trim();
        // Get content from the main textarea to use as notes
        const notesFromContent = promptContentInput.value.trim();

        if (!tagsString) {
            alert("Please enter some tags to generate a prompt.");
            return;
        }
        const tags = tagsString.split(',').map(t => t.trim()).filter(t => t);

        showAiSuggestionArea("Generating prompt based on tags and content...", true);
        generateAiBtn.disabled = true; // Disable button while processing

        try {
            // Pass notesFromContent as the 'notes' parameter
            const generatedContent = await generatePrompt(currentApiKey, tags, notesFromContent);
            displayAiSuggestionResult(generatedContent);
             // Add any new tags used for generation to the user tag list
             let tagsChanged = false;
            for (const tag of tags) {
                 const lowerCaseTag = tag.toLowerCase();
                 if (!userDefinedTags.some(udTag => udTag.toLowerCase() === lowerCaseTag) &&
                     !predefinedTags.some(pdTag => pdTag.toLowerCase() === lowerCaseTag)) {
                    await addUserTag(tag);
                    tagsChanged = true;
                 }
            }
            if (tagsChanged) {
                await loadUserTags(); // Reload tags if new ones were added
            }
        } catch (error) {
            console.error("Generation failed:", error);
            displayAiSuggestionError(error.message);
        } finally {
             generateAiBtn.disabled = false; // Re-enable button
        }
    }

    async function handleOptimizeExistingPrompt() {
         if (!currentApiKey) {
            alert("OpenAI API Key not set. Please add it in Settings.");
            return;
        }
        const currentContent = promptContentInput.value.trim();
        if (!currentContent) {
            alert("There is no content to optimize.");
            return;
        }

        showAiSuggestionArea("Optimizing existing prompt...", true);
        optimizeAiBtn.disabled = true; // Disable button while processing

        try {
            const optimizedContent = await optimizePrompt(currentApiKey, currentContent);
            displayAiSuggestionResult(optimizedContent);
        } catch (error) {
             console.error("Optimization failed:", error);
             displayAiSuggestionError(error.message);
        } finally {
            optimizeAiBtn.disabled = false; // Re-enable button
        }
    }

    function handleUseAiSuggestion() {
        const suggestedContent = aiSuggestedContent.value;
        if (suggestedContent) {
            promptContentInput.value = suggestedContent; // Update the main content area
        }
        hideAiSuggestionArea(); // Hide the suggestion area
    }

    function handleDiscardAiSuggestion() {
        hideAiSuggestionArea(); // Just hide the suggestion area
    }

    // --- UI Updates ---
    function updateApiKeyStatus(isSuccess = null) {
        if (currentApiKey) {
            apiKeyStatus.textContent = 'API Key is set.';
            apiKeyStatus.style.color = 'var(--link-color)'; // Use a success-like color
        } else {
            apiKeyStatus.textContent = 'API Key not set.';
             apiKeyStatus.style.color = 'var(--text-color-secondary)';
        }
        if (isSuccess === true) {
             apiKeyStatus.textContent = 'API Key saved successfully.';
             apiKeyStatus.style.color = 'var(--link-color)';
        } else if (isSuccess === false) {
             apiKeyStatus.textContent = 'Failed to save API Key.';
             apiKeyStatus.style.color = 'var(--danger-color)';
        }
    }

    function updateGenerateButtonState() {
        // Enable generate button only if API key is present
        triggerGenerateBtn.disabled = !currentApiKey;
        if (!currentApiKey && generatePromptView.classList.contains('hidden') === false) {
             generationStatus.textContent = 'OpenAI API Key needed for generation (Settings).';
             generationStatus.style.color = 'var(--text-color-secondary)';
        } else if (generatePromptView.classList.contains('hidden') === false) {
            // Clear the message if key exists and view is visible
             generationStatus.textContent = '';
        }
    }

    // --- Start the application ---
    initialize();
});