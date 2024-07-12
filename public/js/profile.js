document.addEventListener('DOMContentLoaded', async () => {
    const userInfo = document.getElementById('user-info');
    const recentActivities = document.getElementById('recent-activities');
    const logoutLink = document.getElementById('logout-link');

    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    let username = getQueryParam('user');
    if (!username) {
        username = getCookie('username');
        if (!username) {
            userInfo.innerHTML = `<p>Error: No user specified or logged in.</p>`;
            return;
        }
    }

    try {
        const response = await fetch(`/api/user-profile?username=${username}`);
        const data = await response.json();

        if (response.status === 400) {
            userInfo.innerHTML = `<p>Error: No user logged in.</p>`;
        } else if (response.status === 404) {
            userInfo.innerHTML = `<p>User not found.</p>`;
        } else if (response.ok) {
            const { user, reviews } = data;

            userInfo.innerHTML = `
                <div class="profile-header">
                    <img src="${user.image}" alt="${user.username}" style="width: 150px; height: 150px; border-radius: 50%;">
                    <div class="profile-details">
                        <h2>${user.username}</h2>
                        <p>${user.description}</p>
                    </div>
                </div>
            `;

            if (reviews && Array.isArray(reviews) && reviews.length > 0) {
                const establishmentsResponse = await fetch('/api/establishments');
                const establishments = await establishmentsResponse.json();
                const establishmentsMap = establishments.reduce((map, establishment) => {
                    map[establishment._id] = establishment.name;
                    return map;
                }, {});

                reviews.forEach(reviewObj => {
                    reviewObj.reviews.forEach(review => {
                        if (review.user === username) {
                            const establishmentName = establishmentsMap[reviewObj.establishment_id] || 'Unknown';
                            const reviewDiv = document.createElement('div');
                            reviewDiv.className = 'activity';
                            reviewDiv.innerHTML = `
                                <h3>${review.title} <em style="color: grey;">at ${establishmentName}</em></h3>
                                <p>Rating: ${review.rating}</p>
                                <p>${review.text}</p>
                                <p>Helpful: ${review.helpful} | Unhelpful: ${review.unhelpful}</p>
                                ${review.image ? `<img src="${review.image}" alt="Review Image" style="width: 100%; height: auto; border-radius: 5px;">` : ''}
                            `;
                            recentActivities.appendChild(reviewDiv);
                        }
                    });
                });
            } else {
                recentActivities.innerHTML = `<p>No reviews found for this user.</p>`;
            }
        } else {
            userInfo.innerHTML = `<p>${data.error || 'User profile or reviews not found.'}</p>`;
        }
    } catch (err) {
        userInfo.innerHTML = `<p>Error loading user profile: ${err.message}</p>`;
    }

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
