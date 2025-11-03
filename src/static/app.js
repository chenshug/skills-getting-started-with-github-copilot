document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select options to avoid duplicates on re-fetch
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
          const activityCard = document.createElement("div");
          activityCard.className = "activity-card";

          const spotsLeft = details.max_participants - details.participants.length;

          activityCard.innerHTML = `
            <h4>${name}</h4>
            <p>${details.description}</p>
            <p><strong>Schedule:</strong> ${details.schedule}</p>
            <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
            <p class="participants-header">Current Participants:</p>
          `;

          // Build participants list programmatically so we can attach delete handlers
          const participantsUl = document.createElement('ul');
          participantsUl.className = 'participants-list';

          details.participants.forEach(email => {
            const li = document.createElement('li');

            const emailSpan = document.createElement('span');
            emailSpan.textContent = email;
            emailSpan.className = 'participant-email';

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-participant';
            deleteBtn.type = 'button';
            deleteBtn.title = 'Unregister participant';
            deleteBtn.textContent = '✖';
            deleteBtn.dataset.email = email;

            // Attach click handler to unregister participant
            deleteBtn.addEventListener('click', async () => {
              if (!confirm(`Unregister ${email} from ${name}?`)) return;

              try {
                const res = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(email)}`,
                  { method: 'DELETE' }
                );

                const result = await res.json();
                if (res.ok) {
                  // remove the list item from the DOM
                  li.remove();
                  // Optionally update availability text
                  const availP = activityCard.querySelector('p strong')?.parentNode;
                  // Simple way: re-fetch activities to keep UI consistent
                  fetchActivities();
                } else {
                  alert(result.detail || 'Failed to unregister participant');
                }
              } catch (err) {
                console.error('Error unregistering participant:', err);
                alert('Failed to unregister participant. See console for details.');
              }
            });

            li.appendChild(emailSpan);
            li.appendChild(deleteBtn);
            participantsUl.appendChild(li);
          });

          activityCard.appendChild(participantsUl);

          activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the newly signed-up participant appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
