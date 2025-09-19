/**
 * Dynamic Quiz Question Container
 * A modular JavaScript implementation for rendering different question types
 * 
 * Features:
 * - Multiple Choice Questions (MCQ)
 * - Multiple Select Questions (MSQ)
 * - Coding Challenges with code editor
 * - True/False Questions
 * - Fill in the Blank Questions
 * 
 * Usage:
 * const quizContainer = new QuizContainer(containerElement, questions, options);
 */

class QuizContainer {
    constructor(container, questions = [], options = {}) {
        this.container = container;
        this.questions = questions;
        this.currentQuestionIndex = 0;
        this.userAnswers = {};
        this.options = {
            showNavigation: true,
            showSubmitButton: true,
            autoAdvance: false,
            onAnswerSubmit: null,
            onQuestionChange: null,
            theme: 'default',
            ...options
        };
        
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        if (this.questions.length === 0) {
            this.container.innerHTML = '<div class="quiz-error">No questions available</div>';
            return;
        }

        const question = this.questions[this.currentQuestionIndex];
        if (!question) return;

        this.container.innerHTML = `
            <div class="quiz-question-container">
                <div class="quiz-question-header">
                    <span class="quiz-question-number">Question ${this.currentQuestionIndex + 1} of ${this.questions.length}</span>
                    <span class="quiz-question-type">${this.formatQuestionType(question.type)}</span>
                </div>
                
                <div class="quiz-question-text">${this.formatQuestionText(question.question)}</div>
                
                <div class="quiz-question-content" id="questionContent">
                    ${this.renderQuestionContent(question)}
                </div>
                
                ${this.options.showSubmitButton ? `
                    <div class="quiz-question-actions">
                        ${this.options.showNavigation && this.currentQuestionIndex > 0 ? 
                            '<button class="quiz-btn quiz-btn-secondary" id="prevBtn">Previous</button>' : ''
                        }
                        <button class="quiz-btn quiz-btn-primary" id="submitBtn" disabled>Submit Answer</button>
                        ${this.options.showNavigation && this.currentQuestionIndex < this.questions.length - 1 ? 
                            '<button class="quiz-btn quiz-btn-secondary" id="nextBtn">Next</button>' : ''
                        }
                    </div>
                ` : ''}
            </div>
        `;

        // Add fade-in animation
        const contentElement = this.container.querySelector('.quiz-question-content');
        if (contentElement) {
            contentElement.classList.add('quiz-fade-in');
        }
    }

    renderQuestionContent(question) {
        switch (question.type) {
            case 'multiple-choice':
                return this.renderMultipleChoice(question);
            case 'multiple-select':
                return this.renderMultipleSelect(question);
            case 'coding':
                return this.renderCodingChallenge(question);
            case 'true-false':
                return this.renderTrueFalse(question);
            case 'fill-blank':
                return this.renderFillBlank(question);
            default:
                return '<div class="quiz-error">Unsupported question type</div>';
        }
    }

    renderMultipleChoice(question) {
        const options = question.options || [];
        return `
            <div class="quiz-options-grid">
                ${options.map((option, index) => `
                    <button class="quiz-option-button" data-index="${index}">
                        <span class="quiz-option-letter">${String.fromCharCode(65 + index)}</span>
                        <span class="quiz-option-text">${this.escapeHtml(option)}</span>
                    </button>
                `).join('')}
            </div>
        `;
    }

    renderMultipleSelect(question) {
        const options = question.options || [];
        return `
            <div class="quiz-checkbox-options">
                ${options.map((option, index) => `
                    <div class="quiz-checkbox-option" data-index="${index}">
                        <input type="checkbox" id="option-${index}" class="quiz-checkbox-input">
                        <label for="option-${index}" class="quiz-checkbox-label">${this.escapeHtml(option)}</label>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderCodingChallenge(question) {
        const language = question.language || 'javascript';
        const codeSnippet = question.codeSnippet || '';
        const testCases = question.testCases || [];

        return `
            <div class="quiz-coding-container">
                <div class="quiz-code-editor-container">
                    <div class="quiz-code-editor-header">${language.toUpperCase()} Code Editor</div>
                    <textarea class="quiz-code-editor" placeholder="Write your code here...">${this.escapeHtml(codeSnippet)}</textarea>
                </div>
                ${testCases.length > 0 ? `
                    <div class="quiz-test-cases">
                        <h4>Test Cases:</h4>
                        ${testCases.map((testCase, index) => `
                            <div class="quiz-test-case">
                                <strong>Test ${index + 1}:</strong> ${testCase.description}<br>
                                <strong>Input:</strong> ${testCase.input}<br>
                                <strong>Expected Output:</strong> ${testCase.expectedOutput}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderTrueFalse(question) {
        return `
            <div class="quiz-true-false-grid">
                <button class="quiz-true-false-button" data-value="true">True</button>
                <button class="quiz-true-false-button" data-value="false">False</button>
            </div>
        `;
    }

    renderFillBlank(question) {
        return `
            <div class="quiz-fill-blank-container">
                <input type="text" class="quiz-fill-blank-input" placeholder="Enter your answer...">
            </div>
        `;
    }

    attachEventListeners() {
        const question = this.questions[this.currentQuestionIndex];
        if (!question) return;

        // Multiple choice options
        const optionButtons = this.container.querySelectorAll('.quiz-option-button');
        optionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const index = parseInt(button.dataset.index);
                this.selectOption(index);
            });
        });

        // Multiple select checkboxes
        const checkboxOptions = this.container.querySelectorAll('.quiz-checkbox-option');
        checkboxOptions.forEach(option => {
            option.addEventListener('click', () => {
                const index = parseInt(option.dataset.index);
                this.toggleCheckbox(index);
            });
        });

        // True/False buttons
        const trueFalseButtons = this.container.querySelectorAll('.quiz-true-false-button');
        trueFalseButtons.forEach(button => {
            button.addEventListener('click', () => {
                const value = button.dataset.value === 'true';
                this.selectTrueFalse(value);
            });
        });

        // Fill in the blank input
        const fillBlankInput = this.container.querySelector('.quiz-fill-blank-input');
        if (fillBlankInput) {
            fillBlankInput.addEventListener('input', (e) => {
                this.userAnswers[question.id] = e.target.value;
                this.updateSubmitButton();
            });
        }

        // Coding editor
        const codeEditor = this.container.querySelector('.quiz-code-editor');
        if (codeEditor) {
            codeEditor.addEventListener('input', (e) => {
                this.userAnswers[question.id] = e.target.value;
                this.updateSubmitButton();
            });
        }

        // Navigation buttons
        const prevBtn = this.container.querySelector('#prevBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousQuestion());
        }

        const nextBtn = this.container.querySelector('#nextBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextQuestion());
        }

        // Submit button
        const submitBtn = this.container.querySelector('#submitBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitAnswer());
        }
    }

    selectOption(index) {
        const question = this.questions[this.currentQuestionIndex];
        this.userAnswers[question.id] = index;
        
        // Update UI
        const buttons = this.container.querySelectorAll('.quiz-option-button');
        buttons.forEach((btn, i) => {
            btn.classList.toggle('selected', i === index);
        });
        
        this.updateSubmitButton();
    }

    toggleCheckbox(index) {
        const question = this.questions[this.currentQuestionIndex];
        if (!this.userAnswers[question.id]) {
            this.userAnswers[question.id] = [];
        }
        
        const selectedIndex = this.userAnswers[question.id].indexOf(index);
        if (selectedIndex === -1) {
            this.userAnswers[question.id].push(index);
        } else {
            this.userAnswers[question.id].splice(selectedIndex, 1);
        }
        
        // Update UI
        const checkbox = this.container.querySelector(`#option-${index}`);
        if (checkbox) {
            checkbox.checked = selectedIndex === -1;
        }
        
        const optionDiv = this.container.querySelector(`[data-index="${index}"]`);
        if (optionDiv) {
            optionDiv.classList.toggle('selected', selectedIndex === -1);
        }
        
        this.updateSubmitButton();
    }

    selectTrueFalse(value) {
        const question = this.questions[this.currentQuestionIndex];
        this.userAnswers[question.id] = value;
        
        // Update UI
        const buttons = this.container.querySelectorAll('.quiz-true-false-button');
        buttons.forEach((btn, i) => {
            btn.classList.toggle('selected', 
                (i === 0 && value === true) || (i === 1 && value === false)
            );
        });
        
        this.updateSubmitButton();
    }

    updateSubmitButton() {
        const question = this.questions[this.currentQuestionIndex];
        const submitBtn = this.container.querySelector('#submitBtn');
        
        if (!submitBtn) return;

        const hasAnswer = this.userAnswers[question.id] !== undefined && 
                         this.userAnswers[question.id] !== null && 
                         this.userAnswers[question.id] !== '';
        
        submitBtn.disabled = !hasAnswer;
    }

    submitAnswer() {
        const question = this.questions[this.currentQuestionIndex];
        const answer = this.userAnswers[question.id];
        
        if (answer === undefined || answer === null || answer === '') {
            console.warn('No answer provided');
            return;
        }

        // Call the callback if provided
        if (this.options.onAnswerSubmit) {
            this.options.onAnswerSubmit({
                questionId: question.id,
                questionType: question.type,
                answer: answer,
                questionIndex: this.currentQuestionIndex
            });
        }

        // Auto advance if enabled
        if (this.options.autoAdvance && this.currentQuestionIndex < this.questions.length - 1) {
            this.nextQuestion();
        }
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.render();
            this.attachEventListeners();
            
            if (this.options.onQuestionChange) {
                this.options.onQuestionChange(this.currentQuestionIndex);
            }
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.render();
            this.attachEventListeners();
            
            if (this.options.onQuestionChange) {
                this.options.onQuestionChange(this.currentQuestionIndex);
            }
        }
    }

    goToQuestion(index) {
        if (index >= 0 && index < this.questions.length) {
            this.currentQuestionIndex = index;
            this.render();
            this.attachEventListeners();
            
            if (this.options.onQuestionChange) {
                this.options.onQuestionChange(this.currentQuestionIndex);
            }
        }
    }

    getCurrentAnswer() {
        const question = this.questions[this.currentQuestionIndex];
        return this.userAnswers[question.id];
    }

    getAllAnswers() {
        return this.userAnswers;
    }

    setQuestions(questions) {
        this.questions = questions;
        this.currentQuestionIndex = 0;
        this.userAnswers = {};
        this.render();
        this.attachEventListeners();
    }

    formatQuestionType(type) {
        return type.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    formatQuestionText(text) {
        // Convert newlines to <br> tags and escape HTML
        return this.escapeHtml(text).replace(/\n/g, '<br>');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Default CSS styles for the quiz container
const defaultStyles = `
    .quiz-question-container {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
    }

    .quiz-question-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 2px solid #f0f0f0;
    }

    .quiz-question-number {
        font-size: 1.1rem;
        font-weight: 600;
        color: #667eea;
    }

    .quiz-question-type {
        background: #667eea;
        color: white;
        padding: 6px 12px;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 500;
    }

    .quiz-question-text {
        font-size: 1.2rem;
        line-height: 1.6;
        margin-bottom: 25px;
        color: #333;
    }

    /* Multiple Choice */
    .quiz-options-grid {
        display: grid;
        gap: 12px;
    }

    .quiz-option-button {
        display: flex;
        align-items: center;
        padding: 15px;
        border: 2px solid #e0e0e0;
        border-radius: 10px;
        background: white;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 1rem;
    }

    .quiz-option-button:hover {
        border-color: #667eea;
        background: #f8f9ff;
        transform: translateY(-1px);
    }

    .quiz-option-button.selected {
        border-color: #667eea;
        background: #667eea;
        color: white;
    }

    .quiz-option-letter {
        background: #667eea;
        color: white;
        width: 35px;
        height: 35px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        margin-right: 12px;
        flex-shrink: 0;
    }

    .quiz-option-button.selected .quiz-option-letter {
        background: white;
        color: #667eea;
    }

    .quiz-option-text {
        flex: 1;
    }

    /* Multiple Select */
    .quiz-checkbox-options {
        display: grid;
        gap: 10px;
    }

    .quiz-checkbox-option {
        display: flex;
        align-items: center;
        padding: 12px;
        border: 2px solid #e0e0e0;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .quiz-checkbox-option:hover {
        border-color: #667eea;
        background: #f8f9ff;
    }

    .quiz-checkbox-option.selected {
        border-color: #667eea;
        background: #f8f9ff;
    }

    .quiz-checkbox-input {
        margin-right: 12px;
        transform: scale(1.1);
    }

    .quiz-checkbox-label {
        flex: 1;
        cursor: pointer;
    }

    /* True/False */
    .quiz-true-false-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
    }

    .quiz-true-false-button {
        padding: 25px;
        border: 2px solid #e0e0e0;
        border-radius: 10px;
        background: white;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 1.1rem;
        font-weight: 600;
        text-align: center;
    }

    .quiz-true-false-button:hover {
        border-color: #667eea;
        background: #f8f9ff;
        transform: translateY(-1px);
    }

    .quiz-true-false-button.selected {
        border-color: #667eea;
        background: #667eea;
        color: white;
    }

    /* Fill in the Blank */
    .quiz-fill-blank-container {
        margin-top: 15px;
    }

    .quiz-fill-blank-input {
        width: 100%;
        padding: 15px;
        border: 2px solid #e0e0e0;
        border-radius: 10px;
        font-size: 1rem;
        transition: border-color 0.3s ease;
    }

    .quiz-fill-blank-input:focus {
        outline: none;
        border-color: #667eea;
    }

    /* Coding Challenge */
    .quiz-coding-container {
        margin-top: 15px;
    }

    .quiz-code-editor-container {
        border: 2px solid #e0e0e0;
        border-radius: 10px;
        overflow: hidden;
    }

    .quiz-code-editor-header {
        background: #2d3748;
        color: white;
        padding: 12px 15px;
        font-family: 'Courier New', monospace;
        font-size: 0.9rem;
    }

    .quiz-code-editor {
        width: 100%;
        min-height: 150px;
        padding: 15px;
        border: none;
        font-family: 'Courier New', monospace;
        font-size: 0.9rem;
        line-height: 1.4;
        resize: vertical;
        background: #1a202c;
        color: #e2e8f0;
    }

    .quiz-code-editor:focus {
        outline: none;
    }

    .quiz-test-cases {
        margin-top: 15px;
    }

    .quiz-test-cases h4 {
        margin-bottom: 10px;
        color: #333;
    }

    .quiz-test-case {
        margin-top: 8px;
        padding: 10px;
        background: #f7fafc;
        border-radius: 8px;
        font-size: 0.9rem;
    }

    /* Actions */
    .quiz-question-actions {
        display: flex;
        gap: 12px;
        margin-top: 25px;
        padding-top: 15px;
        border-top: 2px solid #f0f0f0;
    }

    .quiz-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .quiz-btn-primary {
        background: #667eea;
        color: white;
    }

    .quiz-btn-primary:hover:not(:disabled) {
        background: #5a67d8;
        transform: translateY(-1px);
    }

    .quiz-btn-primary:disabled {
        background: #cbd5e0;
        cursor: not-allowed;
        transform: none;
    }

    .quiz-btn-secondary {
        background: #e2e8f0;
        color: #4a5568;
    }

    .quiz-btn-secondary:hover {
        background: #cbd5e0;
    }

    /* Animation */
    .quiz-fade-in {
        animation: quizFadeIn 0.4s ease-in;
    }

    @keyframes quizFadeIn {
        from {
            opacity: 0;
            transform: translateY(15px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    /* Error state */
    .quiz-error {
        color: #e53e3e;
        text-align: center;
        padding: 20px;
        background: #fed7d7;
        border-radius: 8px;
        border: 1px solid #feb2b2;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .quiz-question-container {
            padding: 15px;
        }

        .quiz-true-false-grid {
            grid-template-columns: 1fr;
        }

        .quiz-question-actions {
            flex-direction: column;
        }

        .quiz-btn {
            width: 100%;
        }
    }
`;

// Function to inject default styles
function injectQuizStyles() {
    if (!document.getElementById('quiz-container-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'quiz-container-styles';
        styleElement.textContent = defaultStyles;
        document.head.appendChild(styleElement);
    }
}

// Auto-inject styles when the script loads
if (typeof document !== 'undefined') {
    injectQuizStyles();
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QuizContainer, injectQuizStyles };
} else if (typeof window !== 'undefined') {
    window.QuizContainer = QuizContainer;
    window.injectQuizStyles = injectQuizStyles;
}
