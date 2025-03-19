document.addEventListener("DOMContentLoaded", function () {
  console.log("🔍 Exit Intent Discount Bar Script Starting...");

  // Get configuration from window object
  if (!window.exitIntentConfig) {
    console.error("Exit intent configuration not found!");
    return;
  }

  const config = window.exitIntentConfig;
  console.log("🛠️ Configuration loaded:", config);

  // Get DOM elements
  const discountBar = document.getElementById("discount-bar");
  const closeButtons = document.querySelectorAll(".discount-bar__close");
  const timerElement = document.getElementById("discount-timer");
  const discountCodeElement = document.getElementById('discount-code');
  const copyButton = document.getElementById('copy-discount-button');

  // Check for required elements
  if (!discountBar) {
    console.warn("Discount bar element not found. Will check again shortly...");

    // Try again after a short delay
    setTimeout(() => {
      const retryBar = document.getElementById("discount-bar");
      if (retryBar) {
        console.log("Discount bar element found on retry!");
        initExitIntent(retryBar);
      } else {
        console.error("Discount bar element not found after retry!");
      }
    }, 1000);

    return;
  }

  console.log("DOM elements found:", { 
    discountBar: !!discountBar, 
    timerElement: !!timerElement,
    discountCodeElement: !!discountCodeElement,
    copyButton: !!copyButton
  });

  // Initialize with found elements
  initExitIntent(discountBar);

  // Debug helper function
  function debugMetafields() {
    console.group("Debugging Metafields and Configuration");
    console.log("Window exitIntentConfig:", window.exitIntentConfig);
    
    // Show values in DOM
    console.log("DOM Values:");
    if (discountCodeElement) console.log("Discount code text:", discountCodeElement.textContent);
    if (timerElement) console.log("Timer display:", timerElement.textContent);
    
    // Analyze config
    const configKeys = Object.keys(config || {});
    console.log("Config keys:", configKeys);
    
    if (config) {
      console.log("popupFrequency:", config.popupFrequency, typeof config.popupFrequency);
      console.log("timerDuration:", config.timerDuration, typeof config.timerDuration);
      console.log("discountCode:", config.discountCode);
      console.log("offerText:", config.offerText);
      console.log("buttonText:", config.buttonText);
      console.log("scrollDetection:", config.scrollDetection);
      console.log("barPosition:", config.barPosition);
    }
    
    console.groupEnd();
  }
    
  // Run debug on initialization
  debugMetafields();

  function initExitIntent(discountBarElement) {
    if (!discountBarElement) {
      console.error("Discount bar element not found!");
      return;
    }

    let barShown = false;
    let triggerCount = 0;
    let timerInterval = null;
    const maxTriggers = parseInt(config.popupFrequency) || 1; // Default to 1 if not specified
    const scrollDetectionEnabled = config.scrollDetection !== false; // Default to true if not specified
    const barPosition = config.barPosition || "middle"; // Default to middle if not specified

    // Apply position styling based on the configuration
    applyPositionStyling(discountBarElement, barPosition);

    // Initialize from session storage
    try {
      triggerCount = parseInt(sessionStorage.getItem("exitPopupCount")) || 0;
      console.log("📊 Current trigger count:", triggerCount, "of", maxTriggers);
    } catch (error) {
      console.warn("Session storage error:", error);
    }

    // Function to show the discount bar
    function showDiscountBar() {
      if (barShown || triggerCount >= maxTriggers) return;

      console.log("🚀 Showing discount bar");
      
      // Update elements with config values if they exist
      if (discountCodeElement && config.discountCode) {
        console.log("Setting discount code to:", config.discountCode);
        discountCodeElement.textContent = config.discountCode;
      }
      
      if (copyButton && config.buttonText) {
        console.log("Setting button text to:", config.buttonText);
        copyButton.textContent = config.buttonText;
      }

      // Show the element
      discountBarElement.style.display = "block";
      barShown = true;

      // Start timer
      if (timerElement) {
        // Parse the timerDuration from config, with fallback and validation
        const duration = parseInt(config.timerDuration);
        console.log(`Config timer duration: ${duration} minutes (${typeof duration})`);
        
        if (isNaN(duration) || duration <= 0) {
          console.warn("Invalid timer duration in config, using default");
          startTimer(15 * 60); // Default 15 minutes
        } else {
          startTimer(duration * 60); // Convert minutes to seconds
        }
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

    // Function to hide the discount bar
    function hideDiscountBar() {
      if (discountBarElement) {
        discountBarElement.style.display = "none";
      }

      // Clear timer if running
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }

      barShown = false;
      console.log("Discount bar hidden");
    }

    // Function to start countdown timer
    function startTimer(seconds) {
      if (!timerElement) return;

      // Make sure we have a valid seconds value
      let remainingTime = seconds;
      if (isNaN(remainingTime) || remainingTime <= 0) {
        remainingTime = 60; // Default to 1 minute if invalid
      }
      
      console.log(`Starting timer with ${remainingTime} seconds`);
      updateTimerDisplay(remainingTime);

      timerInterval = setInterval(() => {
        remainingTime--;

        if (remainingTime <= 0) {
          clearInterval(timerInterval);
          console.log("Timer completed, hiding discount bar");
          hideDiscountBar();
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
        showDiscountBar();

        // Remove listener if we've reached the max number of displays
        if (triggerCount >= maxTriggers) {
          cleanupListeners();
        }
      }
    }

    // Track scrolling to detect rapid upward scrolls (only if enabled)
    let lastScrollTop = window.scrollY;
    let scrollTimeout;

    function handleScroll() {
      if (!scrollDetectionEnabled) return;

      clearTimeout(scrollTimeout);
      
      let currentScrollTop = window.scrollY;
      let scrollSpeed = lastScrollTop - currentScrollTop;

      // Detect rapid upward scroll
      if (scrollSpeed > 30) {
        console.log("Rapid upward scroll detected");
        showDiscountBar();
      }

      lastScrollTop = currentScrollTop;
    }

    // Apply the appropriate positioning styles based on the configuration
    function applyPositionStyling(element, position) {
      if (!element) return;

      // Reset existing styles
      element.style.position = "";
      element.style.top = "";
      element.style.bottom = "";
      element.style.left = "";
      element.style.transform = "";
      element.style.width = "";
      element.style.zIndex = "999999";

      // Apply styles based on position configuration
      switch (position) {
        case "top":
          element.style.position = "fixed";
          element.style.top = "0";
          element.style.left = "0";
          element.style.width = "100%";
          element.style.transform = "none";
          element.style.borderRadius = "0";
          // Make a shadow at the bottom
          element.querySelector(".discount-bar__content").style.borderRadius = "0";
          element.querySelector(".discount-bar__content").style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
          break;
        case "bottom":
          element.style.position = "fixed";
          element.style.bottom = "0";
          element.style.left = "0";
          element.style.width = "100%";
          element.style.transform = "none";
          element.style.borderRadius = "0";
          // Make a shadow at the top
          element.querySelector(".discount-bar__content").style.borderRadius = "0";
          element.querySelector(".discount-bar__content").style.boxShadow = "0 -2px 4px rgba(0, 0, 0, 0.1)";
          break;
        case "middle":
        default:
          // Keep the default centered style
          element.style.position = "fixed";
          element.style.top = "50%";
          element.style.left = "50%";
          element.style.transform = "translate(-50%, -50%)";
          element.style.width = "400px";
          element.style.height = "auto";
          // Reset border radius to original value
          element.querySelector(".discount-bar__content").style.borderRadius = "6px";
          element.querySelector(".discount-bar__content").style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.2)";
          break;
      }

      console.log(`Applied position styling: ${position}`);
    }

    // Clean up event listeners
    function cleanupListeners() {
      document.removeEventListener("mouseout", handleExitIntent);
      window.removeEventListener("scroll", handleScroll);
      console.log("Cleaned up exit intent listeners");
    }

    // Add event listeners
    if (triggerCount < maxTriggers) {
      document.addEventListener("mouseout", handleExitIntent);
      
      // Only add scroll event listener if enabled
      if (scrollDetectionEnabled) {
        window.addEventListener("scroll", handleScroll);
        console.log("Added scroll detection listener");
      }
      
      console.log("Added exit intent listener");
    } else {
      console.log("Max triggers reached, not adding listeners");
    }

    // Add close button event listeners
    closeButtons.forEach(button => {
      button.addEventListener("click", function(e) {
        e.preventDefault();
        hideDiscountBar();
      });
    });

    // Handle copy button functionality
    const copyButton = document.getElementById('copy-discount-button');
    const discountCode = document.getElementById('discount-code');
    
    if (copyButton && discountCode) {
      copyButton.addEventListener('click', function() {
        // Create a temporary input element to copy from
        const tempInput = document.createElement('input');
        tempInput.value = discountCode.textContent.trim();
        document.body.appendChild(tempInput);
        tempInput.select();
        
        try {
          // Copy the text to clipboard
          document.execCommand('copy');
          
          // Show success state
          copyButton.textContent = 'Copied!';
          copyButton.classList.add('copied');
          
          // Reset button after 2 seconds
          setTimeout(() => {
            copyButton.textContent = 'Copy Code';
            copyButton.classList.remove('copied');
          }, 2000);
          
          console.log('Discount code copied:', tempInput.value);
        } catch (err) {
          console.error('Failed to copy code:', err);
        }
        
        // Remove the temporary input
        document.body.removeChild(tempInput);
      });
    } else {
      console.warn('Copy button or discount code element not found');
    }

    console.log("✅ Exit Intent Discount Bar Script Initialized Successfully");
  }
});