import React from 'react';

export function PopupPreview({ template, displayType, timerDuration, bgColor, textColor, buttonColor }) {
  // Default values if not provided
  const background = bgColor || '#ffffff';
  const text = textColor || '#333333';
  const button = buttonColor || '#4CAF50';
  const duration = timerDuration || 15;

  const getDiscountBar = () => {
    return (
      <div style={{ 
        backgroundColor: background, 
        color: text,
        padding: '10px 20px', 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '60px',
        width: 'fit-content',
        maxWidth: '100%',
        margin: '0 auto',
        borderRadius: '4px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            backgroundColor: '#f8d7da', 
            color: '#721c24',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            {duration}:00
          </div>
          <span style={{ fontWeight: 'bold' }}>
            {template === 'discount' ? 'Limited time offer: 10% off your order!' : 
             template === 'newsletter' ? 'Subscribe now for exclusive deals!' : 
             'Take our quick survey before you go!'}
          </span>
        </div>
        <button style={{ 
          backgroundColor: button, 
          color: 'white',
          border: 'none',
          padding: '8px 15px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginLeft: '15px',
          whiteSpace: 'nowrap'
        }}>
          {template === 'discount' ? 'Get Discount' : 
           template === 'newsletter' ? 'Subscribe' : 
           'Take Survey'}
        </button>
      </div>
    );
  };

  const getTemplateContent = () => {
    switch (template) {
      case 'discount':
        return (
          <div style={{ backgroundColor: '#fffae6', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <h2 style={{ color: '#ff6600', margin: '0 0 15px' }}>Exclusive Discount!</h2>
            <p style={{ margin: '0 0 20px' }}>Get 10% off your first purchase when you sign up!</p>
            <div style={{ marginBottom: '15px' }}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  marginBottom: '10px'
                }} 
              />
              <button 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  backgroundColor: button, 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer' 
                }}
              >
                Get My Discount
              </button>
            </div>
          </div>
        );
      
      case 'newsletter':
        return (
          <div style={{ backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <h2 style={{ color: '#0066cc', margin: '0 0 15px' }}>Join Our Newsletter</h2>
            <p style={{ margin: '0 0 20px' }}>Stay updated with our latest offers and news.</p>
            <div style={{ marginBottom: '15px' }}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  marginBottom: '10px'
                }} 
              />
              <button 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  backgroundColor: button, 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer' 
                }}
              >
                Subscribe
              </button>
            </div>
          </div>
        );
      
      case 'survey':
        return (
          <div style={{ backgroundColor: '#fff3e6', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <h2 style={{ color: '#cc3300', margin: '0 0 15px' }}>We Value Your Feedback</h2>
            <p style={{ margin: '0 0 20px' }}>How would you rate your experience with us?</p>
            <div style={{ marginBottom: '15px' }}>
              <select 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  marginBottom: '10px'
                }}
              >
                <option value="">Select an option</option>
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Good</option>
                <option value="3">3 - Average</option>
                <option value="2">2 - Below Average</option>
                <option value="1">1 - Poor</option>
              </select>
              <button 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  backgroundColor: button, 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer' 
                }}
              >
                Submit Feedback
              </button>
            </div>
          </div>
        );
      
      default:
        return (
          <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 15px' }}>Welcome!</h2>
            <p style={{ margin: '0 0 20px' }}>Thank you for visiting our store.</p>
          </div>
        );
    }
  };

  if (displayType === 'discount-bar') {
    return (
      <div style={{ marginTop: '20px' }}>
        {getDiscountBar()}
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'relative', 
      border: '1px solid #ddd', 
      borderRadius: '8px', 
      overflow: 'hidden',
      marginTop: '20px',
      backgroundColor: background
    }}>
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        right: '10px', 
        fontSize: '20px', 
        lineHeight: 1, 
        cursor: 'pointer',
        zIndex: 2,
        width: '24px',
        height: '24px',
        textAlign: 'center',
        backgroundColor: 'white',
        borderRadius: '50%',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
      }}>
        &times;
      </div>
      <div style={{ padding: '20px' }}>
        {getTemplateContent()}
      </div>
    </div>
  );
}