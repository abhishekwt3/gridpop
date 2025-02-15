import React, { useState, useEffect } from 'react';

export function ExitPopup({ settings }) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!settings.enabled || hasShown) return;

    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 && !hasShown) {
        showPopup();
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [settings.enabled, hasShown]);

  const showPopup = () => {
    setIsVisible(true);
    setHasShown(true);
    sessionStorage.setItem('exitPopupShown', 'true');
  };

  const hidePopup = () => {
    setIsVisible(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/apps/exit-intent/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        hidePopup();
        alert('Thank you for subscribing!');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="exit-popup">
      <div
        className="exit-popup__content"
        style={{ backgroundColor: settings.backgroundColor || '#ffffff' }}
      >
        <button
          className="exit-popup__close"
          onClick={hidePopup}
        >
          &times;
        </button>
        <h2>{settings.title}</h2>
        <p>{settings.message}</p>
        <form
          className="exit-popup__form"
          onSubmit={handleSubmit}
        >
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Subscribe</button>
        </form>
      </div>
    </div>
  );
}
