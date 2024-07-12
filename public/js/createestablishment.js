document.addEventListener("DOMContentLoaded", function() {
    const registerForm = document.getElementById("register-form");

    registerForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const name = document.getElementById("name").value;
        const type = document.getElementById("type").value;

        if (name.trim() === '') {
            alert("Restaurant name cannot be empty");
            return;
        }

        if (type.trim() === '') {
            alert("Type cannot be empty");
            return;
        }

        const userData = JSON.parse(sessionStorage.getItem('tempUserData'));
        if (!userData) {
            alert('No user data found. Please register again.');
            window.location.href = "/register";
            return;
        }

        const formData = new FormData();
        formData.append('username', userData.username);
        formData.append('password', userData.password);
        formData.append('image', dataURLToBlob(userData.image)); 
        formData.append('description', userData.description);
        formData.append('name', name);
        formData.append('type', type);
        formData.append('rating', 0);

        try {
            const response = await fetch('/api/registerestablishment', { method: 'POST', body: formData });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            if (result.success) {
                alert('Establishment added successfully!');
                window.location.href = "/login";
            } else {
                alert('Registration failed: ' + result.message);
            }
        } catch (err) {
            console.error('Error during establishment registration:', err);
            alert('Registration failed. Please try again.');
        }
    });

    function dataURLToBlob(dataURL) {
        const binary = atob(dataURL.split(',')[1]);
        const array = [];
        for (let i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], { type: 'image/jpeg' });
    }
});
