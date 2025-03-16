// Show create/edit event modal
function showEventModal(event = null) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center';
    modal.id = 'eventModal';
    
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">
                ${event ? 'Edit Event Type' : 'Create Event Type'}
            </h2>
            <form onsubmit="handleEventSubmit(event, '${event?.id || ''}')" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Title</label>
                    <input type="text" name="title" required value="${event?.title || ''}"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                    <select name="duration" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        ${[15, 30, 45, 60].map(d => `
                            <option value="${d}" ${event?.duration === d ? 'selected' : ''}>
                                ${d} minutes
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Description</label>
                    <textarea name="description" rows="3"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >${event?.description || ''}</textarea>
                </div>
                <div class="flex justify-end space-x-4">
                    <button type="button" onclick="closeEventModal()"
                        class="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">
                        Cancel
                    </button>
                    <button type="submit"
                        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                        ${event ? 'Update' : 'Create'}
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Close event modal
function closeEventModal() {
    const modal = document.getElementById('eventModal');
    if (modal) {
        modal.remove();
    }
}

// Handle event form submission
async function handleEventSubmit(event, eventId = '') {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    try {
        const response = await fetch(`/api/events${eventId ? `/${eventId}` : ''}`, {
            method: eventId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                title: formData.get('title'),
                duration: parseInt(formData.get('duration')),
                description: formData.get('description')
            })
        });

        if (response.ok) {
            closeEventModal();
            showDashboard();
        } else {
            const data = await response.json();
            showEventError(data.message);
        }
    } catch (error) {
        console.error('Event submission error:', error);
        showEventError('An error occurred. Please try again.');
    }
}

// Delete event
async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event type?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/events/${eventId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (response.ok) {
            showDashboard();
        } else {
            const data = await response.json();
            alert(data.message);
        }
    } catch (error) {
        console.error('Delete event error:', error);
        alert('An error occurred while deleting the event.');
    }
}

// Show availability modal
function showAvailabilityModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center';
    modal.id = 'availabilityModal';
    
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-lg w-full">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Set Your Availability</h2>
            <form onsubmit="handleAvailabilitySubmit(event)" class="space-y-6">
                <div id="availabilityFields">
                    ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, index) => `
                        <div class="flex items-center space-x-4 mb-4">
                            <label class="w-24 text-sm font-medium text-gray-700">${day}</label>
                            <input type="time" name="start_${index}" required
                                class="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                            <span class="text-gray-500">to</span>
                            <input type="time" name="end_${index}" required
                                class="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        </div>
                    `).join('')}
                </div>
                <div class="flex justify-end space-x-4">
                    <button type="button" onclick="closeAvailabilityModal()"
                        class="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">
                        Cancel
                    </button>
                    <button type="submit"
                        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                        Save Availability
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    loadCurrentAvailability();
}

// Load current availability
async function loadCurrentAvailability() {
    try {
        const response = await fetch('/api/events/availability', {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (response.ok) {
            const { availability } = await response.json();
            availability.forEach(slot => {
                const startInput = document.querySelector(`[name="start_${slot.day_of_week}"]`);
                const endInput = document.querySelector(`[name="end_${slot.day_of_week}"]`);
                if (startInput && endInput) {
                    startInput.value = slot.start_time;
                    endInput.value = slot.end_time;
                }
            });
        }
    } catch (error) {
        console.error('Error loading availability:', error);
    }
}

// Close availability modal
function closeAvailabilityModal() {
    const modal = document.getElementById('availabilityModal');
    if (modal) {
        modal.remove();
    }
}

// Handle availability form submission
async function handleAvailabilitySubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const availability = [];
    
    for (let i = 0; i < 5; i++) {
        availability.push({
            dayOfWeek: i,
            startTime: formData.get(`start_${i}`),
            endTime: formData.get(`end_${i}`)
        });
    }
    
    try {
        const response = await fetch('/api/events/availability', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ availabilities: availability })
        });

        if (response.ok) {
            closeAvailabilityModal();
            showDashboard();
        } else {
            const data = await response.json();
            showAvailabilityError(data.message);
        }
    } catch (error) {
        console.error('Availability submission error:', error);
        showAvailabilityError('An error occurred. Please try again.');
    }
}

// Show error in modal
function showEventError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4';
    errorDiv.textContent = message;
    
    const form = document.querySelector('#eventModal form');
    form.insertAdjacentElement('beforebegin', errorDiv);
    
    setTimeout(() => errorDiv.remove(), 5000);
}

function showAvailabilityError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4';
    errorDiv.textContent = message;
    
    const form = document.querySelector('#availabilityModal form');
    form.insertAdjacentElement('beforebegin', errorDiv);
    
    setTimeout(() => errorDiv.remove(), 5000);
}
