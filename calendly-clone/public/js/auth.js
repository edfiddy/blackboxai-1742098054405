// Show authentication modal
function showAuthModal(type = 'login') {
    const authModal = document.getElementById('authModal');
    const authModalContent = document.getElementById('authModalContent');
    
    authModalContent.innerHTML = type === 'login' ? getLoginForm() : getRegisterForm();
    authModal.classList.remove('hidden');
}

// Hide authentication modal
function hideAuthModal() {
    const authModal = document.getElementById('authModal');
    authModal.classList.add('hidden');
}

// Get login form HTML
function getLoginForm() {
    return `
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Login to Your Account</h2>
        <form onsubmit="handleLogin(event)" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" name="email" required
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Password</label>
                <input type="password" name="password" required
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            </div>
            <div class="flex items-center justify-between">
                <button type="submit" 
                    class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    Login
                </button>
                <button type="button" onclick="showAuthModal('register')"
                    class="text-blue-500 hover:text-blue-700">
                    Need an account?
                </button>
            </div>
        </form>
    `;
}

// Get registration form HTML
function getRegisterForm() {
    return `
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Create an Account</h2>
        <form id="registerForm" onsubmit="handleRegister(event)" novalidate class="space-y-4">
            <div id="formErrors" class="hidden bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"></div>
            <div>
                <label class="block text-sm font-medium text-gray-700" for="name">Name</label>
                <input type="text" name="name" id="name" required minlength="2"
                    class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    autocomplete="name" value="">
                <div class="error-message hidden text-red-500 text-sm mt-1"></div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700" for="email">Email</label>
                <input type="email" name="email" id="email" required 
                    pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                    class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    autocomplete="email" value="">
                <div class="error-message hidden text-red-500 text-sm mt-1"></div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700" for="password">Password</label>
                <input type="password" name="password" id="password" required minlength="6"
                    class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    autocomplete="new-password" value="">
                <div class="error-message hidden text-red-500 text-sm mt-1"></div>
            </div>
            <div class="flex items-center justify-between">
                <button type="submit" 
                    class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    Register
                </button>
                <button type="button" onclick="showAuthModal('login')"
                    class="text-blue-500 hover:text-blue-700">
                    Already have an account?
                </button>
            </div>
        </form>
    `;
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: formData.get('email'),
                password: formData.get('password')
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            hideAuthModal();
            updateNavigation();
            showDashboard();
        } else {
            showError(data.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('An error occurred during login. Please try again.');
    }
}

// Handle registration form submission
async function handleRegister(event) {
    event.preventDefault();
    
    // Reset all error messages and styles
    const form = event.target;
    const formErrors = document.getElementById('formErrors');
    formErrors.textContent = '';
    formErrors.classList.add('hidden');
    
    const errorMessages = form.querySelectorAll('.error-message');
    errorMessages.forEach(el => {
        el.textContent = '';
        el.classList.add('hidden');
    });
    
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        input.classList.remove('border-red-500');
    });

    // Get form data
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;

    // Validate inputs
    const errors = [];

    if (!name || name.length < 2) {
        errors.push('Name must be at least 2 characters');
        showFieldError('name', 'Name must be at least 2 characters');
    }

    if (!email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        errors.push('Please enter a valid email address');
        showFieldError('email', 'Please enter a valid email address');
    }

    if (!password || password.length < 6) {
        errors.push('Password must be at least 6 characters');
        showFieldError('password', 'Password must be at least 6 characters');
    }

    if (errors.length > 0) {
        formErrors.textContent = errors.join('. ');
        formErrors.classList.remove('hidden');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                password
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            hideAuthModal();
            updateNavigation();
            showDashboard();
        } else {
            showError(data.message || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('An error occurred during registration. Please try again.');
    }
}

function showFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorDiv = input.parentNode.querySelector('.error-message');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    input.classList.add('border-red-500');
}

function hideFieldError(fieldId) {
    const input = document.getElementById(fieldId);
    const errorDiv = input.parentNode.querySelector('.error-message');
    errorDiv.textContent = '';
    errorDiv.classList.add('hidden');
    input.classList.remove('border-red-500');
}

// Handle logout
async function handleLogout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        currentUser = null;
        updateNavigation();
        showLandingPage();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Show error message in modal
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4';
    errorDiv.textContent = message;
    
    const form = document.querySelector('#authModalContent form');
    form.insertAdjacentElement('beforebegin', errorDiv);
    
    setTimeout(() => errorDiv.remove(), 5000);
}
