document.addEventListener("DOMContentLoaded", function() {
  // Get DOM elements
  const overlay = document.getElementById("exit-popup-overlay");
  const closeButtons = document.querySelectorAll(".popup-close");
  const forms = document.querySelectorAll(".popup-template form");

  let popupShown = false;
  let triggerCount = 0;
  const maxTriggers = window.exitIntentConfig?.popupFrequency || 2;

  // Initialize from session storage
  try {
      triggerCount = parseInt(sessionStorage.getItem("exitPopupCount")) || 0;
  } catch (error) {
      console.warn("Session storage error:", error);
  }

  function showPopup() {
      if (!overlay || popupShown || triggerCount >= maxTriggers) return;

      overlay.style.display = "flex";
      popupShown = true;

      try {
          triggerCount++;
          sessionStorage.setItem("exitPopupCount", triggerCount.toString());
      } catch (error) {
          console.warn("Session storage error:", error);
      }
  }

  function hidePopup() {
      if (!overlay) return;
      overlay.style.display = "none";
      popupShown = false;
  }

  function handleExitIntent(event) {
      // Only trigger when mouse moves to top of window
      if (event.clientY <= 0) {
          showPopup();
          if (triggerCount >= maxTriggers) {
              cleanupListeners();
          }
      }
  }

  function handleSubmit(event) {
      event.preventDefault();
      const form = event.target;
      const formData = new FormData(form);
      const endpoint = form.getAttribute('action');

      fetch(endpoint, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(Object.fromEntries(formData))
      })
      .then(response => {
          if (response.ok) {
              hidePopup();
              alert("Thank you for your submission!");
          } else {
              throw new Error('Submission failed');
          }
      })
      .catch(error => {
          console.error('Error:', error);
          alert("Something went wrong. Please try again.");
      });
  }

  function cleanupListeners() {
      document.removeEventListener("mouseout", handleExitIntent);
  }

  // Event Listeners
  if (triggerCount < maxTriggers) {
      document.addEventListener("mouseout", handleExitIntent);
  }

  // Close button listeners
  closeButtons.forEach(button => {
      button.addEventListener("click", (e) => {
          e.preventDefault();
          hidePopup();
      });
  });

  // Overlay click to close
  overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
          hidePopup();
      }
  });

  // Form submit listeners
  forms.forEach(form => {
      form.addEventListener("submit", handleSubmit);
  });
});
