// Show booking page for an event type
function showBookingPage(eventTypeId) {
    mainContent.innerHTML = `
        <div class="max-w-2xl mx-auto">
            <div id="bookingDetails" class="mb-8">Loading...</div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Select Date</h3>
                    <div id="calendar" class="bg-white p-4 rounded-lg shadow"></div>
                </div>
                <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Available Time Slots</h3>
                    <div id="timeSlots" class="space-y-2"></div>
                </div>
            </div>
        </div>
    `;

    loadEventDetails(eventTypeId);
    initializeCalendar(eventTypeId);
}

// Load event type details
async function loadEventDetails(eventTypeId) {
    try {
        const response = await fetch(`/api/events/${eventTypeId}`);
        const data = await response.json();
        
        document.getElementById('bookingDetails').innerHTML = `
            <h2 class="text-2xl font-bold text-gray-900 mb-2">${data.event.title}</h2>
            <p class="text-gray-600 mb-2">${data.event.duration} minutes</p>
            <p class="text-gray-700">${data.event.description || ''}</p>
        `;
    } catch (error) {
        console.error('Error loading event details:', error);
        document.getElementById('bookingDetails').innerHTML = 'Error loading event details';
    }
}

// Initialize calendar
function initializeCalendar(eventTypeId) {
    const calendar = document.getElementById('calendar');
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    renderCalendar(currentMonth, currentYear, eventTypeId);
}

// Render calendar
function renderCalendar(month, year, eventTypeId) {
    const calendar = document.getElementById('calendar');
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    let calendarHTML = `
        <div class="flex justify-between items-center mb-4">
            <button onclick="renderCalendar(${month - 1}, ${year}, '${eventTypeId}')"
                class="text-gray-600 hover:text-gray-900">
                <i class="fas fa-chevron-left"></i>
            </button>
            <h4 class="text-lg font-semibold">${monthNames[month]} ${year}</h4>
            <button onclick="renderCalendar(${month + 1}, ${year}, '${eventTypeId}')"
                class="text-gray-600 hover:text-gray-900">
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
        <div class="grid grid-cols-7 gap-1">
            ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                .map(day => `<div class="text-center text-sm font-medium text-gray-600">${day}</div>`)
                .join('')}
    `;
    
    let day = 1;
    const today = new Date();
    
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 7; j++) {
            if (i === 0 && j < startingDay) {
                calendarHTML += '<div></div>';
            } else if (day > daysInMonth) {
                break;
            } else {
                const date = new Date(year, month, day);
                const isToday = date.toDateString() === today.toDateString();
                const isPast = date < today;
                
                calendarHTML += `
                    <div class="text-center py-2 ${isPast ? 'text-gray-400' : 'cursor-pointer hover:bg-blue-50'} 
                        ${isToday ? 'bg-blue-100' : ''}"
                        ${!isPast ? `onclick="loadTimeSlots('${eventTypeId}', '${date.toISOString()}')"` : ''}
                    >
                        ${day}
                    </div>
                `;
                day++;
            }
        }
    }
    
    calendarHTML += '</div>';
    calendar.innerHTML = calendarHTML;
}

// Load available time slots
async function loadTimeSlots(eventTypeId, date) {
    const timeSlotsDiv = document.getElementById('timeSlots');
    timeSlotsDiv.innerHTML = 'Loading time slots...';
    
    try {
        const response = await fetch(`/api/events/${eventTypeId}/time-slots?date=${date}`);
        const data = await response.json();
        
        if (data.timeSlots.length === 0) {
            timeSlotsDiv.innerHTML = '<p class="text-gray-600">No available time slots for this date.</p>';
            return;
        }
        
        timeSlotsDiv.innerHTML = data.timeSlots
            .map(slot => `
                <button onclick="showBookingForm('${eventTypeId}', '${slot.start}', '${slot.end}')"
                    class="block w-full text-left px-4 py-2 rounded bg-white hover:bg-gray-50 border border-gray-200">
                    ${new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </button>
            `)
            .join('');
    } catch (error) {
        console.error('Error loading time slots:', error);
        timeSlotsDiv.innerHTML = 'Error loading time slots';
    }
}

// Show booking form
function showBookingForm(eventTypeId, startTime, endTime) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center';
    modal.id = 'bookingModal';
    
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Schedule Meeting</h2>
            <form onsubmit="handleBookingSubmit(event, '${eventTypeId}', '${startTime}', '${endTime}')" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Name</label>
                    <input type="text" name="name" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" name="email" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                </div>
                <div class="flex justify-end space-x-4">
                    <button type="button" onclick="closeBookingModal()"
                        class="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">
                        Cancel
                    </button>
                    <button type="submit"
                        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                        Schedule
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Close booking modal
function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.remove();
    }
}

// Handle booking form submission
async function handleBookingSubmit(event, eventTypeId, startTime, endTime) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    try {
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                eventTypeId,
                bookerName: formData.get('name'),
                bookerEmail: formData.get('email'),
                startTime,
                endTime
            })
        });

        if (response.ok) {
            closeBookingModal();
            showBookingConfirmation();
        } else {
            const data = await response.json();
            showBookingError(data.message);
        }
    } catch (error) {
        console.error('Booking error:', error);
        showBookingError('An error occurred. Please try again.');
    }
}

// Show booking confirmation
function showBookingConfirmation() {
    mainContent.innerHTML = `
        <div class="max-w-2xl mx-auto text-center">
            <div class="bg-green-100 rounded-lg p-8">
                <i class="fas fa-check-circle text-green-500 text-5xl mb-4"></i>
                <h2 class="text-2xl font-bold text-gray-900 mb-4">Meeting Scheduled!</h2>
                <p class="text-gray-700 mb-8">
                    You will receive a confirmation email with the meeting details.
                </p>
                <button onclick="showDashboard()"
                    class="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
                    Return to Dashboard
                </button>
            </div>
        </div>
    `;
}

// Show error in booking modal
function showBookingError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4';
    errorDiv.textContent = message;
    
    const form = document.querySelector('#bookingModal form');
    form.insertAdjacentElement('beforebegin', errorDiv);
    
    setTimeout(() => errorDiv.remove(), 5000);
}
