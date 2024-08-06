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

    const establishmentsList = document.getElementById('establishments-list');
    const ratingFilter = document.getElementById('rating-filter');
    const searchForm = document.querySelector('.search-box');
    const searchInput = document.querySelector('.search-input');

    async function fetchEstablishments() {
        const response = await fetch('/api/establishments');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    }

    function displayEstablishments(establishments) {
        establishmentsList.innerHTML = '';
        if (establishments.length === 0) {
            establishmentsList.innerHTML = '<p>No establishments found.</p>';
            return;
        }
    
        establishments.forEach(establishment => {
            const div = document.createElement('div');
            div.className = 'about box';
            const imageSrc = establishment.image;
    
            div.innerHTML = `
                <div class="about-img">
                    <img src="${imageSrc}" alt="${establishment.name}">
                </div>
                <div class="about-text">
                    <span>${establishment.type}</span>
                    <h2><a href="/establishment?id=${establishment._id}" class="establishment-name">${establishment.name}</a></h2>
                    <p>${establishment.description}</p>
                    <p>Rating: ${establishment.rating}</p>
                    <a href="/establishment?id=${establishment._id}" class="cart-btn">
                        <i class="fas fa-mouse-pointer"></i> Show more
                    </a>
                </div>
            `;
            establishmentsList.appendChild(div);
        });
    }
    
    function filterEstablishments(establishments, searchTerm, ratingValue) {
        console.log("Filtering with rating value:", ratingValue);
    
        return establishments.filter(establishment => {
            const matchesSearch = establishment.name.toLowerCase().includes(searchTerm.toLowerCase());
            const establishmentRating = parseFloat(establishment.rating);
            console.log(`Establishment ${establishment.name} has rating ${establishmentRating}`);
            const matchesRating = ratingValue === 'all' || establishmentRating >= parseFloat(ratingValue);
    
            return matchesSearch && matchesRating;
        });
    }

    async function init() {
        const establishments = await fetchEstablishments();
        displayEstablishments(establishments);

        ratingFilter.addEventListener('change', () => {
            const filteredEstablishments = filterEstablishments(establishments, searchInput.value.trim(), ratingFilter.value);
            displayEstablishments(filteredEstablishments);
        });

        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const filteredEstablishments = filterEstablishments(establishments, searchInput.value.trim(), ratingFilter.value);
            displayEstablishments(filteredEstablishments);
        });
    }

    init();
});
