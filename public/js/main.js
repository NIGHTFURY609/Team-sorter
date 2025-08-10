// Client-side script for participant submission page
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('participantForm');
    const fullNameInput = document.getElementById('fullName');
    const joinButton = document.getElementById('joinButton');
    const buttonText = document.getElementById('buttonText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');

    // Auto-focus on the name input
    fullNameInput.focus();

    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = fullNameInput.value.trim();
        
        if (!name) {
            showError('Please enter your full name');
            return;
        }

        if (name.length < 2) {
            showError('Name must be at least 2 characters long');
            return;
        }

        if (name.length > 100) {
            showError('Name is too long (maximum 100 characters)');
            return;
        }

        // Show loading state
        setLoadingState(true);
        hideMessages();

        try {
            const response = await fetch('/api/participants', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: name })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showSuccess(data.message || 'You have joined the session!');
                form.reset();
                
                // Add a nice animation to the success message
                setTimeout(() => {
                    successMessage.classList.add('animate-pulse-success');
                }, 100);
            } else {
                showError(data.error || 'Failed to join session');
            }

        } catch (error) {
            console.error('Error joining session:', error);
            showError('Network error. Please check your connection and try again.');
        } finally {
            setLoadingState(false);
        }
    });

    // Handle Enter key press for better UX
    fullNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            form.dispatchEvent(new Event('submit'));
        }
    });

    // Real-time input validation
    fullNameInput.addEventListener('input', function() {
        const name = this.value.trim();
        
        if (name.length > 100) {
            this.setCustomValidity('Name is too long (maximum 100 characters)');
        } else if (name.length > 0 && name.length < 2) {
            this.setCustomValidity('Name must be at least 2 characters long');
        } else {
            this.setCustomValidity('');
        }
    });

    // Utility functions
    function setLoadingState(loading) {
        joinButton.disabled = loading;
        
        if (loading) {
            buttonText.textContent = 'Joining...';
            loadingSpinner.classList.remove('hidden');
        } else {
            buttonText.textContent = 'Join Session';
            loadingSpinner.classList.add('hidden');
        }
    }

    function showSuccess(message) {
        hideMessages();
        successMessage.classList.remove('hidden');
        successMessage.classList.add('animate-fadeIn');
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
            successMessage.classList.add('hidden');
        }, 5000);
    }

    function showError(message) {
        hideMessages();
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
        errorMessage.classList.add('animate-fadeIn');
        
        // Auto-hide error message after 7 seconds
        setTimeout(() => {
            errorMessage.classList.add('hidden');
        }, 7000);
    }

    function hideMessages() {
        successMessage.classList.add('hidden');
        errorMessage.classList.add('hidden');
        successMessage.classList.remove('animate-fadeIn', 'animate-pulse-success');
        errorMessage.classList.remove('animate-fadeIn');
    }
});