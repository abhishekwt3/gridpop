document.addEventListener("DOMContentLoaded", function () {
  console.log("🔍 Exit Popup Script Starting...");

  // Get configuration from window object - DO NOT provide defaults here
  // All defaults should be handled in the Liquid template
  if (!window.exitIntentConfig) {
    console.error("Exit popup configuration not found!");
    return;
  }

  const config = window.exitIntentConfig;
  console.log("🛠️ Debug: Using config from Liquid:", config);

  // Get DOM elements
  const popup = document.getElementById("exit-popup-overlay");
  const discountBar = document.getElementById("discount-bar");
  const closeButtons = document.querySelectorAll(".popup-close, .discount-bar__close");
  const timerElement = document.getElementById("discount-timer");

  // Check for required elements
  if (!popup && config.displayType === "popup") {
    console.warn("Exit popup overlay element not found. Will check again shortly...");

    // Try again after a short delay (elements might be loading)
    setTimeout(() => {
      const retryPopup = document.getElementById("exit-popup-overlay");
      if (retryPopup) {
        console.log("Popup element found on retry!");
        initExitIntent(retryPopup, null);
      } else {
        console.error("Exit popup overlay element not found after retry!");
      }
    }, 1000);

    return;
  }

  if (!discountBar && config.displayType === "discount-bar") {
    console.warn("Discount bar element not found. Will check again shortly...");

    // Try again after a short delay
    setTimeout(() => {
      const retryBar = document.getElementById("discount-bar");
      if (retryBar) {
        console.log("Discount bar element found on retry!");
        initExitIntent(null, retryBar);
      } else {
        console.error("Discount bar element not found after retry!");
      }
    }, 1000);

    return;
  }

  // Initialize with found elements
  initExitIntent(popup, discountBar);

  // Main initialization function
  function initExitIntent(popupElement, discountBarElement) {
    // Determine which element to use based on display type
    const activeElement = config.displayType === "popup" ? popupElement : discountBarElement;

    if (!activeElement) {
      console.error(`Active element (${config.displayType}) not found!`);
      return;
    }

    let popupShown = false;
    let triggerCount = 0;
    let timerInterval = null;
    const maxTriggers = parseInt(config.popupFrequency) || 1; // Default to 1 if not specified

    // Initialize from session storage
    try {
      triggerCount = parseInt(sessionStorage.getItem("exitPopupCount")) || 0;
      console.log("📊 Current trigger count:", triggerCount, "of", maxTriggers);
    } catch (error) {
      console.warn("Session storage error:", error);
    }

    // Function to show the appropriate element (popup or discount bar)
    function showExitIntent() {
      if (popupShown || triggerCount >= maxTriggers) return;

      console.log("🚀 Showing exit intent with template:", config.popupTemplate);

      // Show the element
      activeElement.style.display = config.displayType === "popup" ? "flex" : "block";
      popupShown = true;

      // Start timer if it's a discount bar
      if (config.displayType === "discount-bar" && timerElement) {
        startTimer(config.timerDuration);
      }

      // Track display count
      try {
        triggerCount++;
        sessionStorage.setItem("exitPopupCount", triggerCount.toString());
        console.log("Updated trigger count to", triggerCount);
      } catch (error) {
        console.warn("Session storage error:", error);
      }
    }

    // Function to hide the element
    function hideExitIntent() {
      if (activeElement) {
        activeElement.style.display = "none";
      }

      // Clear timer if running
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }

      popupShown = false;
      console.log("Exit intent hidden");
    }

    // Function to start countdown timer
    function startTimer(seconds) {
      if (!timerElement) return;

      let remainingTime = seconds;
      updateTimerDisplay(remainingTime);

      timerInterval = setInterval(() => {
        remainingTime--;

        if (remainingTime <= 0) {
          clearInterval(timerInterval);
          hideExitIntent();
          return;
        }

        updateTimerDisplay(remainingTime);
      }, 1000);
    }

    // Function to update timer display
    function updateTimerDisplay(seconds) {
      if (!timerElement) return;

      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      timerElement.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    // Handle exit intent (mouse leaving window)
    function handleExitIntent(event) {
      // Only trigger on actual exit intent (mouse leaving at top of window)
      if (event.clientY <= 0) {
        console.log("Exit intent detected (mouse leaving at top)");
        showExitIntent();

        // Remove listener if we've reached the max number of displays
        if (triggerCount >= maxTriggers) {
          cleanupListeners();
        }
      }
    }

    // Clean up event listeners
    function cleanupListeners() {
      document.removeEventListener("mouseout", handleExitIntent);
      console.log("Cleaned up exit intent listeners");
    }

    // Add event listeners
    if (triggerCount < maxTriggers) {
      document.addEventListener("mouseout", handleExitIntent);
      console.log("Added exit intent listener");
    } else {
      console.log("Max triggers reached, not adding listeners");
    }

    // Add close button event listeners
    closeButtons.forEach(button => {
      button.addEventListener("click", function(e) {
        e.preventDefault();
        hideExitIntent();
      });
    });

    // Add click outside to close for popup overlay
    if (popupElement) {
      popupElement.addEventListener("click", function(event) {
        if (event.target === popupElement) {
          hideExitIntent();
        }
      });
    }

    // Handle form submissions
    const forms = document.querySelectorAll(".exit-popup__form");
    forms.forEach(form => {
      form.addEventListener("submit", function(e) {
        e.preventDefault();
        const emailInput = form.querySelector('input[type="email"]');

        if (emailInput && emailInput.value) {
          // Here you would typically send the email to your backend
          console.log("Form submitted with email:", emailInput.value);

          // Show a success message
          const parentElement = form.closest('.popup-template, .exit-popup--discount, .exit-popup--newsletter, .exit-popup--survey');
          if (parentElement) {
            parentElement.innerHTML = '<h2>Thank You!</h2><p>You have been subscribed successfully.</p>';
          }

          // Hide after a delay
          setTimeout(hideExitIntent, 3000);
        }
      });
    });

    console.log("✅ Exit Intent Script Initialized Successfully");
  } // End of initExitIntent function
});
