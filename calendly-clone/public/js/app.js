// Global state
let currentUser = null;

// DOM Elements
const navButtons = document.getElementById('navButtons');
const mainContent = document.getElementById('mainContent');
const authModal = document.getElementById('authModal');

// Initialize application
async function initApp() {
    try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateNavigation();
            showDashboard();
        } else {
            showLandingPage();
        }
    } catch (error) {
        console.error('Error initializing app:', error);
        showLandingPage();
    }
}

// Update navigation based on auth state
function updateNavigation() {
    navButtons.innerHTML = currentUser
        ? `
            <span class="mr-4 text-gray-700">Welcome, ${currentUser.name}</span>
            <button onclick="handleLogout()" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                Logout
            </button>
        `
        : `
            <button onclick="showAuthModal('login')" class="text-gray-700 px-4 py-2 rounded hover:bg-gray-100">
                Login
            </button>
            <button onclick="showAuthModal('register')" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ml-4">
                Sign Up
            </button>
        `;
}

// Show landing page for non-authenticated users
function showLandingPage() {
    mainContent.innerHTML = `
        <div class="text-center">
            <h1 class="text-4xl font-bold text-gray-900 mb-4">
                Schedule meetings without the back-and-forth
            </h1>
            <p class="text-xl text-gray-600 mb-8">
                Calendly Clone helps you schedule meetings efficiently by eliminating email chains and phone tag.
            </p>
            <button onclick="showAuthModal('register')" class="bg-blue-500 text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-600">
                Get Started
            </button>
        </div>
    `;
}

// Show dashboard for authenticated users
async function showDashboard() {
    try {
        const [eventsResponse, bookingsResponse] = await Promise.all([
            fetch('/api/events', {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            }),
            fetch('/api/bookings/created', {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            })
        ]);

        const [eventsData, bookingsData] = await Promise.all([
            eventsResponse.json(),
            bookingsResponse.json()
        ]);

        mainContent.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-2xl font-bold text-gray-900">Your Event Types</h2>
                        <button onclick="showCreateEventModal()" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                            <i class="fas fa-plus mr-2"></i>Create Event Type
                        </button>
                    </div>
                    <div id="eventsList" class="space-y-4">
                        ${eventsData.events.map(event => `
                            <div class="bg-white p-4 rounded-lg shadow">
                                <h3 class="text-lg font-semibold text-gray-900">${event.title}</h3>
                                <p class="text-gray-600">${event.duration} minutes</p>
                                <div class="mt-2">
                                    <button onclick="editEvent('${event.id}')" class="text-blue-500 hover:text-blue-700 mr-4">
                                        <i class="fas fa-edit mr-1"></i>Edit
                                    </button>
                                    <button onclick="deleteEvent('${event.id}')" class="text-red-500 hover:text-red-700">
                                        <i class="fas fa-trash mr-1"></i>Delete
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">Upcoming Bookings</h2>
                    <div id="bookingsList" class="space-y-4">
                        ${bookingsData.bookings.map(booking => `
                            <div class="bg-white p-4 rounded-lg shadow">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <h3 class="text-lg font-semibold text-gray-900">${booking.event_title}</h3>
                                        <p class="text-gray-600">${booking.booker_name}</p>
                                        <p class="text-gray-500 text-sm">
                                            ${new Date(booking.start_time).toLocaleString()}
                                        </p>
                                    </div>
                                    <span class="px-2 py-1 rounded text-sm ${
                                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }">
                                        ${booking.status}
                                    </span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading dashboard:', error);
        mainContent.innerHTML = '<p class="text-red-500">Error loading dashboard. Please try again later.</p>';
    }
}

// Helper function to get token from cookie
function getToken() {
    return document.cookie.split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
