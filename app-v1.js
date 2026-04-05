/**
 * Advanced Gatekeeper v1.0
 * Handles cloaking removal and bot detection for Use Click.
 */
const Gatekeeper = {
    settings: {
        isBot: false,
        cloakClass: 'hidden-cloak',
        entryParam: 'v',
        entryValue: '1'
    },

    init: function() {
        this.runChecks();
        
        if (this.settings.isBot) {
            this.handleBot();
        } else {
            this.revealPage();
        }
    },

    runChecks: function() {
        // 1. Check for authorized entry via ?v=1 or if on login page
        const urlParams = new URLSearchParams(window.location.search);
        const isLoginPage = window.location.pathname.endsWith('login.html') || window.location.pathname === '/login';
        
        if (urlParams.get(this.settings.entryParam) === this.settings.entryValue || isLoginPage) {
            this.settings.isBot = false;
            if (!isLoginPage) sessionStorage.setItem('gk_auth', 'true');
            return;
        }

        // 2. Check session bypass
        if (sessionStorage.getItem('gk_auth') === 'true') {
            this.settings.isBot = false;
            return;
        }

        // 3. Basic Bot Detection (WebDriver/Headless)
        const userAgent = navigator.userAgent.toLowerCase();
        if (navigator.webdriver || userAgent.includes('headless')) {
            this.settings.isBot = true;
        }
    },

    revealPage: function() {
        const removeCloak = () => {
            if (document.body) {
                document.body.classList.remove(this.settings.cloakClass);
                // Also handle any inline styles that might be hiding the body
                document.body.style.opacity = "1";
                document.body.style.pointerEvents = "auto";
                console.log("[GK] Page revealed successfully.");
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', removeCloak);
        } else {
            removeCloak();
        }
    },

    handleBot: function() {
        console.warn("[GK] Access Restricted");
        document.documentElement.innerHTML = `
            <!DOCTYPE html>
            <html>
                <head><title>503 Service Temporarily Unavailable</title></head>
                <body style="font-family: sans-serif; text-align: center; padding-top: 100px; background: #f4f4f4; color: #333 text-align:center;">
                    <h1 style="font-size: 3rem; margin-bottom: 0;">503</h1>
                    <p style="font-size: 1.2rem; color: #666;">Service Temporarily Unavailable</p>
                    <hr style="max-width: 400px; margin: 20px auto; border: 0; border-top: 1px solid #ccc;">
                    <p style="font-size: 0.8rem; color: #999;">nginx/1.18.0 (Ubuntu)</p>
                </body>
            </html>
        `;
        window.stop();
    }
};

Gatekeeper.init();
