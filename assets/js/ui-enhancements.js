// UI/UX Enhancements for KSCB website

(function() {
  'use strict';

  // Scroll progress indicator
  class ScrollProgress {
    constructor() {
      this.indicator = null;
      this.init();
    }

    init() {
      this.createIndicator();
      this.attachScrollListener();
    }

    createIndicator() {
      this.indicator = document.createElement('div');
      this.indicator.className = 'scroll-indicator';
      document.body.appendChild(this.indicator);
    }

    attachScrollListener() {
      let ticking = false;
      
      const updateProgress = () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollTop / scrollHeight;
        
        this.indicator.style.transform = `scaleX(${progress})`;
        ticking = false;
      };

      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(updateProgress);
          ticking = true;
        }
      }, { passive: true });
    }
  }

  // Animate elements on scroll
  class ScrollAnimations {
    constructor() {
      this.elements = [];
      this.init();
    }

    init() {
      this.elements = document.querySelectorAll('[data-animate]');
      if (!this.elements.length) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('animate');
              // Add staggered delay for child elements
              const children = entry.target.querySelectorAll('[data-animate-child]');
              children.forEach((child, index) => {
                setTimeout(() => {
                  child.classList.add('animate');
                }, index * 100);
              });
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
      );

      this.elements.forEach(el => observer.observe(el));
    }
  }

  // Enhanced form validation with real-time feedback
  class FormEnhancements {
    constructor() {
      this.forms = document.querySelectorAll('form');
      this.init();
    }

    init() {
      this.forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea');
        
        inputs.forEach(input => {
          // Real-time validation
          input.addEventListener('blur', () => this.validateField(input));
          input.addEventListener('input', () => this.clearError(input));
          
          // Floating label effect
          if (input.value) {
            input.classList.add('has-value');
          }
          
          input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
          });
          
          input.addEventListener('blur', () => {
            input.parentElement.classList.remove('focused');
            if (input.value) {
              input.classList.add('has-value');
            } else {
              input.classList.remove('has-value');
            }
          });
        });
      });
    }

    validateField(field) {
      const value = field.value.trim();
      let isValid = true;
      let errorMsg = '';

      if (field.required && !value) {
        isValid = false;
        errorMsg = 'This field is required';
      } else if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          isValid = false;
          errorMsg = 'Please enter a valid email';
        }
      } else if (field.type === 'tel' && value) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(value) || value.replace(/\D/g, '').length < 10) {
          isValid = false;
          errorMsg = 'Please enter a valid phone number';
        }
      }

      if (!isValid) {
        this.showError(field, errorMsg);
      } else {
        this.clearError(field);
      }

      return isValid;
    }

    showError(field, message) {
      field.classList.add('error');
      
      let errorEl = field.parentElement.querySelector('.field-error');
      if (!errorEl) {
        errorEl = document.createElement('span');
        errorEl.className = 'field-error';
        field.parentElement.appendChild(errorEl);
      }
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }

    clearError(field) {
      field.classList.remove('error');
      const errorEl = field.parentElement.querySelector('.field-error');
      if (errorEl) {
        errorEl.style.display = 'none';
      }
    }
  }

  // Loading states management
  class LoadingStates {
    constructor() {
      this.overlay = null;
      this.init();
    }

    init() {
      this.createOverlay();
      // Removed automatic skeleton placeholders per request
    }

    createOverlay() {
      this.overlay = document.createElement('div');
      this.overlay.className = 'loading-overlay';
      this.overlay.innerHTML = '<div class="spinner"></div>';
      document.body.appendChild(this.overlay);
    }

    show() {
      this.overlay.classList.add('show');
    }

    hide() {
      this.overlay.classList.remove('show');
    }

    // Skeleton helpers retained for compatibility; not used by default

    removeSkeletons(container) {
      const skeletons = container.querySelectorAll('.skeleton');
      skeletons.forEach(skeleton => skeleton.remove());
    }
  }

  // Smooth page transitions
  class PageTransitions {
    constructor() {
      this.transitioning = false;
      this.init();
    }

    init() {
      // Intercept internal links
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link || this.transitioning) return;
        
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('tel:') || href.startsWith('mailto:')) {
          return;
        }

        e.preventDefault();
        this.navigate(href);
      });

      // Browser back/forward
      window.addEventListener('popstate', () => {
        if (!this.transitioning) {
          this.loadContent(window.location.pathname);
        }
      });
    }

    navigate(url) {
      this.transitioning = true;
      
      const transition = document.createElement('div');
      transition.className = 'page-transition';
      document.body.appendChild(transition);
      
      setTimeout(() => {
        transition.classList.add('active');
        
        setTimeout(() => {
          window.location.href = url;
        }, 500);
      }, 10);
    }

    loadContent(url) {
      // Implementation for AJAX content loading if needed
      console.log('Loading:', url);
    }
  }

  // Tooltip system
  class TooltipSystem {
    constructor() {
      this.init();
    }

    init() {
      // Add tooltips to important elements
      const tooltipElements = [
        { selector: '.btn-primary', text: 'Click to proceed' },
        { selector: '[aria-label]', useAriaLabel: true }
      ];

      tooltipElements.forEach(config => {
        const elements = document.querySelectorAll(config.selector);
        elements.forEach(el => {
          if (!el.hasAttribute('data-tooltip')) {
            const text = config.useAriaLabel ? el.getAttribute('aria-label') : config.text;
            if (text) {
              el.setAttribute('data-tooltip', text);
            }
          }
        });
      });
    }
  }

  // Success feedback
  window.showSuccess = function(message) {
    const successEl = document.createElement('div');
    successEl.className = 'success-message';
    successEl.innerHTML = `
      <div class="success-check">
        <svg viewBox="0 0 52 52">
          <circle class="circle" cx="26" cy="26" r="25" fill="none"/>
          <path class="check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
        </svg>
      </div>
      <p>${message}</p>
    `;
    
    successEl.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      z-index: 10000;
      text-align: center;
    `;
    
    document.body.appendChild(successEl);
    
    setTimeout(() => {
      successEl.style.transition = 'opacity 0.3s';
      successEl.style.opacity = '0';
      setTimeout(() => successEl.remove(), 300);
    }, 3000);
  };

  // Initialize all enhancements
  document.addEventListener('DOMContentLoaded', () => {
    new ScrollProgress();
    new ScrollAnimations();
    new FormEnhancements();
    new LoadingStates();
    new TooltipSystem();
    // PageTransitions disabled by default - enable if needed
    // new PageTransitions();

    // Add CSS for field errors
    const style = document.createElement('style');
    style.textContent = `
      .field-error {
        color: #ef4444;
        font-size: 12px;
        margin-top: 4px;
        display: none;
      }
      .field.focused {
        position: relative;
      }
      .field.focused label {
        color: var(--brand);
      }
    `;
    document.head.appendChild(style);
  });

  // Expose loading states globally
  window.UILoading = new LoadingStates();
})();
