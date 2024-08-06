document.addEventListener('DOMContentLoaded', () => {
    const mainNav = document.getElementById('main-nav');
    const loggedInNav = document.getElementById('logged-in-nav');
    const userGreeting = document.getElementById('user-greeting');
    const logoutLink = document.getElementById('logout-link');
    const reviewFormContainer = document.getElementById('review-form-container');
    const reviewsList = document.getElementById('reviews-list');
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
                reviewFormContainer.style.display = 'none'; 
                viewLink.href = `/establishment?id=${establishment._id}`;
                viewProfile.href = `/establishment?id=${establishment._id}`;
            } else {
                reviewFormContainer.style.display = 'block';
                viewLink.href = '/profile';
                viewProfile.href = '/profile';
            }
        } else {
            mainNav.style.display = 'flex';
            loggedInNav.style.display = 'none';
            reviewFormContainer.style.display = 'none';
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

    const establishmentInfo = document.getElementById('establishment-info');

    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    async function fetchEstablishment(id) {
        const response = await fetch(`/api/establishments/${id}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    }

    async function fetchReviews(id) {
        const response = await fetch(`/api/reviews/${id}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    }

    async function fetchOwnerName(establishmentId) {
        const establishment = await fetchEstablishment(establishmentId);
        return establishment ? establishment.name : '';
    }

    function displayEstablishment(establishment) {
        establishmentInfo.innerHTML = `
            <div class="establishment-header">
                <img src="${establishment.image}" alt="${establishment.name}">
                <div class="establishment-details">
                    <h2>${establishment.name}</h2>
                    <p>Type: ${establishment.type}</p>
                    <p>Rating: ${establishment.rating}</p>
                    <p>${establishment.description}</p>
                </div>
            </div>
        `;
    }

    async function editReview(establishmentId, username, title, rating, text, image) {
        rating = parseInt(rating);
        if (isNaN(rating) || rating < 1 || rating > 5) {
            alert('Rating must be a number between 1 and 5');
            return;
        }
    
        try {
            const response = await fetch(`/api/reviews/${establishmentId}/${username}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, rating, text, image })
            });
    
            const data = await response.json();
            if (data.success) {
                alert('Review updated successfully');
                location.reload();
            } else {
                alert('Failed to update review: ' + data.error);
            }
        } catch (error) {
            console.error('Error editing review:', error);
        }
    }
    
    async function deleteReview(establishmentId, username, title, text) {
        try {
            const response = await fetch(`/api/reviews/${establishmentId}/${username}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, text })
            });
    
            const data = await response.json();
            if (data.success) {
                alert('Review deleted successfully');
                location.reload();
            } else {
                alert('Failed to delete review: ' + data.error);
            }
        } catch (error) {
            console.error('Error deleting review:', error);
        }
    }

    async function replyToReview(establishmentId, username, title, text) {
        try {
            const response = await fetch(`/api/reviews/${establishmentId}/${username}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, text }),
            });
    
            const data = await response.json();
            if (response.ok) {
                alert('Reply added successfully');
                location.reload();
            } else {
                alert('Failed to add reply: ' + data.error);
            }
        } catch (error) {
            console.error('Error adding reply:', error);
            alert('Failed to add reply. Please try again.');
        }
    }
    

    function displayReviews(reviews, username, isEstablishmentOwner) {
        if (!reviews || reviews.length === 0) {
            reviewsList.innerHTML = '<p>No reviews found.</p>';
            return;
        }
    
        reviews.forEach(reviewObj => {
            reviewObj.reviews.forEach(async review => {
                const ownerName = isEstablishmentOwner ? await fetchOwnerName(reviewObj.establishment_id) : '';

                const reviewDiv = document.createElement('div');
                reviewDiv.className = 'review';
                reviewDiv.innerHTML = `
                    <p><strong><a href="/profile?user=${review.user}" class="review-user">${review.user}</a></strong>
                    <span class="helpful-buttons">
                        <button class="helpful-btn ${localStorage.getItem(`helpful-${review._id}`) ? 'clicked' : ''}"><i class="far fa-thumbs-up"></i></button> 
                        <span class="helpful-count">${review.helpful}</span>
                        <button class="unhelpful-btn ${localStorage.getItem(`unhelpful-${review._id}`) ? 'clicked' : ''}"><i class="far fa-thumbs-down"></i></button>
                        <span class="unhelpful-count">${review.unhelpful}</span>
                    </span></p>
                    <p><strong>${review.title}</strong></p>
                    <p>Rating: ${review.rating}</p>
                    <p class="review-text">${review.text}</p>
                    ${review.image ? `<img src="${review.image}" alt="Review Image">` : ''}
                `;

                review.replies.forEach(reply => {
                    if (reply.text) {
                        reviewDiv.innerHTML += `
                            <div class="review-reply-container">
                                <p><strong>Reply from <a href="#" class="reply-user" data-user="${ownerName}">${ownerName}</a></strong></p>
                                <p class="review-reply">${reply.text}</p>
                            </div>
                        `;
                    }
                });                

                if (username === review.user) {
                    reviewDiv.innerHTML += `
                        <div class="review-actions">
                            <a href="#" class="edit-review-link" data-user="${review.user}">Edit</a> |
                            <a href="#" class="delete-review-link" data-user="${review.user}">Delete</a>
                        </div>
                    `;
                    reviewDiv.querySelector('.edit-review-link').addEventListener('click', (event) => {
                        event.preventDefault();
                        const user = event.target.getAttribute('data-user');
                        const newTitle = prompt('Enter new title', review.title);
                        const newRating = prompt('Enter new rating', review.rating);
                        const newText = prompt('Enter new review text', review.text);
                        editReview(reviewObj.establishment_id, user, newTitle, newRating, newText, review.image);
                    });
                
                    reviewDiv.querySelector('.delete-review-link').addEventListener('click', (event) => {
                        event.preventDefault();
                        const user = event.target.getAttribute('data-user');
                        const title = review.title;
                        const text = review.text;
                        if (confirm('Are you sure you want to delete this review?')) {
                            deleteReview(reviewObj.establishment_id, user, title, text);
                        }
                    });
                } else if(isEstablishmentOwner){
                    reviewDiv.innerHTML += `
                        <div class="review-actions">
                            <strong><a href="#" class="reply-link" data-user="${review.user}">Reply</a></strong>
                        </div>
                    `;
                }
    
                reviewsList.appendChild(reviewDiv);
    
                if (isEstablishmentOwner) {
                    reviewDiv.querySelector('.reply-link').addEventListener('click', (event) => {
                        event.preventDefault();
                        const user = event.target.getAttribute('data-user');
                        const title = review.title;
                        const text = prompt('Enter your reply:');
                        if (text) {
                            replyToReview(reviewObj.establishment_id, user, title, text);
                        }
                    });
                }
            });
        });

        function setButtonStates() {
            document.querySelectorAll('.helpful-btn').forEach(button => {
                const reviewId = button.closest('.review').querySelector('.review-user').innerText;
                if (localStorage.getItem(`helpful-${reviewId}`)) {
                    button.classList.add('clicked');
                } else {
                    button.classList.remove('clicked');
                }
            });
    
            document.querySelectorAll('.unhelpful-btn').forEach(button => {
                const reviewId = button.closest('.review').querySelector('.review-user').innerText;
                if (localStorage.getItem(`unhelpful-${reviewId}`)) {
                    button.classList.add('clicked');
                } else {
                    button.classList.remove('clicked');
                }
            });
        }
    
        setButtonStates();

        document.querySelectorAll('.helpful-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const username = getCookie('username');
                if (!username) {
                    alert('Please log in first.');
                    return;
                }
                
                const reviewDiv = event.target.closest('.review');
                const establishmentId = getQueryParam('id');
                const reviewId = reviewDiv.querySelector('.review-user').innerText;
                const isClicked = localStorage.getItem(`helpful-${reviewId}`);
                
                if (localStorage.getItem(`unhelpful-${reviewId}`)) {
                    await fetch(`/api/reviews/${establishmentId}/${reviewId}/unhelpful`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    localStorage.removeItem(`unhelpful-${reviewId}`);
                    reviewDiv.querySelector('.unhelpful-btn').classList.remove('clicked');
                }
    
                try {
                    let response;
                    if (isClicked) {
                        response = await fetch(`/api/reviews/${establishmentId}/${reviewId}/helpful`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' }
                        });
                        localStorage.removeItem(`helpful-${reviewId}`);
                        button.classList.remove('clicked');
                    } else {
                        response = await fetch(`/api/reviews/${establishmentId}/${reviewId}/helpful`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' }
                        });
                        localStorage.setItem(`helpful-${reviewId}`, 'true');
                        button.classList.add('clicked');
                    }
    
                    if (response.ok) {
                        const updatedData = await response.json();
                        reviewDiv.querySelector('.helpful-count').textContent = updatedData.helpful;
                        reviewDiv.querySelector('.unhelpful-count').textContent = updatedData.unhelpful;
                        location.reload();
                    } else {
                        const errorData = await response.json();
                        alert(`Failed to update helpful count: ${errorData.error}`);
                    }
                } catch (error) {
                    console.error('Error updating helpful count:', error);
                    alert('Failed to update helpful count. Please try again.');
                }
            });
        });
    
        document.querySelectorAll('.unhelpful-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const username = getCookie('username');
                if (!username) {
                    alert('Please log in first.');
                    return;
                }
                
                const reviewDiv = event.target.closest('.review');
                const establishmentId = getQueryParam('id');
                const reviewId = reviewDiv.querySelector('.review-user').innerText;
                const isClicked = localStorage.getItem(`unhelpful-${reviewId}`);
                
                if (localStorage.getItem(`helpful-${reviewId}`)) {
                    await fetch(`/api/reviews/${establishmentId}/${reviewId}/helpful`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    localStorage.removeItem(`helpful-${reviewId}`);
                    reviewDiv.querySelector('.helpful-btn').classList.remove('clicked');
                }
    
                try {
                    let response;
                    if (isClicked) {
                        response = await fetch(`/api/reviews/${establishmentId}/${reviewId}/unhelpful`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' }
                        });
                        localStorage.removeItem(`unhelpful-${reviewId}`);
                        button.classList.remove('clicked');
                    } else {
                        response = await fetch(`/api/reviews/${establishmentId}/${reviewId}/unhelpful`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' }
                        });
                        localStorage.setItem(`unhelpful-${reviewId}`, 'true');
                        button.classList.add('clicked');
                    }
    
                    if (response.ok) {
                        const updatedData = await response.json();
                        reviewDiv.querySelector('.helpful-count').textContent = updatedData.helpful;
                        reviewDiv.querySelector('.unhelpful-count').textContent = updatedData.unhelpful;
                        location.reload();
                    } else {
                        const errorData = await response.json();
                        alert(`Failed to update unhelpful count: ${errorData.error}`);
                    }
                } catch (error) {
                    console.error('Error updating unhelpful count:', error);
                    alert('Failed to update unhelpful count. Please try again.');
                }
            });
        });
    }

    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('reply-user')) {
            event.preventDefault();
            window.location.href = window.location.href;
        }
    });

    document.getElementById('review-form').addEventListener('submit', async function(event) {
        event.preventDefault();
    
        const establishmentId = getQueryParam('id');
        const title = document.getElementById('review-title').value;
        const text = document.getElementById('review-body').value; 
        const rating = document.getElementById('review-rating').value;
        const image = document.getElementById('review-media').files[0]; 
    
        const formData = new FormData();
        formData.append('title', title);
        formData.append('text', text); 
        formData.append('rating', rating);
        if (image) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const dataURL = e.target.result;
                const blob = dataURLToBlob(dataURL);
                formData.append('image', blob);
                submitFormData(formData, establishmentId);
            };
            reader.readAsDataURL(image);
        } else {
            submitFormData(formData, establishmentId);
        }
    });
    
    async function submitFormData(formData, establishmentId) {
        try {
            const response = await fetch(`/api/reviews/${establishmentId}`, {
                method: 'POST',
                body: formData
            });
    
            if (response.ok) {
                alert('Review submitted!');
                window.location.href = `/establishment?id=${establishmentId}`;
            } else {
                const errorData = await response.json();
                alert(`Failed to submit review: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Failed to submit review. Please try again.');
        }
    }
    async function init() {
        const establishmentId = getQueryParam('id');
        if (establishmentId) {
            try {
                const establishment = await fetchEstablishment(establishmentId);
                displayEstablishment(establishment);
                const reviews = await fetchReviews(establishmentId);
                const username = getCookie('username');
                const isEstablishmentOwner = establishment.username === username;
                displayReviews(reviews, username, isEstablishmentOwner);
            } catch (error) {
                console.error('Error fetching establishment or reviews:', error);
            }
        } else {
            establishmentInfo.innerHTML = '<p>Establishment ID not provided in the URL.</p>';
        }
    }

    init();

    function dataURLToBlob(dataURL) {
        const binary = atob(dataURL.split(',')[1]);
        const array = [];
        for (let i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], { type: 'image/jpeg' });
    }
});
