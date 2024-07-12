document.addEventListener('DOMContentLoaded', () => {
    const editProfileForm = document.getElementById('edit-profile-form');
    const userInfo = document.getElementById('user-info');
    const logoutLink = document.getElementById('logout-link');

    let currentDescription = '';

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    const username = getCookie('username');
    if (!username) {
        userInfo.innerHTML = `<p>Error: No user logged in.</p>`;
        return;
    }

    fetch(`/api/user-profile?username=${username}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                userInfo.innerHTML = `<p>${data.error}</p>`;
            } else {
                const user = data.user;
                currentDescription = user.description; // Store the current description
                userInfo.innerHTML = `
                    <div class="profile-header">
                        <img src="${user.image}" alt="${user.username}">
                        <div class="profile-details">
                            <h2>${user.username}</h2>
                            <p>${user.description}</p>
                        </div>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error fetching user profile:', error);
            userInfo.innerHTML = `<p>Error loading user profile.</p>`;
        });

    editProfileForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const image = document.getElementById('profile-picture').files[0];
        let description = document.getElementById('description').value.trim();

        // Use current description if the new description is empty
        if (!description) {
            description = currentDescription;
        }

        // Validation: Check if an image is attached or description is provided
        if (!image && description === currentDescription) {
            alert('Please provide a new image or description to update your profile.');
            return;
        }

        const formData = new FormData();
        if (image) {
            formData.append('image', image);
        }
        if (description) {
            formData.append('description', description);
        }

        fetch('/api/update-profile', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Profile updated successfully!');
                location.reload();
            } else {
                alert('Error updating profile: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error updating profile:', error);
            alert('Error updating profile.');
        });
    });

    logoutLink.addEventListener('click', (event) => {
        event.preventDefault();
        logout();
    });

    function logout() {
        fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
                window.location.href = '/';
            } else {
                console.error('Logout failed:', data.message);
            }
        })
        .catch(error => console.error('Error during logout:', error));
    }
});
