document.addEventListener("DOMContentLoaded", function () {
  const popup = document.querySelector(".exit-popup");
  const closeButton = document.querySelector(".exit-popup__close");
  const form = document.querySelector(".exit-popup__form");
  const emailInput = form ? form.querySelector("input[type='email']") : null;

  let triggerCount = 0;
  const maxTriggers = 2;

  try {
    triggerCount = parseInt(sessionStorage.getItem("exitPopupCount")) || 0;
  } catch (error) {
    console.warn("Session storage is not available:", error);
  }

  function showPopup() {
    if (!popup) return;
    popup.style.display = "flex";

    try {
      triggerCount++;
      sessionStorage.setItem("exitPopupCount", triggerCount);
    } catch (error) {
      console.warn("Could not store session data:", error);
    }
  }

  function hidePopup() {
    if (!popup) return;
    popup.style.display = "none";
  }

  function handleExitIntent(event) {
    if (
      event.clientY <= 0 || // Mouse leaves at top
      (!event.relatedTarget && event.clientY < 10) // Mouseout with no relatedTarget (real exit)
    ) {
      if (triggerCount < maxTriggers) {
        showPopup();
      }

      if (triggerCount >= maxTriggers) {
        document.removeEventListener("mouseout", handleExitIntent);
        window.removeEventListener("blur", handleTabSwitch);
      }
    }
  }

  function handleTabSwitch() {
    if (triggerCount < maxTriggers) {
      showPopup();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!emailInput || !emailInput.value) return;

    try {
      const response = await fetch("/apps/exit-intent/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.value }),
      });

      if (response.ok) {
        alert("Thank you for subscribing!");
        hidePopup();
      } else {
        alert("Subscription failed. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting email:", error);
    }
  }

  document.addEventListener("mouseout", handleExitIntent); // Works better in Safari
  window.addEventListener("blur", handleTabSwitch); // Detects tab switching
  if (closeButton) closeButton.addEventListener("click", hidePopup);
  if (form) form.addEventListener("submit", handleSubmit);
});
