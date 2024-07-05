document.addEventListener('DOMContentLoaded', function () {
    const params = new URLSearchParams(window.location.search);
    document.getElementById('orderId').textContent = params.get('orderId');
    document.getElementById('paymentId').textContent = params.get('paymentId');
    document.getElementById('amount').textContent = params.get('amount');
    document.getElementById('currency').textContent = params.get('currency');
    document.getElementById('status').textContent = params.get('status');
    document.getElementById('concertName').textContent = decodeURIComponent(params.get('concertName'));

    document.getElementById('downloadReceipt').addEventListener('click', function () {
        const orderId = params.get('orderId');
        const paymentId = params.get('paymentId');
        const amount = params.get('amount');
        const currency = params.get('currency');
        const status = params.get('status');
        const concertName = params.get('concertName');
        const username = params.get('username');
        const email = params.get('email');

        const downloadUrl = `/download-receipt?orderId=${orderId}&paymentId=${paymentId}&amount=${amount}&currency=${currency}&status=${status}&concertName=${concertName}&username=${username}&email=${email}`;
        window.location.href = downloadUrl;
    });

    document.getElementById('downloadAsJPG').addEventListener('click', function () {
        html2canvas(document.getElementById('paymentDetails')).then(canvas => {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/jpeg');
            link.download = 'payment-details.jpg';
            link.click();
        });
    });

    document.getElementById('profileButton').addEventListener('click', function () {
        const userId = params.get('userid');
        window.location.href = `/profile?userid=${userId}`;
    });
});
