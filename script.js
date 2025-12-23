// Registration Form Iframe Integration
(function() {
    'use strict';
    
    const iframe = document.getElementById('registration-iframe');
    const loadingIndicator = document.getElementById('iframe-loading');
    const loginButton = document.getElementById('login-button');
    const registerButton = document.getElementById('register-button');
    
    if (!iframe || !loadingIndicator) return;
    
    // URLs for login and register
    const loginUrl = 'https://0307walkiesandwanders.petsoftware.net/clientportal/login';
    const registerUrl = 'https://0307walkiesandwanders.petsoftware.net/clientportal/login?action=signup';
    
    // Set initial mode to login (since iframe starts with login URL)
    iframe.parentElement.classList.add('login-mode');
    iframe.classList.add('login-mode');
    
    // Function to switch between login and register
    function switchMode(mode) {
        if (!loginButton || !registerButton) return;
        
        // Update button states
        if (mode === 'login') {
            loginButton.classList.add('active');
            registerButton.classList.remove('active');
            iframe.src = loginUrl;
            iframe.title = 'Login Form';
            // Add class to wrapper and iframe for login mode
            iframe.parentElement.classList.add('login-mode');
            iframe.parentElement.classList.remove('register-mode');
            iframe.classList.add('login-mode');
            iframe.classList.remove('register-mode');
        } else {
            registerButton.classList.add('active');
            loginButton.classList.remove('active');
            iframe.src = registerUrl;
            iframe.title = 'Registration Form';
            // Add class to wrapper and iframe for register mode
            iframe.parentElement.classList.add('register-mode');
            iframe.parentElement.classList.remove('login-mode');
            iframe.classList.add('register-mode');
            iframe.classList.remove('login-mode');
        }
        
        // Show loading indicator
        loadingIndicator.classList.remove('hidden');
        loadingIndicator.textContent = 'Loading...';
    }
    
    // Add event listeners to buttons
    if (loginButton) {
        loginButton.addEventListener('click', function() {
            switchMode('login');
        });
    }
    
    if (registerButton) {
        registerButton.addEventListener('click', function() {
            switchMode('register');
        });
    }
    
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
                    // Use different minimum heights based on mode
                    const minHeight = iframe.classList.contains('login-mode') ? 480 : 800;
                    iframe.style.height = Math.max(height, minHeight) + 'px';
                    loadingIndicator.classList.add('hidden');
                }
            }
        } catch (e) {
            // Cross-origin restrictions - this is expected
            // Set a larger default height to ensure full content is visible
            // Use different heights based on mode
            const defaultHeight = iframe.classList.contains('login-mode') ? '720px' : '1200px';
            iframe.style.height = defaultHeight;
            clearInterval(resizeInterval);
        }
    }, 1000);
    
    // Clear interval after 10 seconds and set a safe default height
    setTimeout(function() {
        clearInterval(resizeInterval);
        // Ensure iframe has enough height to show full content
        // Use different heights based on mode
        const minThreshold = iframe.classList.contains('login-mode') ? 600 : 1000;
        const defaultHeight = iframe.classList.contains('login-mode') ? '720px' : '1200px';
        if (iframe.style.height === '' || parseInt(iframe.style.height) < minThreshold) {
            iframe.style.height = defaultHeight;
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
    
    // Function to normalise Instagram post URL to standard embed format
    function normaliseInstagramUrl(url) {
        try {
            // Extract post ID from various Instagram URL formats
            // Formats: /p/POST_ID/, /reel/POST_ID/, /username/p/POST_ID/, /username/reel/POST_ID/
            const patterns = [
                /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
                /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
                /instagram\.com\/[^\/]+\/p\/([A-Za-z0-9_-]+)/,
                /instagram\.com\/[^\/]+\/reel\/([A-Za-z0-9_-]+)/
            ];
            
            let postId = null;
            let isReel = false;
            
            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match) {
                    postId = match[1];
                    isReel = pattern.source.includes('reel');
                    break;
                }
            }
            
            if (postId) {
                // Return standard Instagram embed URL format
                const postType = isReel ? 'reel' : 'p';
                return `https://www.instagram.com/${postType}/${postId}/`;
            }
            
            // If no pattern matches, try to clean up the URL
            const urlObj = new URL(url);
            urlObj.search = '';
            urlObj.hash = '';
            return urlObj.toString().replace(/\/$/, '');
        } catch (e) {
            // If URL parsing fails, return as-is
            console.warn('Failed to normalise Instagram URL:', url, e);
            return url;
        }
    }
    
    // Store post URLs and loaded state
    let postUrls = [];
    let embedScriptLoaded = false;
    const loadedEmbeds = new Map(); // Track which posts have embeds loaded
    
    // Function to create placeholder div for Instagram post (without embed)
    function createPostPlaceholder(postUrl, index) {
        const postDiv = document.createElement('div');
        postDiv.className = 'instagram-post';
        postDiv.dataset.postUrl = postUrl;
        postDiv.dataset.postIndex = index;
        
        // Add staggered animation delay
        postDiv.style.transitionDelay = (index * 0.1) + 's';
        
        // Create a placeholder div to maintain height
        const placeholder = document.createElement('div');
        placeholder.className = 'instagram-placeholder';
        postDiv.appendChild(placeholder);
        
        return postDiv;
    }
    
    // Function to load Instagram embed into a post container
    function loadEmbedIntoPost(postDiv) {
        const postUrl = postDiv.dataset.postUrl;
        if (!postUrl || loadedEmbeds.has(postDiv)) {
            return; // Already loaded or no URL
        }
        
        // Normalise the URL
        const normalisedUrl = normaliseInstagramUrl(postUrl);
        
        // Remove placeholder
        const placeholder = postDiv.querySelector('.instagram-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        // Create native Instagram embed blockquote
        const blockquote = document.createElement('blockquote');
        blockquote.className = 'instagram-media';
        blockquote.setAttribute('data-instgrm-permalink', normalisedUrl);
        blockquote.setAttribute('data-instgrm-version', '14');
        
        // Set inline styles to match Instagram's default but allow CSS override
        blockquote.style.cssText = 'background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);';
        
        postDiv.appendChild(blockquote);
        loadedEmbeds.set(postDiv, true);
        
        // Process the embed if script is loaded
        if (embedScriptLoaded && window.instgrm && window.instgrm.Embeds) {
            try {
                window.instgrm.Embeds.process();
            } catch (error) {
                console.error('Error processing Instagram embed:', error);
            }
        }
        
        // Trigger animation
        setTimeout(function() {
            postDiv.classList.add('animate');
        }, 100);
    }
    
    // Function to unload Instagram embed from a post container
    function unloadEmbedFromPost(postDiv) {
        const blockquote = postDiv.querySelector('blockquote.instagram-media');
        if (blockquote) {
            blockquote.remove();
            loadedEmbeds.delete(postDiv);
            
            // Create placeholder again
            const placeholder = document.createElement('div');
            placeholder.className = 'instagram-placeholder';
            postDiv.appendChild(placeholder);
            
            postDiv.classList.remove('animate');
        }
    }
    
    // Function to load Instagram embed script
    function loadEmbedScript() {
        const existingScript = document.querySelector('script[src*="instagram.com/embed.js"]');
        
        if (existingScript) {
            embedScriptLoaded = true;
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://www.instagram.com/embed.js';
        script.async = true;
        
        script.onload = function() {
            embedScriptLoaded = true;
            // Process any existing embeds
            if (window.instgrm && window.instgrm.Embeds) {
                window.instgrm.Embeds.process();
            }
        };
        
        script.onerror = function() {
            console.error('Failed to load Instagram embed script');
        };
        
        document.body.appendChild(script);
    }
    
    // Function to load Instagram feed with lazy loading
    async function loadInstagramFeed() {
        try {
            // Load post URLs from JSON file
            postUrls = await loadPostUrls();
            
            console.log('Loaded post URLs:', postUrls.length);
            
            if (postUrls.length > 0) {
                // Show loading state
                instagramFeed.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Loading Instagram posts...</p>';
                
                // Load the embed script
                loadEmbedScript();
                
                // Clear loading message
                instagramFeed.innerHTML = '';
                
                // Create placeholder divs for all posts (without embeds)
                postUrls.forEach((postUrl, index) => {
                    const placeholder = createPostPlaceholder(postUrl, index);
                    instagramFeed.appendChild(placeholder);
                });
                
                // Set up IntersectionObserver for lazy loading
                const observerOptions = {
                    root: null,
                    rootMargin: '100px', // Start loading 100px before entering viewport
                    threshold: 0.1
                };
                
                const observer = new IntersectionObserver(function(entries) {
                    entries.forEach(entry => {
                        const postDiv = entry.target;
                        
                        if (entry.isIntersecting) {
                            // Post is visible, load the embed
                            loadEmbedIntoPost(postDiv);
                        } else {
                            // Post is not visible, unload the embed
                            unloadEmbedFromPost(postDiv);
                        }
                    });
                }, observerOptions);
                
                // Observe all post containers
                const postContainers = instagramFeed.querySelectorAll('.instagram-post');
                postContainers.forEach(container => {
                    observer.observe(container);
                });
                
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

// Hero Background Video
(function() {
    'use strict';
    
    const videoContainer = document.getElementById('hero-video-container');
    if (!videoContainer) return;
    
    // YouTube video ID from URL: https://www.youtube.com/watch?v=cFgZ218LgYQ
    const videoId = 'cFgZ218LgYQ';
    let player = null;
    
    // Generate random timestamp (3 minutes to 10 hours = 180 to 36000 seconds)
    function getRandomTimestamp() {
        // Start after 3 minutes (180 seconds) up to 10 hours (36000 seconds)
        const minSeconds = 180; // 3 minutes
        const maxSeconds = 36000; // 10 hours
        return Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds;
    }
    
    // Load YouTube video with iframe, then use API to seek
    function loadHeroVideo() {
        const timestamp = getRandomTimestamp();
        
        // Create YouTube iframe with autoplay, mute, loop
        const iframe = document.createElement('iframe');
        iframe.id = 'hero-youtube-player';
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&iv_load_policy=3`;
        iframe.allow = 'autoplay; encrypted-media';
        iframe.allowFullscreen = false;
        iframe.frameBorder = '0';
        iframe.style.cssText = 'position: absolute; top: 50%; left: 50%; width: 177.78vh; height: 56.25vw; min-width: 100%; min-height: 100%; transform: translate(-50%, -50%); pointer-events: none; border: none;';
        
        videoContainer.appendChild(iframe);
        
        // Use YouTube API to seek to timestamp once player is ready
        function initializePlayer() {
            if (typeof YT !== 'undefined' && YT.Player) {
                player = new YT.Player('hero-youtube-player', {
                    events: {
                        'onReady': function(event) {
                            // Seek to random timestamp when video is ready
                            event.target.seekTo(timestamp, true);
                        },
                        'onStateChange': function(event) {
                            // Ensure video loops properly and maintains timestamp
                            if (event.data === YT.PlayerState.ENDED) {
                                event.target.seekTo(timestamp, true);
                                event.target.playVideo();
                            }
                        }
                    }
                });
            } else {
                // Retry if API not loaded yet
                setTimeout(initializePlayer, 100);
            }
        }
        
        // Wait for YouTube API to be available
        if (typeof YT !== 'undefined' && YT.Player) {
            initializePlayer();
        } else {
            // Wait for API to load
            window.addEventListener('load', function() {
                setTimeout(initializePlayer, 500);
            });
        }
    }
    
    // Load video when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadHeroVideo);
    } else {
        loadHeroVideo();
    }
})();

// Logo Interactive Animation
(function() {
    'use strict';
    
    const logo = document.querySelector('.logo');
    if (!logo) return;
    
    let clickCount = 0;
    let lastClickTime = 0;
    let animationTimeout = null;
    let isAnimating = false;
    
    // Function to create confetti particles
    function createConfetti() {
        const colors = ['#D2691E', '#E67E22', '#F5F5DC', '#3E2723', '#B85A0F'];
        const particleCount = 30;
        
        // Get the logo's position relative to the viewport
        const logoRect = logo.getBoundingClientRect();
        const logoCenterX = logoRect.left + logoRect.width / 2;
        const logoCenterY = logoRect.top + logoRect.height / 2;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            const size = Math.random() * 8 + 4;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            particle.style.cssText = `
                position: fixed;
                width: ${size}px;
                height: ${size}px;
                background-color: ${color};
                left: ${logoCenterX}px;
                top: ${logoCenterY}px;
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999;
                opacity: 0.9;
            `;
            
            document.body.appendChild(particle);
            
            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = Math.random() * 200 + 100;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;
            const rotation = Math.random() * 720 - 360;
            
            particle.animate([
                {
                    transform: 'translate(0, 0) rotate(0deg) scale(1)',
                    opacity: 0.9
                },
                {
                    transform: `translate(${vx}px, ${vy}px) rotate(${rotation}deg) scale(0)`,
                    opacity: 0
                }
            ], {
                duration: 1000 + Math.random() * 500,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }).onfinish = () => particle.remove();
        }
    }
    
    // Function to handle logo click/tap
    function handleLogoInteraction(e) {
        e.preventDefault();
        
        const currentTime = Date.now();
        const timeSinceLastClick = currentTime - lastClickTime;
        
        // Reset click count if more than 2 seconds have passed
        if (timeSinceLastClick > 2000) {
            clickCount = 0;
        }
        
        clickCount++;
        lastClickTime = currentTime;
        
        // Clear any pending timeout
        if (animationTimeout) {
            clearTimeout(animationTimeout);
            animationTimeout = null;
        }
        
        // Cancel any ongoing animation by removing classes and resetting
        logo.classList.remove('clicked', 'bounce');
        isAnimating = false;
        
        // Force a reflow to ensure class removal is processed
        void logo.offsetWidth;
        
        // Use double requestAnimationFrame to ensure clean state before adding new animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // Mark as animating
                isAnimating = true;
                
                // Trigger animation based on click count
                if (clickCount % 3 === 0) {
                    // Every 3rd click: bounce animation
                    logo.classList.add('bounce');
                    createConfetti();
                    
                    // Remove animation class after animation completes
                    animationTimeout = setTimeout(() => {
                        logo.classList.remove('clicked', 'bounce');
                        isAnimating = false;
                        animationTimeout = null;
                    }, 1800); // Bounce: 1.5s + 300ms buffer
                } else {
                    // Regular clicks: spin animation
                    logo.classList.add('clicked');
                    createConfetti();
                    
                    // Remove animation class after animation completes
                    animationTimeout = setTimeout(() => {
                        logo.classList.remove('clicked', 'bounce');
                        isAnimating = false;
                        animationTimeout = null;
                    }, 1400); // Spin: 1.2s + 200ms buffer
                }
            });
        });
    }
    
    // Add event listeners for both click and touch
    logo.addEventListener('click', handleLogoInteraction);
    
    // Touch handlers with visual feedback
    logo.addEventListener('touchstart', function() {
        logo.style.opacity = '0.8';
    });
    
    logo.addEventListener('touchend', function(e) {
        e.preventDefault();
        logo.style.opacity = '1';
        handleLogoInteraction(e);
    });
})();

