document.addEventListener('DOMContentLoaded', () => {
    const mainNav = document.getElementById('main-nav');
    const loggedInNav = document.getElementById('logged-in-nav');
    const userGreeting = document.getElementById('user-greeting');
    const logoutLink = document.getElementById('logout-link');
    const viewLink = document.getElementById('view-link');
    const viewProfile = document.getElementById('view-profile');

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    async function fetchEstablishmentByUsername(username) {
        const response = await fetch(`/api/establishments?username=${username}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const establishments = await response.json();
        return establishments.length > 0 ? establishments[0] : null;
    }

    async function checkLoginStatus() {
        const username = getCookie('username');
        if (username) {
            mainNav.style.display = 'none';
            loggedInNav.style.display = 'grid';
            userGreeting.innerText = `Hello, ${username}!`;

            const establishment = await fetchEstablishmentByUsername(username);
            if (establishment) {
                viewLink.href = `/establishment?id=${establishment._id}`;
                viewProfile.href = `/establishment?id=${establishment._id}`;
            } else {
                viewLink.href = '/profile';
                viewProfile.href = '/profile';
            }
        } else {
            mainNav.style.display = 'flex';
            loggedInNav.style.display = 'none';
        }
    }

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
                checkLoginStatus();
                window.location.href = '/';
            } else {
                console.error('Logout failed:', data.message);
            }
        })
        .catch(error => console.error('Error during logout:', error));
    }

    logoutLink.addEventListener('click', (event) => {
        event.preventDefault();
        logout();
    });

    checkLoginStatus();
});
