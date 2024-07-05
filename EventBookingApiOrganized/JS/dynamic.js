document.addEventListener('DOMContentLoaded', async function () {
    const eventId = new URLSearchParams(window.location.search).get('eventId');
    const userId = new URLSearchParams(window.location.search).get('userId');
    const eventDetails = await fetchEventDetails(eventId);

    if (eventDetails) {
        displayEventDetails(eventDetails);
        setupTicketBooking(eventDetails);
    } else {
        console.error('Failed to load event details');
    }
});

async function fetchEventDetails(eventId) {
    try {
        const response = await fetch(`http://localhost:3000/api/events/${eventId}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching event details:', error);
        return null;
    }
}

function displayEventDetails(event) {
    document.getElementById('eventImage').src = event.image;
    document.getElementById('eventTitle').textContent = event.title;
    document.getElementById('eventDescription').textContent = event.description;
    document.getElementById('eventTime').textContent = event.time;
    document.getElementById('eventVenue').textContent = event.venue;
    document.getElementById('aboutEvent').textContent = event.about;
    document.getElementById('bookingTitle').textContent = event.title;
    document.getElementById('cardSubtitle').textContent = `${event.title} Tickets`;
    document.getElementById('cardLocation').textContent = event.venue;
    document.getElementById('cardDate').textContent = event.date;
}

function setupTicketBooking(event) {
    const subtractTicket = document.getElementById('subtractTicket');
    const addTicket = document.getElementById('addTicket');
    const ticketCountElement = document.getElementById('ticketCount');
    const totalElement = document.getElementById('ticketTotalAmount');
    const payBtn = document.getElementById('payBtn');

    let ticketCount = 0;
    const ticketPrice = event.price;

    function updateTotal() {
        const total = ticketCount * ticketPrice;
        totalElement.textContent = `₹${total}`;
        document.getElementById('charges1').textContent = `₹${total}`;
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

    async function handlePayment() {
        // const userId = window.location.pathname.split('/').pop();
        const userId = new URLSearchParams(window.location.search).get('userId');
        const totalAmount = parseInt(totalElement.textContent.slice(1));

        if (totalAmount <= 0) {
            alert('Please select at least one ticket.');
            return;
        }

        const response = await fetch(`/create-order/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: totalAmount,
                concertName: event.title
            })
        });

        if (!response.ok) {
            console.error('Error creating order:', await response.text());
            return;
        }

        const orderData = await response.json();

        const options = {
            key: 'rzp_test_bcr3VPyl56DHa1',
            amount: orderData.amount,
            currency: orderData.currency,
            order_id: orderData.id,
            name: event.title,
            description: 'Tickets',
            handler: async function (response) {
                const verifyResponse = await fetch(`/verify-payment/${userId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        orderId: orderData.id,
                        paymentId: response.razorpay_payment_id,
                        signature: response.razorpay_signature,
                        amount: orderData.amount / 100,
                        currency: orderData.currency,
                        status: 'paid'
                    })
                });

                if (!verifyResponse.ok) {
                    console.error('Error verifying payment:', await verifyResponse.text());
                    return;
                }

                const verifyData = await verifyResponse.json();

                if (verifyData.success) {
                    alert('Payment verified and stored successfully');
                    window.location.href = `/payment-details?orderId=${orderData.id}&paymentId=${response.razorpay_payment_id}&amount=${orderData.amount / 100}&currency=${orderData.currency}&status=paid&concertName=${encodeURIComponent(event.title)}&userid=${userId}`;
                } else {
                    alert('Payment verification failed');
                }
            },
            prefill: {
                name: 'darshan',
                email: 'v.b.darshan2001@gmail.com',
                contact: '9842249206'
            },
            notes: {
                address: 'Your Address'
            },
            theme: {
                color: '#DE5E27'
            }
        };

        const razorpayInstance = new Razorpay(options);
        razorpayInstance.open();
    }

    payBtn.addEventListener('click', handlePayment);
}
