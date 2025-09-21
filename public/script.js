// AI Umpire Agent - Frontend JavaScript
class UmpireUI {
    constructor() {
        this.selectedFile = null;
        this.initializeEventListeners();
        this.checkServerHealth();
    }

    initializeEventListeners() {
        // File upload elements
        const uploadArea = document.getElementById('uploadArea');
        const videoInput = document.getElementById('videoInput');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const analyzeAnotherBtn = document.getElementById('analyzeAnotherBtn');
        const tryAgainBtn = document.getElementById('tryAgainBtn');

        // Upload area click
        uploadArea.addEventListener('click', () => {
            videoInput.click();
        });

        // File input change
        videoInput.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });

        // Drag and drop events
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });

        // Button events
        analyzeBtn.addEventListener('click', () => {
            this.analyzeVideo();
        });

        analyzeAnotherBtn.addEventListener('click', () => {
            this.resetInterface();
        });

        tryAgainBtn.addEventListener('click', () => {
            this.resetInterface();
        });
    }

    handleFileSelect(file) {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('video/')) {
            alert('Please select a valid video file.');
            return;
        }

        // Validate file size (100MB limit)
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) {
            alert('File size must be less than 100MB.');
            return;
        }

        this.selectedFile = file;
        this.updateUploadUI(file);
    }

    updateUploadUI(file) {
        const uploadArea = document.getElementById('uploadArea');
        const analyzeBtn = document.getElementById('analyzeBtn');

        // Update upload area to show selected file
        uploadArea.innerHTML = `
            <i class="fas fa-file-video"></i>
            <h3>File Selected</h3>
            <p><strong>${file.name}</strong></p>
            <p>Size: ${this.formatFileSize(file.size)}</p>
            <small>Click to select a different file</small>
        `;

        // Enable analyze button
        analyzeBtn.disabled = false;
    }

    async analyzeVideo() {
        if (!this.selectedFile) return;

        const sport = document.getElementById('sportSelect').value;
        
        // Show processing section
        this.showSection('processingSection');
        
        // Create form data
        const formData = new FormData();
        formData.append('video', this.selectedFile);
        formData.append('sport', sport);

        // Start processing animation
        this.startProcessingAnimation();

        try {
            const response = await fetch('/api/upload-video', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.displayResults(result.decision);
            } else {
                throw new Error(result.error || 'Analysis failed');
            }

        } catch (error) {
            console.error('Analysis error:', error);
            this.showError(error.message);
        }
    }

    startProcessingAnimation() {
        const steps = ['step1', 'step2', 'step3', 'step4'];
        let currentStep = 0;

        const animateStep = () => {
            if (currentStep < steps.length) {
                // Mark current step as active
                const step = document.getElementById(steps[currentStep]);
                step.classList.add('active');

                // Mark previous step as completed
                if (currentStep > 0) {
                    const prevStep = document.getElementById(steps[currentStep - 1]);
                    prevStep.classList.remove('active');
                    prevStep.classList.add('completed');
                }

                currentStep++;
                
                // Continue animation after delay
                setTimeout(animateStep, 2000);
            } else {
                // Mark last step as completed
                const lastStep = document.getElementById(steps[steps.length - 1]);
                lastStep.classList.remove('active');
                lastStep.classList.add('completed');
            }
        };

        animateStep();
    }

    displayResults(decision) {
        try {
            // Safely populate results section with fallbacks
            document.getElementById('finalCall').textContent = decision?.finalCall || 'DECISION';
            document.getElementById('decisionContent').textContent = decision?.decision || 'Analysis completed';
            
            // Handle sport name safely
            const sport = decision?.sport || 'general';
            document.getElementById('sportType').textContent = sport.charAt(0).toUpperCase() + sport.slice(1);
            
            // Handle video duration safely
            const duration = decision?.videoDuration || 0;
            document.getElementById('videoDuration').textContent = `${duration.toFixed(1)}s`;
            
            // Handle frame count - check for new property first, then old one
            let frameInfo = 'Full Video';
            if (decision?.processedAsFullVideo) {
                frameInfo = 'Complete Video Analysis';
            } else if (decision?.processedFrames) {
                frameInfo = decision.processedFrames.toString() + ' frames';
            }
            document.getElementById('framesCount').textContent = frameInfo;
            
            // Handle audio status safely
            document.getElementById('audioStatus').textContent = decision?.hasAudio ? 'Available' : 'Not Available';
            
            // Set confidence badge safely
            const confidenceBadge = document.getElementById('confidenceBadge');
            const confidenceLevel = document.getElementById('confidenceLevel');
            const confidence = decision?.confidence || 'Medium';
            confidenceLevel.textContent = confidence;
            
            // Update confidence badge class safely
            confidenceBadge.className = 'confidence-badge ' + confidence.toLowerCase();

            // Show results section
            this.showSection('resultsSection');
        } catch (error) {
            console.error('Error displaying results:', error);
            this.showError('Failed to display analysis results');
        }
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        this.showSection('errorSection');
    }

    showSection(sectionId) {
        // Hide all sections
        const sections = [
            'uploadSection',
            'processingSection', 
            'resultsSection',
            'errorSection'
        ];

        sections.forEach(id => {
            document.getElementById(id).classList.add('hidden');
        });

        // Show target section
        document.getElementById(sectionId).classList.remove('hidden');
    }

    resetInterface() {
        // Clear selected file
        this.selectedFile = null;
        document.getElementById('videoInput').value = '';

        // Reset upload area
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <h3>Upload Sports Video</h3>
            <p>Drop your video file here or click to browse</p>
            <div class="file-formats">
                <small>Supported formats: MP4, AVI, MOV, WMV (Max 100MB)</small>
            </div>
        `;

        // Reset analyze button
        const analyzeBtn = document.getElementById('analyzeBtn');
        analyzeBtn.disabled = true;

        // Reset processing steps
        const steps = ['step1', 'step2', 'step3', 'step4'];
        steps.forEach(stepId => {
            const step = document.getElementById(stepId);
            step.classList.remove('active', 'completed');
        });

        // Show upload section
        this.showSection('uploadSection');
    }

    async checkServerHealth() {
        try {
            const response = await fetch('/api/health');
            const health = await response.json();
            
            if (!health.geminiConfigured) {
                console.info('🎭 Running in demo mode - Gemini API key not configured');
                this.showDemoModeNotification(health);
                this.addModeIndicator('demo');
            } else {
                console.info('✅ AI Umpire ready with full Gemini API functionality');
                this.addModeIndicator('ai');
            }
        } catch (error) {
            console.error('Health check failed:', error);
            this.showError('Unable to connect to the server. Please check if the server is running.');
        }
    }

    showDemoModeNotification(health) {
        // Create a non-intrusive notification for demo mode
        const notification = document.createElement('div');
        notification.className = 'demo-notification';
        notification.innerHTML = `
            <div class="demo-content">
                <span class="demo-icon">🎭</span>
                <span class="demo-text">${health.message || 'Running in demo mode'}</span>
                <button class="demo-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add styles if not already present
        if (!document.getElementById('demo-styles')) {
            const styles = document.createElement('style');
            styles.id = 'demo-styles';
            styles.textContent = `
                .demo-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 12px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 1000;
                    max-width: 350px;
                    font-size: 14px;
                    animation: slideIn 0.3s ease-out;
                }
                .demo-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .demo-icon {
                    font-size: 18px;
                }
                .demo-text {
                    flex: 1;
                }
                .demo-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .demo-close:hover {
                    opacity: 0.7;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(notification);
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 8000);
    }

    addModeIndicator(mode) {
        // Add a subtle mode indicator to the header
        const header = document.querySelector('header');
        if (!header) return;

        // Remove existing indicator
        const existingIndicator = document.getElementById('mode-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        const indicator = document.createElement('div');
        indicator.id = 'mode-indicator';
        
        if (mode === 'demo') {
            indicator.innerHTML = `
                <span class="mode-badge demo-mode">
                    <i class="fas fa-theater-masks"></i> Demo Mode
                </span>
            `;
        } else {
            indicator.innerHTML = `
                <span class="mode-badge ai-mode">
                    <i class="fas fa-robot"></i> AI Powered
                </span>
            `;
        }

        // Add styles for mode indicator
        if (!document.getElementById('mode-indicator-styles')) {
            const styles = document.createElement('style');
            styles.id = 'mode-indicator-styles';
            styles.textContent = `
                #mode-indicator {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                }
                .mode-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .demo-mode {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                .ai-mode {
                    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
                    color: white;
                }
                header {
                    position: relative;
                }
            `;
            document.head.appendChild(styles);
        }

        header.appendChild(indicator);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize the UI when page loads
document.addEventListener('DOMContentLoaded', () => {
    new UmpireUI();
});