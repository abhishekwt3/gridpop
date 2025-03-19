import React from 'react';

export function PopupPreview({
  displayType = 'popup',
  timerDuration = '15',
  bgColor = '#ffffff',
  textColor = '#333333',
  buttonColor = '#4CAF50',
  heading = 'Special Offer!',
  subtext = 'SAVE10',
  buttonText = 'Copy Code',
  barPosition = 'middle',
  fullWidth = false
}) {
  // For demonstration purposes, show a timer
  const timeRemaining = `${timerDuration}:00`;

  // Base style for all discount bar positions
  const baseDiscountBarStyles = {
    container: {
      position: 'relative',
      width: '100%',
      boxSizing: 'border-box',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    bar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: bgColor,
      padding: '12px 20px',
      color: textColor,
      borderBottom: '1px solid #ddd',
      width: '100%',
      boxSizing: 'border-box'
    },
    content: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    },
    message: {
      margin: 0,
      fontSize: '15px',
      fontWeight: 'medium'
    },
    timer: {
      fontSize: '15px',
      fontWeight: 'bold',
      color: buttonColor
    },
    button: {
      padding: '8px 15px',
      borderRadius: '4px',
      border: 'none',
      backgroundColor: buttonColor,
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: 'bold',
      cursor: 'pointer',
      whiteSpace: 'nowrap'
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '18px',
      cursor: 'pointer',
      color: textColor,
      padding: '0 0 0 15px'
    }
  };

  // Adjust styles based on bar position
  const getPositionedStyles = () => {
    const styles = { ...baseDiscountBarStyles };
    
    // Modify styles based on position
    switch (barPosition) {
      case 'top':
        styles.container = {
          ...styles.container,
          borderBottom: '1px solid #ddd',
          borderRadius: '0',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          width: fullWidth ? '100%' : '100%',
          maxWidth: 'none'
        };
        styles.bar = {
          ...styles.bar,
          borderRadius: '0',
          borderBottom: '1px solid #ddd',
          width: '100%'
        };
        styles.positionLabel = 'Top (Sticky)';
        break;
      case 'bottom':
        styles.container = {
          ...styles.container,
          borderTop: '1px solid #ddd',
          borderRadius: '0',
          boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.1)',
          width: fullWidth ? '100%' : '100%',
          maxWidth: 'none'
        };
        styles.bar = {
          ...styles.bar,
          borderRadius: '0',
          borderTop: '1px solid #ddd',
          borderBottom: 'none',
          width: '100%'
        };
        styles.positionLabel = 'Bottom (Sticky)';
        break;
      case 'middle':
      default:
        styles.container = {
          ...styles.container,
          border: '1px solid #ddd',
          borderRadius: '6px',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
          width: fullWidth ? '100%' : '400px',
          maxWidth: fullWidth ? '100%' : '400px',
          margin: '0 auto'
        };
        styles.bar = {
          ...styles.bar,
          borderRadius: '6px',
          border: 'none',
          width: '100%'
        };
        styles.positionLabel = 'Middle (Floating)';
        break;
    }
    
    return styles;
  };

  const discountBarStyles = getPositionedStyles();

  // Discount Bar Display
  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
        Position: {discountBarStyles.positionLabel}
      </div>
      <div style={discountBarStyles.container} className={`preview-bar-${barPosition}`}>
        <div style={discountBarStyles.bar}>
          <div style={discountBarStyles.content}>
            <span style={discountBarStyles.timer}>Time remaining: {timeRemaining}</span>
            <p style={discountBarStyles.message}>{heading}</p>
          </div>
          <div style={{display: 'flex', alignItems: 'center'}}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{subtext}</span>
              <button style={discountBarStyles.button}>{buttonText}</button>
            </div>
            <button style={discountBarStyles.closeButton} aria-label="Close">&times;</button>
          </div>
        </div>
      </div>
    </div>
  );
}