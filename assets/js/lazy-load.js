// Lazy loading and image optimization for KSCB website

(function() {
  // Modern lazy loading with Intersection Observer
  class LazyLoader {
    constructor() {
      this.imageObserver = null;
      this.init();
    }

    init() {
      // Native lazy loading support check
      if ('loading' in HTMLImageElement.prototype) {
        this.addNativeLazyLoading();
      } else {
        this.addIntersectionObserver();
      }
      
      // Add blur-up effect for better UX
      this.addBlurUpEffect();
    }

    addNativeLazyLoading() {
      const images = document.querySelectorAll('img[data-src]');
      images.forEach(img => {
        img.loading = 'lazy';
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        if (img.dataset.srcset) {
          img.srcset = img.dataset.srcset;
          img.removeAttribute('data-srcset');
        }
      });
    }

    addIntersectionObserver() {
      this.imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            this.loadImage(img);
            observer.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });

      const images = document.querySelectorAll('img[data-src]');
      images.forEach(img => this.imageObserver.observe(img));
    }

    loadImage(img) {
      if (img.dataset.src) {
        // Create a new image to preload
        const tempImg = new Image();
        
        tempImg.onload = () => {
          img.src = tempImg.src;
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
          }
          img.classList.add('loaded');
          img.removeAttribute('data-src');
          img.removeAttribute('data-srcset');
        };
        
        tempImg.onerror = () => {
          img.classList.add('error');
          // Fallback to placeholder
          img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EImage unavailable%3C/text%3E%3C/svg%3E';
        };
        
        tempImg.src = img.dataset.src;
      }
    }

    addBlurUpEffect() {
      const style = document.createElement('style');
      style.textContent = `
        img[data-src] {
          filter: blur(5px);
          transition: filter 0.3s;
        }
        img.loaded {
          filter: blur(0);
        }
        img.error {
          filter: blur(0);
          opacity: 0.5;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new LazyLoader());
  } else {
    new LazyLoader();
  }

  // Helper function to convert images to lazy loading
  window.convertToLazyLoad = function(selector = 'img') {
    const images = document.querySelectorAll(selector);
    images.forEach(img => {
      if (!img.dataset.src && img.src && !img.src.startsWith('data:')) {
        img.dataset.src = img.src;
        img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"%3E%3C/svg%3E';
        img.loading = 'lazy';
      }
    });
  };

  // Optimize images with responsive sizes
  window.optimizeImageSizes = function() {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
      const width = img.getBoundingClientRect().width;
      if (width > 0 && !img.dataset.srcset) {
        const src = img.dataset.src;
        const ext = src.split('.').pop();
        const base = src.substring(0, src.lastIndexOf('.'));
        
        // Generate srcset for different screen sizes
        const sizes = [320, 640, 960, 1280, 1920];
        const srcset = sizes
          .map(size => `${base}-${size}w.${ext} ${size}w`)
          .join(', ');
        
        img.dataset.srcset = srcset;
        img.sizes = '(max-width: 640px) 100vw, (max-width: 960px) 50vw, 33vw';
      }
    });
  };
})();