document.addEventListener("DOMContentLoaded", () => {
    const profilePicture = document.getElementById("profilePicture");
    const logoutButton = document.getElementById("logoutButton");
    const profilePictureContainer = document.getElementById("profilePictureContainer");
    const ticketBookingButton1 = document.getElementById("ticketBookingButton1");
    const ticketBookingButton2 = document.getElementById("ticketBookingButton2");
    const ticketBookingButton3 = document.getElementById("ticketBookingButton3");
    const ticketBookingButton4 = document.getElementById("ticketBookingButton4");
    const bookingsButton = document.getElementById("bookingsButton");
    const apiButton = document.getElementById("apiButton");
    const dropdownContent = document.getElementById("dropdownContent");

    const eventPage1 = document.getElementById("eventPage1");
    const eventPage2 = document.getElementById("eventPage2");
    const eventPage3 = document.getElementById("eventPage3");


    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userid');

    if (!userId) {
        alert("User ID not found. Redirecting to login page.");
        window.location.replace("/login");
        return;
    }

    // Fetch user data to display profile picture
    fetch(`/user/${userId}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                window.location.replace("/login");
            } else if (data.profilePicture.data && data.profilePicture.contentType) {
                profilePicture.src = `data:${data.profilePicture.contentType};base64,${data.profilePicture.data}`;
            } else {
                // Handle case where profile picture is not available
                profilePicture.alt = "Profile picture not available";
            }
        })
        .catch(error => {
            console.error('Error fetching user data:', error);
            alert('Error fetching user data. Please try again later.');
        });

    // Show logout button when profile picture is clicked
    profilePictureContainer.addEventListener("click", () => {
        logoutButton.style.display = "block";
    });

    // Handle logout
    logoutButton.addEventListener("click", () => {
        alert("Logged out successfully.");
        window.location.replace("/login");
    });

    // Handle ticket booking button click
    ticketBookingButton1.addEventListener("click", () => {
        window.location.href = `/ticket-booking/A.R.Rahman/${userId}`;
    });

    ticketBookingButton2.addEventListener("click", () => {
        window.location.href = `/ticket-booking/Anirudh/${userId}`;
    });

    ticketBookingButton3.addEventListener("click", () => {
        window.location.href = `/ticket-booking/Vijay Antony/${userId}`;
    });

    ticketBookingButton4.addEventListener("click", () => {
        window.location.href = `/ticket-booking/Free Event/${userId}`;
    });

    // Handle bookings button click
    bookingsButton.addEventListener("click", () => {
        console.log("button");
        window.location.href = `/bookings?userid=${userId}`;
    });

    // Show dropdown content when API button is clicked
    apiButton.addEventListener("click", () => {
        dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
    });

    // Handle event page links click
    eventPage1.addEventListener("click", () => {
        const eventId="66877d8f180589b37608820a";
        window.location.href = `/dynamic?eventId=${eventId}&userId=${userId}`;
    });

    eventPage2.addEventListener("click", () => {
        const eventId="66877da5180589b37608820c";
        window.location.href = `/dynamic?eventId=${eventId}&userId=${userId}`;
    });

    eventPage3.addEventListener("click", () => {
        const eventId="66878f67180589b37608820e";
        window.location.href = `/dynamic?eventId=${eventId}&userId=${userId}`;
    });

    // Hide dropdown content when clicking outside
    window.addEventListener("click", (event) => {
        if (!event.target.matches('#apiButton')) {
            if (dropdownContent.style.display === "block") {
                dropdownContent.style.display = "none";
            }
        }
    });
});
