document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('addEventForm');
    const descriptionTextarea = document.getElementById('description');
    const charCount = document.querySelector('.char-count');
    const documentInput = document.getElementById('permissionDocument');
    const documentPreview = document.getElementById('documentPreview');

    // Character count for description
    descriptionTextarea.addEventListener('input', function() {
        const count = this.value.length;
        charCount.textContent = `${count} / 1000`;
    });

    // Document preview
    documentInput.addEventListener('change', function(e) {
        documentPreview.innerHTML = '';
        const file = e.target.files[0];
        
        if (file) {
            // Check file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                documentInput.value = '';
                return;
            }

            const div = document.createElement('div');
            div.className = 'document-preview-item';
            
            const icon = getFileIcon(file.type);
            const fileSize = (file.size / 1024).toFixed(2);
            
            div.innerHTML = `
                <i class="fas ${icon}"></i>
                <div class="document-info">
                    <span class="document-name">${file.name}</span>
                    <span class="document-size">${fileSize} KB</span>
                </div>
                <button type="button" class="remove-document" onclick="this.parentElement.remove(); document.getElementById('permissionDocument').value = '';">
                    <i class="fas fa-times"></i>
                </button>
            `;
            documentPreview.appendChild(div);
        }
    });

    // Get file icon based on type
    function getFileIcon(type) {
        if (type.includes('pdf')) return 'fa-file-pdf';
        if (type.includes('word') || type.includes('doc')) return 'fa-file-word';
        if (type.includes('image')) return 'fa-file-image';
        return 'fa-file-alt';
    }

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

        // Check if permission document is uploaded
        if (!documentInput.files[0]) {
            alert('Please upload government permission letter');
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
