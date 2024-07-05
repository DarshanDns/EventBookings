const form = document.getElementById('form');

form.addEventListener('submit', async e => {
    e.preventDefault();

    if (validateInputs()) {
        try {
            const formData = new FormData();

        formData.append('username', form.username.value.trim());
        formData.append('email', form.email.value.trim());
        formData.append('password', form.password.value.trim());
        
        const profilePicture = document.getElementById('profile-picture').files[0];
        formData.append('profile-picture', profilePicture);

        console.log(formData);
        // Send form data to server using fetch API
        const response = await fetch('http://localhost:3000/register', {
            method: 'POST',
            body: formData
        });

            if (response.ok) {
                // If registration is successful, reset the form
                form.reset();
                alert('Registration successful!');
            } else {
                // If registration fails, display error message
                const errorMessage = await response.text();
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('Error registering user:', error);
            alert('Error registering user. Please try again later.');
        }
    }
});

const setError = (element, message) => {
    const inputControl = element.parentElement;
    const errorDisplay = inputControl.querySelector('.error');

    errorDisplay.innerText = message;
    inputControl.classList.add('error');
    inputControl.classList.remove('success');
};

const setSuccess = element => {
    const inputControl = element.parentElement;
    const errorDisplay = inputControl.querySelector('.error');

    errorDisplay.innerText = '';
    inputControl.classList.add('success');
    inputControl.classList.remove('error');
};

const isValidEmail = email => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
};

const validateInputs = () => {
    const usernameValue = form.username.value.trim();
    const emailValue = form.email.value.trim();
    const passwordValue = form.password.value.trim();
    const password2Value = form.password2.value.trim();
    const profilePicture = document.getElementById('profile-picture').files[0];

    let isValid = true;

    if (usernameValue === '') {
        setError(form.username, 'Username is required');
        isValid = false;
    } else {
        setSuccess(form.username);
    }

    if (emailValue === '') {
        setError(form.email, 'Email is required');
        isValid = false;
    } else if (!isValidEmail(emailValue)) {
        setError(form.email, 'Provide a valid email address');
        isValid = false;
    } else {
        setSuccess(form.email);
    }

    if (passwordValue === '') {
        setError(form.password, 'Password is required');
        isValid = false;
    } else if (passwordValue.length < 8) {
        setError(form.password, 'Password must be at least 8 characters');
        isValid = false;
    } else {
        setSuccess(form.password);
    }

    if (password2Value === '') {
        setError(form.password2, 'Please confirm your password');
        isValid = false;
    } else if (password2Value !== passwordValue) {
        setError(form.password2, "Passwords don't match");
        isValid = false;
    } else {
        setSuccess(form.password2);
    }
    if (!profilePicture) {
        setError(document.getElementById('profile-picture'), 'Please select a profile picture');
        isValid = false;
    } else {
        setSuccess(document.getElementById('profile-picture'));
    }

    return isValid;
};

// Function to handle file input change event
document.getElementById('profile-picture').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('image-preview');
    
    // Check if file is an image
    if (file && file.type.startsWith('image')) {
        const reader = new FileReader();
        
        reader.onload = function() {
            // Create an image element
            const img = document.createElement('img');
            img.src = reader.result;
            img.classList.add('preview-image');
            
            // Clear any previous preview
            preview.innerHTML = '';
            
            // Append the image to the preview element
            preview.appendChild(img);
        }
        
        // Read the image file as a data URL
        reader.readAsDataURL(file);
    } else {
        // Clear the preview if file is not an image
        preview.innerHTML = '';
    }
});
