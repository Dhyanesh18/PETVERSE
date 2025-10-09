document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('addEventForm');
    const descriptionTextarea = document.getElementById('description');
    const charCount = document.querySelector('.char-count');
    const imageInput = document.getElementById('images');
    const imagePreview = document.getElementById('imagePreview');
    
    // Character count for description
    descriptionTextarea.addEventListener('input', function() {
        const count = this.value.length;
        charCount.textContent = `${count} / 1000`;
    });
    
    // Image preview
    imageInput.addEventListener('change', function(e) {
        imagePreview.innerHTML = '';
        const files = Array.from(e.target.files).slice(0, 3);
        
        files.forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size must be less than 5MB');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const div = document.createElement('div');
                div.className = 'preview-item';
                div.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <button type="button" class="remove-preview" onclick="this.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                imagePreview.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
    });
    
    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate end time is after start time
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        
        if (endTime <= startTime) {
            alert('End time must be after start time');
            return;
        }
        
        // Validate phone number if provided
        const phone = document.getElementById('contactPhone').value;
        if (phone && !/^\d{10}$/.test(phone)) {
            alert('Phone number must be 10 digits');
            return;
        }
        
        const submitBtn = form.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        
        try {
            const formData = new FormData(form);
            
            const response = await fetch('/events/add', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('Event created successfully!');
                window.location.href = `/events/${data.eventId}`;
            } else {
                alert(data.message || 'Failed to create event');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Create Event';
            }
        } catch (err) {
            console.error('Error creating event:', err);
            alert('Failed to create event');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Create Event';
        }
    });
});
