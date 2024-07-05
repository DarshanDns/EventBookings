document.addEventListener('DOMContentLoaded', function () {
    const subtractTicket = document.getElementById('subtractTicket');
    const addTicket = document.getElementById('addTicket');
    const ticketCountElement = document.getElementById('ticketCount');
    const totalElement = document.getElementById('ticketTotalAmount');
    const payBtn = document.getElementById('payBtn');

    if (!subtractTicket || !addTicket || !ticketCountElement || !totalElement || !payBtn) {
        console.error('One or more required elements are missing in the DOM.');
        return;
    }

    let ticketCount = 0;
    const ticketPrice = 1000;

    function updateTotal() {
        const total = ticketCount * ticketPrice;
        totalElement.textContent = `₹${total}`;
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
        const userId = window.location.pathname.split('/').pop();
        const totalAmount = parseInt(totalElement.textContent.slice(1));
        const concertName = 'A R Rahman Live in Concert';

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
                amount: totalAmount ,
                concertName: concertName
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
            name: 'A R Rahman Live in Concert',
            description: 'Tickets',
            handler: async function (response) {
                console.log('Payment ID:', response.razorpay_payment_id);
                console.log('Order ID:', orderData.id);
                console.log('Signature:', response.razorpay_signature);

                const verifyResponse = await fetch(`/verify-payment/${userId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        orderId: orderData.id,
                        paymentId: response.razorpay_payment_id,
                        signature: response.razorpay_signature,
                        amount: orderData.amount/100,
                        currency: orderData.currency,
                        status: 'paid'
                    })
                });

                if (!verifyResponse.ok) {
                    console.error('Error verifying payment:', await verifyResponse.text());
                    return;
                }

                const verifyData = await verifyResponse.json();
                console.log('Verify Data:', verifyData);

                if (verifyData.success) {
                    console.log('Redirecting to payment details page');
                    alert('Payment verified and stored successfully');
                    window.location.href = `/payment-details?orderId=${orderData.id}&paymentId=${response.razorpay_payment_id}&amount=${orderData.amount/100}&currency=${orderData.currency}&status=paid&concertName=${encodeURIComponent(concertName)}&userid=${userId}`;
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
});
