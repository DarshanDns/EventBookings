document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userid');
    const profileButton = document.getElementById('profileButton');
    const bookingsContainer = document.getElementById('bookingsContainer');

    if (!userId) {
        alert("User ID not found. Redirecting to login page.");
        window.location.replace("/login");
        return;
    }

    fetch(`/user/${userId}/bookings`)
        .then(response => response.json())
        .then(bookings => {
            if (bookings.error) {
                alert(bookings.error);
                window.location.replace("/login");
            } else {
                displayBookings(bookings);
            }
        })
        .catch(error => {
            console.error('Error fetching user bookings:', error);
            alert('Error fetching user bookings. Please try again later.');
        });

    profileButton.addEventListener("click", () => {
        window.location.href = `/profile?userid=${userId}`;
    });

    function displayBookings(bookings) {
        bookingsContainer.innerHTML = ''; // Clear previous content

        if (bookings.length === 0) {
            bookingsContainer.innerHTML = '<p>No bookings found.</p>';
            return;
        }

        // Sort bookings in reverse order based on the created_at date
        bookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        bookings.forEach(booking => {
            const bookingElement = document.createElement('div');
            bookingElement.classList.add('booking');

            bookingElement.innerHTML = `
                <h3>Concert: ${booking.concertName}</h3>
                <p>Order ID: ${booking.orderId}</p>
                <p>Payment ID: ${booking.paymentId}</p>
                <p>Amount: ₹${booking.amount}</p>
                <p>Status: ${booking.status}</p>
                <p>Date: ${new Date(booking.created_at).toLocaleString()}</p>
                <button class="download-receipt" data-orderid="${booking.orderId}" data-paymentid="${booking.paymentId}" data-amount="${booking.amount}" data-currency="${booking.currency}" data-status="${booking.status}" data-concertname="${booking.concertName}" data-username="${booking.username}" data-email="${booking.email}">Download Receipt (PDF)</button>
                <button class="download-jpg" data-orderid="${booking.orderId}" data-paymentid="${booking.paymentId}" data-amount="${booking.amount}" data-currency="${booking.currency}" data-status="${booking.status}" data-concertname="${booking.concertName}" data-username="${booking.username}" data-email="${booking.email}">Download Receipt (JPG)</button>
            `;

            bookingsContainer.appendChild(bookingElement);
        });

        document.querySelectorAll('.download-receipt').forEach(button => {
            button.addEventListener('click', () => {
                const orderId = button.getAttribute('data-orderid');
                const paymentId = button.getAttribute('data-paymentid');
                const amount = button.getAttribute('data-amount');
                const currency = button.getAttribute('data-currency');
                const status = button.getAttribute('data-status');
                const concertName = button.getAttribute('data-concertname');
                const username = button.getAttribute('data-username');
                const email = button.getAttribute('data-email');

                const queryString = `orderId=${orderId}&paymentId=${paymentId}&amount=${amount}&currency=${currency}&status=${status}&concertName=${concertName}&username=${username}&email=${email}`;
                window.open(`/download-receipt?${queryString}`, '_blank');
            });
        });

        document.querySelectorAll('.download-jpg').forEach(button => {
            button.addEventListener('click', () => {
                const orderId = button.getAttribute('data-orderid');
                const paymentId = button.getAttribute('data-paymentid');
                const amount = button.getAttribute('data-amount');
                const currency = button.getAttribute('data-currency');
                const status = button.getAttribute('data-status');
                const concertName = button.getAttribute('data-concertname');
                const username = button.getAttribute('data-username');
                const email = button.getAttribute('data-email');

                const queryString = `orderId=${orderId}&paymentId=${paymentId}&amount=${amount}&currency=${currency}&status=${status}&concertName=${concertName}&username=${username}&email=${email}`;
                window.open(`/download-receipt-jpg?${queryString}`, '_blank');
            });
        });
    }
});
