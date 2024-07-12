document.addEventListener('DOMContentLoaded', async () => {
    const descriptionSelect = document.getElementById('description');
    const passwordField = document.getElementById('password');
    const confirmPasswordField = document.getElementById('confirm-password');
    const loginForm = document.getElementById('login-form');
    const usernameField = document.getElementById('username');
    
    try {
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        const users = await response.json();
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.description;
            option.textContent = user.description;
            descriptionSelect.appendChild(option);
        });
    } catch (err) {
        console.error('Error fetching users:', err);
    }

    descriptionSelect.addEventListener('change', function() {
        if (descriptionSelect.value === "") {
            descriptionSelect.style.color = "#999";
        } else {
            descriptionSelect.style.color = "#333";
        }
    });

    descriptionSelect.style.color = descriptionSelect.value === "" ? "#999" : "#333";

    descriptionSelect.addEventListener('change', async () => {
        const username = usernameField.value.trim();
        const description = descriptionSelect.value.trim();
        
        if (!username) {
            alert('Please enter your username.');
            descriptionSelect.selectedIndex = 0;
            descriptionSelect.style.color = "#999"; 
            return;
        }

        if (username && description) {
            try {
                const response = await fetch(`/api/validate-description?username=${encodeURIComponent(username)}&description=${encodeURIComponent(description)}`);
                if (!response.ok) throw new Error('Failed to validate description');
                const result = await response.json();
                if (result.valid) {
                    passwordField.style.display = 'block';
                    confirmPasswordField.style.display = 'block';
                } else {
                    passwordField.style.display = 'none';
                    confirmPasswordField.style.display = 'none';
                    alert('Description does not match the username.');
                    descriptionSelect.selectedIndex = 0;
                    descriptionSelect.style.color = "#999";
                }
            } catch (err) {
                console.error('Error validating description:', err);
                alert('Error validating description. Please try again.');
            }
        } else {
            alert('Please enter your username and select a description.');
        }
    });

    // Handle form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = usernameField.value.trim();
        const description = descriptionSelect.value.trim();
        const password = passwordField.value;
        const confirmPassword = confirmPasswordField.value;

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        try {
            const response = await fetch('/api/update-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, description, password })
            });

            const result = await response.json();
            if (result.success) {
                alert('Password updated successfully');
                window.location.href = "/login";
            } else {
                alert('Error updating password: ' + result.message);
            }
        } catch (err) {
            console.error('Error updating password:', err);
            alert('Error updating password. Please try again.');
        }
    });
});
