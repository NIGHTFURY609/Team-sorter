// Client-side script for admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Socket.IO connection
    const socket = io();
    
    // DOM elements
    const participantsList = document.getElementById('participantsList');
    const participantCount = document.getElementById('participantCount');
    const noParticipants = document.getElementById('noParticipants');
    const numTeamsInput = document.getElementById('numTeams');
    const generateTeamsBtn = document.getElementById('generateTeamsBtn');
    const generateBtnText = document.getElementById('generateBtnText');
    const generateSpinner = document.getElementById('generateSpinner');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const connectionStatus = document.getElementById('connectionStatus');
    
    // Teams display elements
    const teamsContainer = document.getElementById('teamsContainer');
    const noTeams = document.getElementById('noTeams');
    const teamsGrid = document.getElementById('teamsGrid');
    const teamsInfo = document.getElementById('teamsInfo');
    const totalParticipantsCount = document.getElementById('totalParticipantsCount');
    const totalTeamsCount = document.getElementById('totalTeamsCount');
    
    // State
    let participants = [];
    let currentTeams = [];

    // Socket connection handlers
    socket.on('connect', () => {
        console.log('Connected to server');
        updateConnectionStatus(true);
        // Request current participants list on connect
        socket.emit('get_participants');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        updateConnectionStatus(false);
    });

    // Socket event listeners
    socket.on('new_participant', (data) => {
        console.log('New participant:', data);
        addParticipant(data.name);
        showNotification('New Participant', `${data.name} joined the session`, 'success');
    });

    socket.on('participants_list', (participantNames) => {
        console.log('Received participants list:', participantNames);
        participants = participantNames;
        renderParticipants();
    });

    socket.on('teams_generated', (data) => {
        console.log('Teams generated:', data);
        currentTeams = data.teams;
        renderTeams(data.teams, data.totalParticipants);
        setGeneratingState(false);
        showNotification('Teams Generated', `Successfully created ${data.teams.length} teams`, 'success');
    });

    socket.on('participants_cleared', () => {
        console.log('All participants cleared');
        participants = [];
        currentTeams = [];
        renderParticipants();
        hideTeams();
        showNotification('Cleared', 'All participants have been cleared', 'info');
    });

    socket.on('error', (error) => {
        console.error('Socket error:', error);
        setGeneratingState(false);
        showNotification('Error', error.message || 'An error occurred', 'error');
    });

    // Event listeners
    generateTeamsBtn.addEventListener('click', handleGenerateTeams);
    clearAllBtn.addEventListener('click', handleClearAll);
    
    numTeamsInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleGenerateTeams();
        }
    });

    // Auto-enable generate button when conditions are met
    numTeamsInput.addEventListener('input', updateGenerateButtonState);

    // Functions
    function addParticipant(name) {
        if (!participants.includes(name)) {
            participants.push(name);
            renderParticipants();
        }
    }

    function renderParticipants() {
        participantCount.textContent = participants.length;
        
        if (participants.length === 0) {
            noParticipants.classList.remove('hidden');
            participantsList.innerHTML = '';
            participantsList.appendChild(noParticipants);
        } else {
            noParticipants.classList.add('hidden');
            participantsList.innerHTML = '';
            
            participants.forEach((name, index) => {
                const participantDiv = document.createElement('div');
                participantDiv.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-slideIn';
                participantDiv.style.animationDelay = `${index * 0.05}s`;
                
                participantDiv.innerHTML = `
                    <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            ${name.charAt(0).toUpperCase()}
                        </div>
                        <span class="text-gray-900 font-medium">${escapeHtml(name)}</span>
                    </div>
                    <span class="text-gray-400 text-sm">#${index + 1}</span>
                `;
                
                participantsList.appendChild(participantDiv);
            });
        }
        
        updateGenerateButtonState();
    }

    function handleGenerateTeams() {
        const numTeams = parseInt(numTeamsInput.value);
        
        if (!numTeams || numTeams < 1) {
            showNotification('Invalid Input', 'Please enter a valid number of teams', 'error');
            numTeamsInput.focus();
            return;
        }

        if (participants.length === 0) {
            showNotification('No Participants', 'Add some participants before generating teams', 'error');
            return;
        }

        if (numTeams > participants.length) {
            showNotification('Too Many Teams', `Cannot create ${numTeams} teams with only ${participants.length} participants`, 'error');
            return;
        }

        setGeneratingState(true);
        socket.emit('generate_teams', { numTeams });
    }

    function handleClearAll() {
        if (participants.length === 0) {
            showNotification('Nothing to Clear', 'There are no participants to clear', 'info');
            return;
        }

        if (confirm(`Are you sure you want to clear all ${participants.length} participants? This action cannot be undone.`)) {
            fetch('/api/participants', { method: 'DELETE' })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // The socket event will handle UI updates
                    } else {
                        showNotification('Error', 'Failed to clear participants', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error clearing participants:', error);
                    showNotification('Error', 'Network error while clearing participants', 'error');
                });
        }
    }

    function renderTeams(teams, totalParticipants) {
        noTeams.classList.add('hidden');
        teamsGrid.classList.remove('hidden');
        teamsInfo.classList.remove('hidden');
        
        totalParticipantsCount.textContent = totalParticipants;
        totalTeamsCount.textContent = teams.length;
        
        teamsGrid.innerHTML = '';
        
        const teamColors = [
            'from-blue-500 to-blue-600',
            'from-green-500 to-green-600',
            'from-purple-500 to-purple-600',
            'from-red-500 to-red-600',
            'from-yellow-500 to-yellow-600',
            'from-indigo-500 to-indigo-600',
            'from-pink-500 to-pink-600',
            'from-teal-500 to-teal-600'
        ];

        teams.forEach((team, index) => {
            const colorClass = teamColors[index % teamColors.length];
            
            const teamCard = document.createElement('div');
            teamCard.className = 'team-card bg-white rounded-xl shadow-sm border p-6 animate-fadeIn';
            teamCard.style.animationDelay = `${index * 0.1}s`;
            
            teamCard.innerHTML = `
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">Team ${team.teamNumber}</h3>
                    <div class="bg-gradient-to-r ${colorClass} text-white px-3 py-1 rounded-full text-sm font-medium">
                        ${team.members.length} ${team.members.length === 1 ? 'member' : 'members'}
                    </div>
                </div>
                <div class="space-y-2">
                    ${team.members.map((member, memberIndex) => `
                        <div class="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                            <div class="w-8 h-8 bg-gradient-to-r ${colorClass} rounded-full flex items-center justify-center text-white text-sm font-medium">
                                ${member.charAt(0).toUpperCase()}
                            </div>
                            <span class="text-gray-900 font-medium">${escapeHtml(member)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            
            teamsGrid.appendChild(teamCard);
        });
    }

    function hideTeams() {
        noTeams.classList.remove('hidden');
        teamsGrid.classList.add('hidden');
        teamsInfo.classList.add('hidden');
        teamsGrid.innerHTML = '';
    }

    function setGeneratingState(generating) {
        generateTeamsBtn.disabled = generating;
        
        if (generating) {
            generateBtnText.textContent = 'Generating...';
            generateSpinner.classList.remove('hidden');
        } else {
            generateBtnText.textContent = 'Sort into Teams';
            generateSpinner.classList.add('hidden');
        }
    }

    function updateGenerateButtonState() {
        const numTeams = parseInt(numTeamsInput.value);
        const hasParticipants = participants.length > 0;
        const validTeamCount = numTeams && numTeams >= 1 && numTeams <= participants.length;
        
        generateTeamsBtn.disabled = !hasParticipants || !validTeamCount;
    }

    function updateConnectionStatus(connected) {
        const statusDiv = connectionStatus.querySelector('div');
        const statusText = connectionStatus.querySelector('span');
        
        if (connected) {
            statusDiv.className = 'w-3 h-3 bg-green-400 rounded-full animate-pulse';
            statusText.textContent = 'Connected';
        } else {
            statusDiv.className = 'w-3 h-3 bg-red-400 rounded-full';
            statusText.textContent = 'Disconnected';
        }
    }

    function showNotification(title, message, type = 'info') {
        const notification = document.getElementById('notification');
        const icon = document.getElementById('notificationIcon');
        const titleEl = document.getElementById('notificationTitle');
        const messageEl = document.getElementById('notificationMessage');
        
        // Set icon based on type
        const icons = {
            success: '<div class="bg-green-100 rounded-full p-2"><svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg></div>',
            error: '<div class="bg-red-100 rounded-full p-2"><svg class="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg></div>',
            info: '<div class="bg-blue-100 rounded-full p-2"><svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg></div>'
        };
        
        icon.innerHTML = icons[type] || icons.info;
        titleEl.textContent = title;
        messageEl.textContent = message;
        
        notification.classList.remove('hidden');
        notification.classList.add('animate-fadeIn');
        
        // Auto-hide after 4 seconds
        setTimeout(() => {
            notification.classList.add('hidden');
            notification.classList.remove('animate-fadeIn');
        }, 4000);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});