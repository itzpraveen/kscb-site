// Security utilities for KSCB website

// DOMPurify-lite: Basic HTML sanitization
const SecurityUtils = {
  // Escape HTML to prevent XSS
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // Sanitize user input for display
  sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    // Remove dangerous tags and attributes
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  },

  // Validate email format
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // Validate phone format (Indian)
  validatePhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 13;
  },

  // Generate CSRF token
  generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  // Store CSRF token in sessionStorage
  setCSRFToken() {
    const token = this.generateCSRFToken();
    sessionStorage.setItem('csrf_token', token);
    return token;
  },

  // Get CSRF token
  getCSRFToken() {
    let token = sessionStorage.getItem('csrf_token');
    if (!token) {
      token = this.setCSRFToken();
    }
    return token;
  },

  // Validate form data
  validateForm(formData) {
    const errors = [];
    
    if (formData.name) {
      const sanitized = this.sanitizeInput(formData.name);
      if (sanitized.length < 2) {
        errors.push('Name must be at least 2 characters');
      }
      formData.name = sanitized;
    }

    if (formData.email) {
      if (!this.validateEmail(formData.email)) {
        errors.push('Please enter a valid email');
      }
    }

    if (formData.phone) {
      if (!this.validatePhone(formData.phone)) {
        errors.push('Please enter a valid phone number');
      }
    }

    if (formData.message) {
      formData.message = this.sanitizeInput(formData.message);
    }

    return { valid: errors.length === 0, errors, data: formData };
  },

  // Rate limiting for form submissions
  canSubmitForm(formId) {
    const key = `form_submit_${formId}`;
    const lastSubmit = localStorage.getItem(key);
    const now = Date.now();
    
    if (lastSubmit) {
      const timeDiff = now - parseInt(lastSubmit);
      if (timeDiff < 30000) { // 30 seconds
        return false;
      }
    }
    
    localStorage.setItem(key, now.toString());
    return true;
  }
};

// Content Security Policy meta tag injector
(function() {
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.sanity.io https://*.apicdn.sanity.io",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  document.head.appendChild(meta);
})();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecurityUtils;
}