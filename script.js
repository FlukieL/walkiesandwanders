// Registration Form Iframe Integration
(function() {
    'use strict';
    
    const iframe = document.getElementById('registration-iframe');
    const loadingIndicator = document.getElementById('iframe-loading');
    
    if (!iframe || !loadingIndicator) return;
    
    // Handle iframe load
    iframe.addEventListener('load', function() {
        loadingIndicator.classList.add('hidden');
        
        // Try to communicate with iframe for seamless integration
        try {
            // Listen for messages from iframe
            window.addEventListener('message', handleIframeMessage);
            
            // Request initial height from iframe
            iframe.contentWindow.postMessage({ type: 'getHeight' }, '*');
        } catch (e) {
            console.log('Iframe communication not available:', e);
        }
    });
    
    // Handle messages from iframe
    function handleIframeMessage(event) {
        // Verify origin for security (adjust as needed)
        // if (event.origin !== 'https://0307walkiesandwanders.petsoftware.net') return;
        
        if (event.data && event.data.type === 'resize') {
            // Resize iframe based on content
            if (event.data.height) {
                iframe.style.height = event.data.height + 'px';
            }
        }
    }
    
    // Fallback: Auto-resize iframe periodically
    // Note: Due to cross-origin restrictions, we can't access iframe content
    // So we'll set a reasonable default height and allow scrolling
    let resizeInterval = setInterval(function() {
        try {
            if (iframe.contentDocument && iframe.contentDocument.body) {
                const height = iframe.contentDocument.body.scrollHeight;
                if (height > 0) {
                    iframe.style.height = Math.max(height, 800) + 'px';
                    loadingIndicator.classList.add('hidden');
                }
            }
        } catch (e) {
            // Cross-origin restrictions - this is expected
            // Set a larger default height to ensure full content is visible
            iframe.style.height = '1200px';
            clearInterval(resizeInterval);
        }
    }, 1000);
    
    // Clear interval after 10 seconds and set a safe default height
    setTimeout(function() {
        clearInterval(resizeInterval);
        // Ensure iframe has enough height to show full content
        if (iframe.style.height === '' || parseInt(iframe.style.height) < 1000) {
            iframe.style.height = '1200px';
        }
    }, 10000);
})();

// Instagram Feed Integration
(function() {
    'use strict';
    
    const instagramFeed = document.getElementById('instagram-feed');
    if (!instagramFeed) return;
    
    // Instagram username from URL
    const instagramUsername = 'walkiesandwanderswithbecky';
    
    // Function to load post URLs from JSON file
    async function loadPostUrls() {
        try {
            const response = await fetch('instagram-posts.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.posts || [];
        } catch (error) {
            console.error('Error loading Instagram post URLs:', error);
            return [];
        }
    }
    
    // Function to fetch Instagram post data using oEmbed API via backend proxy
    async function fetchInstagramPost(postUrl) {
        try {
            // Use our backend proxy to avoid CORS issues
            const proxyUrl = `/api/instagram-oembed?url=${encodeURIComponent(postUrl)}`;
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            return {
                thumbnailUrl: data.thumbnail_url,
                title: data.title || 'Instagram Post',
                author: data.author_name || instagramUsername,
                postUrl: postUrl
            };
        } catch (error) {
            console.error('Error fetching Instagram post:', error, 'URL:', postUrl);
            return null;
        }
    }
    
    // Function to create Instagram post element with real image
    function createInstagramPost(postData) {
        const postDiv = document.createElement('div');
        postDiv.className = 'instagram-post';
        
        const link = document.createElement('a');
        link.href = postData.postUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.title = postData.title;
        
        const img = document.createElement('img');
        img.src = postData.thumbnailUrl;
        img.alt = postData.title;
        img.loading = 'lazy';
        
        // Handle image load errors
        img.onerror = function() {
            // Fallback to placeholder if image fails to load
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="250" height="250"%3E%3Crect fill="%23f5f5dc" width="250" height="250"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%233e2723" font-family="Arial" font-size="14"%3EInstagram Post%3C/text%3E%3C/svg%3E';
        };
        
        link.appendChild(img);
        postDiv.appendChild(link);
        
        return postDiv;
    }
    
    // Function to load Instagram feed
    async function loadInstagramFeed() {
        try {
            // Load post URLs from JSON file
            const postUrls = await loadPostUrls();
            
            console.log('Loaded post URLs:', postUrls.length);
            
            if (postUrls.length > 0) {
                // Show loading state
                instagramFeed.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Loading Instagram posts...</p>';
                
                // Fetch all posts in parallel
                const postPromises = postUrls.map(url => fetchInstagramPost(url));
                const postDataArray = await Promise.all(postPromises);
                
                // Filter out any failed requests
                const validPosts = postDataArray.filter(post => post !== null);
                
                console.log(`Successfully loaded ${validPosts.length} out of ${postUrls.length} posts`);
                
                if (validPosts.length > 0) {
                    // Clear loading message
                    instagramFeed.innerHTML = '';
                    
                    // Create post elements with real images
                    validPosts.forEach((postData, index) => {
                        const postElement = createInstagramPost(postData);
                        postElement.style.transitionDelay = (index * 0.1) + 's';
                        instagramFeed.appendChild(postElement);
                    });
                    
                    // Trigger animations
                    setTimeout(function() {
                        const posts = instagramFeed.querySelectorAll('.instagram-post');
                        posts.forEach((post, index) => {
                            setTimeout(function() {
                                post.classList.add('animate');
                            }, index * 100);
                        });
                    }, 100);
                } else {
                    // All requests failed, show fallback with more details
                    showFallback('All Instagram post requests failed. Please check the browser console for details.');
                }
            } else {
                // No post URLs found in JSON file
                showFallback('No post URLs found in instagram-posts.json');
            }
            
        } catch (error) {
            console.error('Error loading Instagram feed:', error);
            showFallback(`Error: ${error.message}`);
        }
    }
    
    // Function to show fallback message
    function showFallback(customMessage) {
        const message = customMessage || 'Unable to load Instagram posts. Please check that instagram-posts.json exists and contains valid post URLs.';
        instagramFeed.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 1.1rem;">
                    ${message}
                </p>
                <p style="color: var(--text-secondary); margin-top: 30px;">
                    <a href="https://www.instagram.com/${instagramUsername}/" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       style="color: var(--burnt-orange); text-decoration: none; font-weight: 600;">
                        Visit our Instagram profile →
                    </a>
                </p>
            </div>
        `;
    }
    
    // Load feed when section is visible
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && instagramFeed.children.length === 0) {
                loadInstagramFeed();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    const instagramSection = document.querySelector('.instagram-section');
    if (instagramSection) {
        observer.observe(instagramSection);
    } else {
        // Load immediately if observer not available
        loadInstagramFeed();
    }
})();

// Scroll Animations using Intersection Observer
(function() {
    'use strict';
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
        // Skip animations if user prefers reduced motion
        return;
    }
    
    // Animation configuration
    const animationOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    // Function to add animation classes
    function addAnimationClasses() {
        // Service cards
        const serviceCards = document.querySelectorAll('.service-card');
        serviceCards.forEach((card, index) => {
            card.style.transitionDelay = (index * 0.1) + 's';
        });
        
        // Registration container
        const registrationContainer = document.querySelector('.registration-container');
        if (registrationContainer) {
            registrationContainer.classList.add('fade-in');
        }
        
        // Instagram link container
        const instagramLinkContainer = document.querySelector('.instagram-link-container');
        if (instagramLinkContainer) {
            instagramLinkContainer.classList.add('fade-in');
        }
        
        // Contact content
        const contactContent = document.querySelector('.contact-content');
        if (contactContent) {
            contactContent.classList.add('fade-in');
        }
    }
    
    // Create Intersection Observer
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                entry.target.classList.add('animate');
                
                // For service cards, add animate class individually
                if (entry.target.classList.contains('service-card')) {
                    entry.target.classList.add('animate');
                }
                
                // Unobserve after animation triggers
                observer.unobserve(entry.target);
            }
        });
    }, animationOptions);
    
    // Observe elements when DOM is ready
    function initScrollAnimations() {
        addAnimationClasses();
        
        // Observe service cards
        const serviceCards = document.querySelectorAll('.service-card');
        serviceCards.forEach(card => {
            observer.observe(card);
        });
        
        // Observe registration container
        const registrationContainer = document.querySelector('.registration-container');
        if (registrationContainer) {
            observer.observe(registrationContainer);
        }
        
        // Observe Instagram link container
        const instagramLinkContainer = document.querySelector('.instagram-link-container');
        if (instagramLinkContainer) {
            observer.observe(instagramLinkContainer);
        }
        
        // Observe contact content
        const contactContent = document.querySelector('.contact-content');
        if (contactContent) {
            observer.observe(contactContent);
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScrollAnimations);
    } else {
        initScrollAnimations();
    }
})();

// Smooth scroll for anchor links
(function() {
    'use strict';
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '#hero') {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
                return;
            }
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
})();

// Add loading state management
(function() {
    'use strict';
    
    // Hide loading spinner when page is fully loaded
    window.addEventListener('load', function() {
        document.body.classList.add('loaded');
    });
})();

