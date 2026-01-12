document.addEventListener("DOMContentLoaded", () => {
  const activitiesListEl = document.getElementById('activities-list');
  const activitySelect = document.getElementById('activity');
  const signupForm = document.getElementById('signup-form');
  const messageEl = document.getElementById('message');

  const activityTemplate = document.getElementById('activity-template');

  // Function to fetch activities from API
  async function fetchActivities() {
    activitiesListEl.innerHTML = '<p>Loading activities...</p>';
    try {
      const response = await fetch('/activities');
      const activities = await response.json();
      renderActivities(activities);
      populateSelect(activities);
    } catch (error) {
      activitiesListEl.innerHTML = '<p class="error">Failed to load activities.</p>';
      console.error("Error fetching activities:", error);
    }
  }

  function renderActivities(activities) {
    activitiesListEl.innerHTML = '';
    Object.keys(activities).forEach(name => {
      const data = activities[name];

      // Use template if available
      let card;
      if (activityTemplate && activityTemplate.content) {
        const clone = activityTemplate.content.cloneNode(true);
        card = clone.querySelector('.activity-card');

        // populate fields
        const titleEl = clone.querySelector('.activity-title');
        if (titleEl) titleEl.textContent = name;

        const descEl = clone.querySelector('.activity-desc');
        if (descEl) descEl.textContent = data.description;

        const scheduleEl = clone.querySelector('.activity-schedule');
        if (scheduleEl) scheduleEl.innerHTML = `<strong>Schedule:</strong> ${data.schedule}`;

        const capacityEl = clone.querySelector('.activity-capacity');
        if (capacityEl) capacityEl.innerHTML = `<strong>Capacity:</strong> ${data.participants.length} / ${data.max_participants}`;

        const ul = clone.querySelector('.participants-list');
        const emptyEl = clone.querySelector('.participant-empty');

        if (Array.isArray(data.participants) && data.participants.length > 0) {
          // remove empty message and append participants
          if (emptyEl) emptyEl.remove();
          data.participants.forEach(email => {
            const li = document.createElement('li');
            li.textContent = email;
            ul.appendChild(li);
          });
        } else {
          // ensure the list is hidden if empty
          if (ul) ul.remove();
        }

        activitiesListEl.appendChild(clone);
      } else {
        // fallback to previous manual DOM creation (unchanged)
        const card = document.createElement('div');
        card.className = 'activity-card';

        const title = document.createElement('h4');
        title.textContent = name;
        card.appendChild(title);

        const desc = document.createElement('p');
        desc.textContent = data.description;
        card.appendChild(desc);

        const schedule = document.createElement('p');
        schedule.innerHTML = `<strong>Schedule:</strong> ${data.schedule}`;
        card.appendChild(schedule);

        const capacity = document.createElement('p');
        capacity.innerHTML = `<strong>Capacity:</strong> ${data.participants.length} / ${data.max_participants}`;
        card.appendChild(capacity);

        // Participants section
        const participantsWrap = document.createElement('div');
        participantsWrap.className = 'participants';
        const participantsTitle = document.createElement('h5');
        participantsTitle.textContent = 'Participants';
        participantsWrap.appendChild(participantsTitle);

        const ul = document.createElement('ul');
        ul.className = 'participants-list';

        if (Array.isArray(data.participants) && data.participants.length > 0) {
          data.participants.forEach(email => {
            const li = document.createElement('li');
            li.textContent = email;
            ul.appendChild(li);
          });
        } else {
          const empty = document.createElement('div');
          empty.className = 'participant-empty';
          empty.textContent = 'No participants yet.';
          participantsWrap.appendChild(empty);
        }

        if (ul.children.length) participantsWrap.appendChild(ul);
        card.appendChild(participantsWrap);

        activitiesListEl.appendChild(card);
      }
    });
  }

  function populateSelect(activities) {
    // preserve the placeholder option then append activity options
    const selected = activitySelect.value || '';
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
    Object.keys(activities).forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      if (name === selected) opt.selected = true;
      activitySelect.appendChild(opt);
    });
  }

  function showMessage(text, type='info') {
    messageEl.className = `message ${type}`;
    messageEl.textContent = text;
    messageEl.classList.remove('hidden');
    setTimeout(() => {
      messageEl.classList.add('hidden');
    }, 4000);
  }

  // Handle form submission
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const activity = activitySelect.value;
    if (!email || !activity) {
      showMessage('Please provide an email and select an activity.', 'error');
      return;
    }

    try {
      const url = `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`;
      const res = await fetch(url, { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        showMessage(json.message || 'Signed up successfully!', 'success');
        document.getElementById('email').value = '';
        await fetchActivities(); // refresh UI to show new participant
      } else {
        const err = await res.json().catch(() => ({}));
        showMessage(err.detail || 'Signup failed.', 'error');
      }
    } catch (err) {
      showMessage('Network error during signup.', 'error');
      console.error(err);
    }
  });

  // Initial load
  fetchActivities();
});
