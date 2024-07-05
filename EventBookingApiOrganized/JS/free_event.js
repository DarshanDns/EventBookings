document.addEventListener('DOMContentLoaded', function () {
    const subtractTicket = document.getElementById('subtractTicket');
    const addTicket = document.getElementById('addTicket');
    const ticketCountElement = document.getElementById('ticketCount');
    const totalElement = document.getElementById('ticketTotalAmount');
    const bookBtn = document.getElementById('bookBtn');

    if (!subtractTicket || !addTicket || !ticketCountElement || !totalElement || !bookBtn) {
        console.error('One or more required elements are missing in the DOM.');
        return;
    }

    let ticketCount = 0;

    function updateTotal() {
        totalElement.textContent = `₹0`;
    }

    subtractTicket.addEventListener('click', () => {
        if (ticketCount > 0) {
            ticketCount--;
            ticketCountElement.textContent = ticketCount;
            updateTotal();
        }
    });

    addTicket.addEventListener('click', () => {
        ticketCount++;
        ticketCountElement.textContent = ticketCount;
        updateTotal();
    });

    async function handleBooking() {
        const userId = window.location.pathname.split('/').pop();

        if (ticketCount <= 0) {
            alert('Please select at least one ticket.');
            return;
        }

        const response = await fetch(`/create-free-booking/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tickets: ticketCount,
                eventName: 'Free Event'
            })
        });

        if (!response.ok) {
            console.error('Error creating booking:', await response.text());
            return;
        }

        const bookingData = await response.json();
        alert('Booking successful! Enjoy the event.');
        window.location.href = `/payment-details?orderId=${bookingData.id}&tickets=${ticketCount}&amount=0&currency=INR&status=paid&concertName=Free%20Event&userid=${userId}`;
    }

    bookBtn.addEventListener('click', handleBooking);
});
