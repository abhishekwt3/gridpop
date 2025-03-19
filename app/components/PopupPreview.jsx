import React, { useState } from 'react';

export function PopupPreview({
  template = 'discount',
  displayType = 'popup',
  timerDuration = '15',
  bgColor = '#ffffff',
  textColor = '#333333',
  buttonColor = '#4CAF50',
  templateHeading,
  templateSubtext,
  templateButtonText
}) {
  const [email, setEmail] = useState('');
  const [selectedOption, setSelectedOption] = useState('');

  // For demonstration purposes, show a timer
  const [timeRemaining] = useState(`${timerDuration}:00`);

  // Default texts if not provided
  const heading = templateHeading || (
    template === 'discount' ? 'Special Offer!' :
    template === 'newsletter' ? 'Stay Updated!' :
    'Quick Survey'
  );

  const subtext = templateSubtext || (
    template === 'discount' ? 'Get 10% off your first purchase' :
    template === 'newsletter' ? 'Subscribe to our newsletter for exclusive updates' :
    'Help us improve your experience'
  );

  const buttonText = templateButtonText || (
    template === 'discount' ? 'Get Discount' :
    template === 'newsletter' ? 'Subscribe' :
    'Submit'
  );

  // Handle input changes
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSelectChange = (e) => {
    setSelectedOption(e.target.value);
  };

  // Get appropriate template content
  const getTemplateFields = () => {
    switch(template) {
      case 'discount':
        return {
          inputType: 'email',
          inputPlaceholder: 'Enter your email',
          showSelect: false
        };
      case 'newsletter':
        return {
          inputType: 'email',
          inputPlaceholder: 'Enter your email',
          showSelect: false
        };
      case 'survey':
        return {
          inputType: 'select',
          inputPlaceholder: 'Select an option',
          showSelect: true
        };
      default:
        return {
          inputType: 'email',
          inputPlaceholder: 'Enter your email',
          showSelect: false
        };
    }
  };

  const templateFields = getTemplateFields();

  // Styles for popup
  const popupStyles = {
    container: {
      position: 'relative',
      maxWidth: '100%',
      border: '1px solid #ddd',
      borderRadius: '8px',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    popup: {
      backgroundColor: bgColor,
      padding: '25px',
      color: textColor,
      textAlign: 'center',
      position: 'relative'
    },
    closeButton: {
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: 'none',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer',
      color: textColor
    },
    heading: {
      fontSize: '22px',
      fontWeight: 'bold',
      margin: '0 0 15px 0',
      color: textColor
    },
    subtext: {
      fontSize: '16px',
      margin: '0 0 20px 0',
      color: textColor
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '15px'
    },
    input: {
      padding: '10px',
      borderRadius: '4px',
      border: '1px solid #ddd',
      fontSize: '14px'
    },
    button: {
      padding: '10px 15px',
      borderRadius: '4px',
      border: 'none',
      backgroundColor: buttonColor,
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: 'bold',
      cursor: 'pointer'
    },
    select: {
      padding: '10px',
      borderRadius: '4px',
      border: '1px solid #ddd',
      fontSize: '14px',
      width: '100%'
    }
  };

  // Styles for discount bar
  const discountBarStyles = {
    container: {
      position: 'relative',
      width: '100%',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    bar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: bgColor,
      padding: '12px 20px',
      color: textColor,
      borderBottom: '1px solid #ddd'
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

  // Render the appropriate component based on display type
  if (displayType === 'popup') {
    return (
      <div style={popupStyles.container}>
        <div style={popupStyles.popup}>
          <button style={popupStyles.closeButton} aria-label="Close">&times;</button>
          <h2 style={popupStyles.heading}>{heading}</h2>
          <p style={popupStyles.subtext}>{subtext}</p>

          <div style={popupStyles.form}>
            {templateFields.showSelect ? (
              <select
                style={popupStyles.select}
                value={selectedOption}
                onChange={handleSelectChange}
              >
                <option value="">Select an option</option>
                <option value="very_satisfied">Very Satisfied</option>
                <option value="satisfied">Satisfied</option>
                <option value="neutral">Neutral</option>
                <option value="unsatisfied">Unsatisfied</option>
              </select>
            ) : (
              <input
                type={templateFields.inputType}
                placeholder={templateFields.inputPlaceholder}
                style={popupStyles.input}
                value={email}
                onChange={handleEmailChange}
              />
            )}
            <button style={popupStyles.button}>{buttonText}</button>
          </div>
        </div>
      </div>
    );
  }

  // Discount Bar Display
  return (
    <div style={discountBarStyles.container}>
      <div style={discountBarStyles.bar}>
        <div style={discountBarStyles.content}>
          <p style={discountBarStyles.message}>{subtext}</p>
          <span style={discountBarStyles.timer}>Time remaining: {timeRemaining}</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center'}}>
          <button style={discountBarStyles.button}>{buttonText}</button>
          <button style={discountBarStyles.closeButton} aria-label="Close">&times;</button>
        </div>
      </div>
    </div>
  );
}
