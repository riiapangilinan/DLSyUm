document.addEventListener("DOMContentLoaded", function() {
    const registerForm = document.getElementById("register-form");

    registerForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirm-password").value;
        const image = document.getElementById("profile-picture").files[0];
        const description = document.getElementById("description").value;
        const isRestaurant = document.getElementById("restaurant").checked;

        if (username.trim() === '') {
            alert("Username cannot be empty");
            return;
        }

        if (password.trim() === '') {
            alert("Password cannot be empty");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        const usernameExists = await checkUsernameExists(username);
        if (usernameExists) {
            alert('Username already exists.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function() {
            const profilePictureBase64 = reader.result;

            const userData = { username, password, image: profilePictureBase64, description, isRestaurant };
            if (isRestaurant) {
                sessionStorage.setItem('tempUserData', JSON.stringify(userData));
                alert('Next, please register your establishment.');
                window.location.href = "/createestablishment";
            } else {
                registerUser(userData);
            }
        };
        reader.readAsDataURL(image);
    });

    async function checkUsernameExists(username) {
        try {
            const response = await fetch(`/api/checkusername?username=${encodeURIComponent(username)}`);
            const result = await response.json();
            return result.exists;
        } catch (err) {
            console.error('Error checking username:', err);
            return true;
        }
    }

    async function registerUser(userData) {
        const formData = new FormData();
        formData.append('username', userData.username);
        formData.append('password', userData.password);
        formData.append('image', dataURLToBlob(userData.image));
        formData.append('description', userData.description);

        try {
            const response = await fetch('/api/registeruser', { method: 'POST', body: formData });
            const result = await response.json();
            if (result.success) {
                alert('Registration successful!');
                window.location.href = "/login";
            } else {
                alert('Registration failed: ' + result.message);
            }
        } catch (err) {
            console.error('Error during registration:', err);
            alert('Registration failed. Please try again.');
        }
    }

    function dataURLToBlob(dataURL) {
        const binary = atob(dataURL.split(',')[1]);
        const array = [];
        for (let i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], { type: 'image/jpeg' });
    }
});
