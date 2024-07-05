// // login.js

// document.addEventListener("DOMContentLoaded", () => {
//     const loginForm = document.getElementById("loginForm");

//     loginForm.addEventListener("submit", async (e) => {
//         e.preventDefault();

//         const email = document.getElementById("loginEmail").value;
//         const password = document.getElementById("loginPassword").value;

//         // Basic client-side validation
//         if (!email || !password) {
//             alert("Please fill in all fields.");
//             return;
//         }

//         try {
//             const response = await fetch("/login", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json"
//                 },
//                 body: JSON.stringify({ email, password })
//             });

//             const data = await response.json();
            
//             console.log(data);

//             if (data.msg === "Login successful!") {
//                 alert(data.msg);
//                 // Redirect to profile page with userId in the URL
//                 window.location.replace(`/profile?userid=${data.userid}`);
//             } else {
//                 alert(data.msg);
//             }

//             // Redirect to dashboard or perform any other action upon successful login
//         } catch (error) {
//             console.error("Error during login:", error);
//             alert("An error occurred during login. Please try again later.");
//         }
//     });
// });

// login.js

// login.js

// document.getElementById('loginform').addEventListener('submit', async (event) => {
//     event.preventDefault();

//     const email = document.getElementById('email').value;
//     const password = document.getElementById('password').value;

//     try {
//         const response = await fetch('/login', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({ email, password })
//         });

//         const result = await response.json();
//         if (response.ok) {
//             window.location.href = `/profile?userid=${result.userid}`;
//         } else {
//             alert(result.message || 'Login failed');
//         }
//     } catch (error) {
//         console.error('Error during login:', error);
//         alert('An error occurred. Please try again.');
//     }
// });


document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();
        if (response.ok) {
            window.location.href = `/profile?userid=${result.userid}`;
        } else {
            alert(result.message || 'Login failed');
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('An error occurred. Please try again.');
    }
});
