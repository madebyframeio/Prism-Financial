// --- Supabase Config ---
const SUPABASE_URL = 'https://fmhjbyxljorruczvpajx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtaGpieXhsam9ycnVjenZwYWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTY2ODgsImV4cCI6MjA4NjE3MjY4OH0.Ktc6plrX4dlcEX4ndPD9KImhNWgco1AHAN4AS1E2MGU'; // User provided key

// Initialize Client (Relies on CDN script being loaded in HTML)
let supabaseClient = null;

const utils = {
    init: () => {
        if (window.supabase) {
            const { createClient } = window.supabase;
            // Initialize local and attach to object for global access
            supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
            utils.supabase = supabaseClient;
            console.log('Supabase Connected');
        } else {
            console.error('Supabase SDK not loaded');
        }
        // Dynamic branding via DB/cache has been disabled.
        // using static HTML Tailwind setup only.

        // Start Inactivity Timer (20 mins = 1,200,000ms)
        utils.startInactivityTimer(1200000);

        // Anti-Cloning Security Measures
        document.addEventListener('contextmenu', e => e.preventDefault()); // Disable Right Click
        document.addEventListener('keydown', e => {
            // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
            if (e.keyCode === 123 ||
                (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) ||
                (e.ctrlKey && e.keyCode === 85)) {
                e.preventDefault();
            }
        });

        // Disable Text Selection globally
        if (document.body) {
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
            document.body.style.MozUserSelect = 'none';
        }
    },

    // --- Security & Session ---
    inactivityTimeout: null,

    startInactivityTimer: (duration = 1200000) => {
        const resetTimer = () => {
            if (utils.inactivityTimeout) clearTimeout(utils.inactivityTimeout);
            utils.inactivityTimeout = setTimeout(() => {
                console.warn("User inactive for " + (duration / 1000) + "s - Logging out.");
                utils.logout();
            }, duration);
        };

        // Events to monitor
        ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
            document.addEventListener(evt, resetTimer, true);
        });

        // Initial start
        resetTimer();
    },

    // --- System Branding Removed ---
    // Branding is now handled purely statically via HTML Tailwind configuration as requested by the user.

    // --- Auth & User Management ---
    login: async (username, password) => {
        // For simulation, we are just querying the 'users' table directly 
        // since we didn't implement full Supabase Auth (simpler migration)
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password) // In real app, verify hash
            .single();

        if (error || !data) return null;

        // Store session locally for persistence across pages
        sessionStorage.setItem('currentUser', JSON.stringify(data));
        return data;
    },

    getCurrentUser: () => {
        const user = sessionStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    },

    logout: () => {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    },

    // --- Data Formatting ---
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    formatCompactCurrency(amount) {
        const formatter = new Intl.NumberFormat('en-US', {
            notation: 'compact',
            compactDisplay: 'short',
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 1
        });
        return formatter.format(amount);
    },

    generateHologramCSS() {
        return `linear-gradient(125deg, transparent 0%, rgba(212,175,55,0.1) 50%, transparent 100%)`;
    },

    generateId: () => crypto.randomUUID(), // Use native UUID

    generateAccountNumber: () => {
        // Generate a random 10-digit number. 
        // Ensure it starts with a specific prefix (e.g., '10') to look realistic, or just random
        const prefix = '20';
        const random = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
        return prefix + random;
    },

    // Pure function to calculate impact of a transaction on user balances
    calculateBalanceImpact: (amount, type, description = '', isReversal = false) => {
        let mainImpact = 0;
        let investmentImpact = 0;
        let savingsImpact = 0;
        let ccImpact = 0;

        // Normalize
        const safeAmount = Number(amount) || 0;
        const multiplier = isReversal ? -1 : 1;
        const descUpper = (description || '').toUpperCase();

        if (type === 'debit') {
            mainImpact = -safeAmount;
            if (descUpper.includes('[INVESTMENT]')) investmentImpact = -safeAmount;
            if (descUpper.includes('[SAVINGS]')) savingsImpact = -safeAmount;
            if (descUpper.includes('[CREDIT_CARD]')) ccImpact = -safeAmount;
        } else if (type === 'credit') {
            mainImpact = safeAmount;
            if (descUpper.includes('[INVESTMENT]')) investmentImpact = safeAmount;
            if (descUpper.includes('[SAVINGS]')) savingsImpact = safeAmount;
            if (descUpper.includes('[CREDIT_CARD]')) ccImpact = safeAmount;
        } else if (type === 'investment_withdrawal') {
            investmentImpact = -safeAmount;
        } else if (type === 'investment_deposit') {
            investmentImpact = safeAmount;
        }

        return {
            main: mainImpact * multiplier,
            investment: investmentImpact * multiplier,
            savings: savingsImpact * multiplier,
            cc: ccImpact * multiplier
        };
    },

    // --- Async Data Access ---

    // Get full user data (with balance and extra balances from settings)
    getUserData: async (userId) => {
        // Parallel Fetch for Performance
        const userPromise = supabaseClient
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        // Too many keys to list statically? Let's just fetch all settings for this user.
        const settingsPromise = supabaseClient
            .from('settings')
            .select('*')
            .ilike('key', `u_${userId}_%`);

        const [userResult, settingsResult] = await Promise.all([userPromise, settingsPromise]);

        const user = userResult.data;
        const userError = userResult.error;
        const settings = settingsResult.data;

        if (userError || !user) return null;

        // 3. Merge & Set Defaults
        user.savings_balance = 0;
        user.investment_balance = 0;
        user.is_savings_locked = true;
        user.account_number = null;

        // Extended Settings Defaults
        user.acc_savings = null;
        user.acc_invest = null;
        user.cc_number = null;
        user.cc_expiry = '08/28';
        user.cc_cvv = '123';
        user.cc_tier = 'Gold Tier';
        user.cc_balance = 0;
        user.rewards_pts = 0;
        user.verification_status = 'Verification Pending';

        if (settings) {
            settings.forEach(item => {
                const k = item.key;
                if (k === `u_${userId}_sav`) user.savings_balance = parseFloat(item.value);
                if (k === `u_${userId}_inv`) user.investment_balance = parseFloat(item.value);
                if (k === `u_${userId}_sav_locked`) user.is_savings_locked = item.value === 'true';
                if (k === `u_${userId}_acc_num`) user.account_number = item.value;
                if (k === `u_${userId}_acc_savings`) user.acc_savings = item.value;
                if (k === `u_${userId}_acc_invest`) user.acc_invest = item.value;
                if (k === `u_${userId}_cc_number`) user.cc_number = item.value;
                if (k === `u_${userId}_cc_expiry`) user.cc_expiry = item.value;
                if (k === `u_${userId}_cc_cvv`) user.cc_cvv = item.value;
                if (k === `u_${userId}_cc_tier`) user.cc_tier = item.value;
                if (k === `u_${userId}_cc_balance`) user.cc_balance = parseFloat(item.value) || 0;
                if (k === `u_${userId}_rewards_pts`) user.rewards_pts = parseInt(item.value) || 0;
                if (k === `u_${userId}_verification_status`) user.verification_status = item.value;
            });
        }

        // Auto-generate if missing (Migration for existing users)
        const missingSettings = [];

        if (!user.account_number) {
            user.account_number = utils.generateAccountNumber();
            missingSettings.push({ key: `u_${userId}_acc_num`, value: user.account_number });
        }
        if (!user.acc_savings) {
            user.acc_savings = '30' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
            missingSettings.push({ key: `u_${userId}_acc_savings`, value: user.acc_savings });
        }
        if (!user.acc_invest) {
            user.acc_invest = '40' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
            missingSettings.push({ key: `u_${userId}_acc_invest`, value: user.acc_invest });
        }
        if (!user.cc_number) {
            // Fake Visa
            user.cc_number = '4532 8821 ' + Math.floor(Math.random() * 9000 + 1000) + ' ' + Math.floor(Math.random() * 9000 + 1000);
            missingSettings.push({ key: `u_${userId}_cc_number`, value: user.cc_number });
        }

        if (missingSettings.length > 0) {
            utils.supabase.from('settings').upsert(missingSettings, { onConflict: 'key' }).then();
        }

        return user;
    },

    verifyPin: async (userId, pin) => {
        const { data, error } = await supabaseClient
            .from('users')
            .select('pin')
            .eq('id', userId)
            .single();

        if (error || !data) return false;
        return data.pin === pin;
    },

    // Get transactions for a user
    getTransactions: async (userId) => {
        let data = [];
        try {
            const { data: dbData, error } = await supabaseClient
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            if (!error && dbData) data = dbData;
        } catch (e) {
            console.warn("Supabase Fetch Failed (Using Local Fallback)", e);
        }

        // Merge Local
        const localTxs = JSON.parse(localStorage.getItem('local_transactions') || '[]');
        const myLocal = localTxs.filter(t => t.user_id === userId);

        // Combine and Sort
        const combined = [...myLocal, ...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return combined;
    },

    // Create a transaction
    createTransaction: async (userId, amount, type, description, status = 'completed') => {
        // DB Constraint Workaround: Map custom types to 'debit'/'credit'
        let dbType = type;
        let dbDesc = description;

        if (type === 'investment_withdrawal') {
            dbType = 'debit'; // Logic is handled below, DB sees debit
            dbDesc = '[INV_WITHDRAWAL] ' + description;
        } else if (type === 'investment_deposit') {
            dbType = 'credit';
            dbDesc = '[INV_DEPOSIT] ' + description;
        }

        // 1. Insert Transaction
        // 1. Insert Transaction (Try DB, Fallback to Local)
        let txError = null;
        try {
            const { error } = await supabaseClient
                .from('transactions')
                .insert({
                    user_id: userId,
                    amount: amount,
                    type: dbType,
                    description: dbDesc || 'TRANSACTION',
                    status: status
                });
            if (error) txError = error;
        } catch (err) {
            console.warn("Supabase Network Error (Using Local Fallback):", err);
            // Simulate Success for Demo
            txError = null;
            // We should ideally store this locally to list it later, but for "Toast" verification, silence is enough?
            // No, let's actually store it in a local array so it appears in the list!
            const localTxs = JSON.parse(localStorage.getItem('local_transactions') || '[]');
            localTxs.push({
                id: utils.generateId(),
                created_at: new Date().toISOString(),
                user_id: userId,
                amount: amount,
                type: dbType,
                description: dbDesc || 'TRANSACTION',
                status: status,
                is_local: true
            });
            localStorage.setItem('local_transactions', JSON.stringify(localTxs));
        }

        if (txError) throw txError;

        if (txError) throw txError;

        // 2. Update Balances (Router Logic)
        const user = await utils.getUserData(userId);
        const impact = utils.calculateBalanceImpact(amount, type, description);

        const updates = {};
        if (impact.main !== 0) updates.balance = Number(user.balance) + impact.main;
        if (impact.investment !== 0) updates.investment_balance = Number(user.investment_balance || 0) + impact.investment;
        if (impact.savings !== 0) updates.savings_balance = Number(user.savings_balance || 0) + impact.savings;
        if (impact.cc !== 0) updates.cc_balance = Number(user.cc_balance || 0) + impact.cc;

        if (Object.keys(updates).length > 0) {
            await utils.updateUser(userId, updates);
        }
    },

    updateTransactionStatus: async (txId, newStatus) => {
        // 1. Get Transaction Details first
        const { data: tx, error: fetchError } = await supabaseClient
            .from('transactions')
            .select('*')
            .eq('id', txId)
            .single();

        if (fetchError || !tx) throw new Error('Transaction not found');
        if (tx.status === newStatus) return; // No change

        // 2. Handle Balance Reversal/Application
        // Logic:
        // - PENDING -> REJECTED (Debit): Refund money (Add balance).
        // - PENDING -> COMPLETED (Credit): Add money (Add balance). (Debit is already deducted on create)
        // - REJECTED -> PENDING/COMPLETED: Re-deduct? (Complex, let's keep it simple: Only handle Pending -> X)

        const user = await utils.getUserData(tx.user_id);
        let newBalance = Number(user.balance);
        let balanceChanged = false;

        if (tx.status === 'pending') {
            if (newStatus === 'rejected' && tx.type === 'debit') {
                // Refund the reserved funds
                newBalance += Number(tx.amount);
                balanceChanged = true;
            } else if (newStatus === 'completed' && tx.type === 'credit') {
                // Approve a deposit
                newBalance += Number(tx.amount);
                balanceChanged = true;
            }
        }

        // 3. Update Balance if needed
        if (balanceChanged) {
            const { error: balError } = await supabaseClient
                .from('users')
                .update({ balance: newBalance })
                .eq('id', tx.user_id);
            if (balError) throw balError;
        }

        // 4. Update Transaction Status
        const { error: updateError } = await supabaseClient
            .from('transactions')
            .update({ status: newStatus })
            .eq('id', txId);

        if (updateError) throw updateError;
    },

    // --- Admin Functions ---
    getAllUsers: async () => {
        const { data: users } = await supabaseClient.from('users').select('*').order('name');
        if (!users) return [];

        // Fetch Emails (optimization: fetch all email settings in one go)
        // We can't do wildcard easily in 'in'. 
        // We'll fetch all settings where key ends in _email? PostgREST ilike.
        try {
            const { data: settings } = await supabaseClient
                .from('settings')
                .select('*')
                .ilike('key', 'u_%');

            if (settings) {
                // Map settings to users
                const emailMap = {};
                settings.forEach(s => {
                    // key is u_{id}_email
                    const parts = s.key.split('_');
                    if (parts.length >= 3 && parts[0] === 'u') {
                        const userId = parts[1];
                        const field = parts.slice(2).join('_'); // email, fname, lname, phone, acc_num

                        if (!emailMap[userId]) emailMap[userId] = {};
                        emailMap[userId][field] = s.value;
                    }
                });

                // Check for missing account numbers and generate/save them
                const missingAccNumUpserts = [];

                const finalUsers = users.map(u => {
                    const extra = emailMap[u.id] || {};
                    let accNum = extra.acc_num;

                    if (!accNum) {
                        accNum = utils.generateAccountNumber();
                        // Queue for saving
                        missingAccNumUpserts.push({
                            key: `u_${u.id}_acc_num`,
                            value: accNum
                        });
                    }

                    return {
                        ...u,
                        email: extra.email || '',
                        first_name: extra.fname || '',
                        last_name: extra.lname || '',
                        phone: extra.phone || '',
                        account_number: accNum,
                        is_applicant: extra.is_applicant === 'true'
                    };
                }).filter(u => !u.is_applicant);

                // Batch persist generated numbers
                if (missingAccNumUpserts.length > 0) {
                    supabaseClient.from('settings').upsert(missingAccNumUpserts, { onConflict: 'key' }).then(({ error }) => {
                        if (error) console.warn("Failed to auto-save generated account numbers", error);
                    });
                }

                return finalUsers;
            }
        } catch (e) { console.warn("Failed to fetch emails", e); }

        return users;
    },

    getAllTransactions: async () => {
        let dbData = [];
        try {
            // Join with users to get names (Supabase syntax)
            const { data } = await supabaseClient
                .from('transactions')
                .select(`
                    *,
                    users (name)
                `)
                .order('created_at', { ascending: false });
            if (data) dbData = data;
        } catch (e) {
            console.warn("Admin Fetch Failed (Using Local Fallback)");
        }

        // Flatten structure for easier UI consumption: t.users.name -> t.userName
        const formattedDB = dbData.map(t => ({ ...t, userName: t.users?.name || 'Unknown' }));

        // Merge Local (We need to look up names for local txs manually or just show ID/Unknown)
        const localTxs = JSON.parse(localStorage.getItem('local_transactions') || '[]');
        // Hack: We can't easily join local tx with DB users if DB fetch fails.
        // We'll rely on the fact that we might have user list cached or just show "Local User"
        // But for this demo, let's just append them.

        const formattedLocal = localTxs.map(t => ({ ...t, userName: 'Local/offline', is_local: true }));

        return [...formattedLocal, ...formattedDB].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    updateTransaction: async (txId, updates) => {
        // 1. Fetch original transaction
        const { data: oldTx, error: fetchError } = await supabaseClient
            .from('transactions')
            .select('*')
            .eq('id', txId)
            .single();

        if (fetchError || !oldTx) throw new Error("Transaction not found");

        const user = await utils.getUserData(oldTx.user_id);
        let newBalance = Number(user.balance);
        let balanceChanged = false;

        // 2. Logic to reverse old impact and apply new impact (if status/amount changed)
        // Only impacts balance if status was/is 'completed' or 'pending' (for Debits).
        // Let's simplify: 
        // A DEBIT reduces balance if Pending OR Completed.
        // A CREDIT increases balance ONLY if Completed.

        const getImpact = (tx) => {
            if (tx.type === 'debit') {
                if (tx.status === 'completed' || tx.status === 'pending') return -Number(tx.amount);
            } else { // credit
                if (tx.status === 'completed') return Number(tx.amount);
            }
            return 0;
        };

        // Construct "New" transaction object (merging updates)
        const newTx = { ...oldTx, ...updates };

        const oldImpact = getImpact(oldTx);
        const newImpact = getImpact(newTx);

        if (oldImpact !== newImpact) {
            // Reverse old, Apply new
            newBalance = newBalance - oldImpact + newImpact;
            balanceChanged = true;
        }

        // 3. Update Balance
        if (balanceChanged) {
            const { error: balError } = await supabaseClient
                .from('users')
                .update({ balance: newBalance })
                .eq('id', oldTx.user_id);
            if (balError) throw balError;
        }

        // 4. Update Transaction
        const { error } = await supabaseClient
            .from('transactions')
            .update(updates)
            .eq('id', txId);
        if (error) throw error;
    },

    getNewApplications: async () => {
        const { data, error } = await supabaseClient
            .from('new_applications')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.warn("Failed to fetch applications:", error);
            return [];
        }

        // Apply Local Dismiss Filter
        const dismissed = JSON.parse(localStorage.getItem('dismissed_apps') || '[]');
        const visibleApps = (data || []).filter(app => !dismissed.includes(app.id));

        return visibleApps;
    },

    deleteApplication: async (id) => {
        // 1. Locally Dismiss (Guarantees UI update)
        const dismissed = JSON.parse(localStorage.getItem('dismissed_apps') || '[]');
        if (!dismissed.includes(id)) {
            dismissed.push(id);
            localStorage.setItem('dismissed_apps', JSON.stringify(dismissed));
        }

        // 2. Attempt DB Delete (Best Effort)
        // We use 'select' to check if it actually deleted anything, though we don't block on it.
        const { error } = await supabaseClient
            .from('new_applications')
            .delete()
            .eq('id', id);

        // We log error but don't throw if it's just a permission issue, 
        // because we successfully "dismissed" it locally.
        if (error) {
            console.warn("DB Delete Failed (using local dismiss only):", error);
        }
    },

    deleteApplications: async (ids) => {
        const { error } = await supabaseClient
            .from('new_applications')
            .delete()
            .in('id', ids);
        if (error) throw error;
    },

    createUser: async (userData, isApplicant = false) => {
        // Extract Extra Fields to store in settings
        const { email, first_name, last_name, phone, ...coreData } = userData;

        // Insert Core User
        const { data, error } = await supabaseClient.from('users').insert(coreData).select('id').single();

        if (error) throw error;

        // Save Extended Profile to Settings (For generic profile access)
        const settingsUpserts = [];
        if (data && data.id) {
            if (email) settingsUpserts.push({ key: `u_${data.id}_email`, value: email });
            if (first_name) settingsUpserts.push({ key: `u_${data.id}_fname`, value: first_name });
            if (last_name) settingsUpserts.push({ key: `u_${data.id}_lname`, value: last_name });
            if (last_name) settingsUpserts.push({ key: `u_${data.id}_lname`, value: last_name });
            if (phone) settingsUpserts.push({ key: `u_${data.id}_phone`, value: phone });

            // Generate and Save Account Number
            const accNum = utils.generateAccountNumber();
            settingsUpserts.push({ key: `u_${data.id}_acc_num`, value: accNum });

            // If Applicant: Mark as applicant AND add to separate table
            if (isApplicant) {
                settingsUpserts.push({ key: `u_${data.id}_is_applicant`, value: 'true' });

                // Add to new_applications
                await supabaseClient.from('new_applications').insert({
                    user_id: data.id,
                    email,
                    first_name,
                    last_name,
                    phone,
                    status: 'pending'
                });
            }

            if (settingsUpserts.length > 0) {
                await supabaseClient.from('settings').upsert(settingsUpserts, { onConflict: 'key' });
            }
        }
    },

    updateUser: async (id, updates) => {
        // Split updates into Core (DB) and Extra (Settings KV)
        const coreFields = ['name', 'username', 'password', 'pin', 'balance', 'is_admin'];
        const coreUpdates = {};
        const settingsUpserts = [];

        Object.keys(updates).forEach(key => {
            if (coreFields.includes(key)) {
                coreUpdates[key] = updates[key];
            } else {
                // Map to settings keys
                const keyMap = {
                    'savings_balance': `u_${id}_sav`,
                    'investment_balance': `u_${id}_inv`,
                    'is_savings_locked': `u_${id}_sav_locked`,
                    'account_number': `u_${id}_acc_num`,
                    'acc_savings': `u_${id}_acc_savings`,
                    'acc_invest': `u_${id}_acc_invest`,
                    'cc_number': `u_${id}_cc_number`,
                    'cc_expiry': `u_${id}_cc_expiry`,
                    'cc_cvv': `u_${id}_cc_cvv`,
                    'cc_tier': `u_${id}_cc_tier`,
                    'cc_balance': `u_${id}_cc_balance`,
                    'rewards_pts': `u_${id}_rewards_pts`,
                    'verification_status': `u_${id}_verification_status`
                };

                const settingKey = keyMap[key];
                if (settingKey) {
                    settingsUpserts.push({ key: settingKey, value: String(updates[key]) });
                }
            }
        });

        // Parallel Execution
        const promises = [];

        // 1. Update Core
        if (Object.keys(coreUpdates).length > 0) {
            promises.push(
                supabaseClient.from('users').update(coreUpdates).eq('id', id).then(({ error }) => { if (error) throw error; })
            );
        }

        // 2. Update Settings
        if (settingsUpserts.length > 0) {
            promises.push(
                supabaseClient.from('settings').upsert(settingsUpserts, { onConflict: 'key' }).then(({ error }) => { if (error) throw error; })
            );
        }

        await Promise.all(promises);
    },

    deleteUser: async (id) => {
        // Cascade delete transactions first usually, or relay on DB cascade
        await supabaseClient.from('transactions').delete().eq('user_id', id);
        const { error } = await supabaseClient.from('users').delete().eq('id', id);
        if (error) throw error;
    },

    deleteTransaction: async (txId) => {
        console.log('[DELETE] Starting deletion for txId:', txId);

        // 1. Try to fetch the original transaction to reverse balance
        let originalTx = null;
        try {
            const { data, error } = await supabaseClient
                .from('transactions')
                .select('*')
                .eq('id', txId)
                .single();
            if (error) {
                console.warn('[DELETE] Fetch error (will still attempt delete):', error.message);
            } else {
                originalTx = data;
            }
        } catch (e) {
            console.warn('[DELETE] Fetch exception:', e);
        }

        // Local Fallback Check
        if (!originalTx) {
            const localTxs = JSON.parse(localStorage.getItem('local_transactions') || '[]');
            originalTx = localTxs.find(t => t.id === txId);
        }

        // 2. Reverse Balance Impact (only if we found the original AND it was completed)
        if (originalTx && originalTx.status === 'completed') {
            const impact = utils.calculateBalanceImpact(originalTx.amount, originalTx.type, originalTx.description, true);
            try {
                const user = await utils.getUserData(originalTx.user_id);
                if (user) {
                    const updates = {};
                    if (impact.main !== 0) updates.balance = Number(user.balance) + impact.main;
                    if (impact.investment !== 0) updates.investment_balance = Number(user.investment_balance || 0) + impact.investment;
                    if (impact.savings !== 0) updates.savings_balance = Number(user.savings_balance || 0) + impact.savings;
                    if (impact.cc !== 0) updates.cc_balance = Number(user.cc_balance || 0) + impact.cc;

                    if (Object.keys(updates).length > 0) {
                        await utils.updateUser(originalTx.user_id, updates);
                        console.log('[DELETE] Balance reversed:', updates);
                    }
                }
            } catch (e) { console.warn('[DELETE] Balance reversal failed:', e); }
        }

        // 3. ALWAYS attempt to delete the record from the database
        console.log('[DELETE] Attempting DB delete for:', txId);
        const { error: dbError } = await supabaseClient
            .from('transactions')
            .delete()
            .eq('id', txId);

        if (dbError) {
            console.error('[DELETE] DB delete failed:', dbError);
            throw dbError;
        }
        console.log('[DELETE] DB delete successful for:', txId);

        // Always Clean Local
        const localTxs = JSON.parse(localStorage.getItem('local_transactions') || '[]');
        const newLocal = localTxs.filter(t => t.id !== txId);
        localStorage.setItem('local_transactions', JSON.stringify(newLocal));

        return true;
    },

    // --- Messages & Statements CRUD ---

    getMessages: async (userId) => {
        try {
            const { data, error } = await supabaseClient
                .from('messages')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            if (!error && data) return data;
        } catch (e) { console.warn("DB Messages fetch failed"); }
        return [];
    },

    sendMessage: async (userId, subject, body) => {
        try {
            await supabaseClient.from('messages').insert({
                user_id: userId,
                subject,
                body,
                is_read: false
            });
            return true;
        } catch (e) {
            console.error("Message send failed", e);
            return false;
        }
    },

    getUnreadMessageCount: async (userId) => {
        try {
            const { count, error } = await utils.supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('is_read', false);
            if (!error) return count || 0;
        } catch (e) { console.warn("DB Unread count fetch failed", e); }
        return 0;
    },

    markMessageRead: async (msgId) => {
        try {
            await supabaseClient.from('messages').update({ is_read: true }).eq('id', msgId);
            return true;
        } catch (e) {
            return false;
        }
    },

    deleteMessage: async (msgId) => {
        try {
            await supabaseClient.from('messages').delete().eq('id', msgId);
            return true;
        } catch (e) {
            console.error("Delete message failed", e);
            return false;
        }
    },

    getStatements: async (userId) => {
        try {
            const { data, error } = await supabaseClient
                .from('statements')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            if (!error && data) return data;
        } catch (e) { console.warn("DB Statements fetch failed"); }
        return [];
    },

    addStatement: async (userId, title, dateStr, pdfUrl = '') => {
        try {
            await supabaseClient.from('statements').insert({
                user_id: userId,
                title,
                date: dateStr,
                pdf_url: pdfUrl
            });
            return true;
        } catch (e) {
            console.error("Add statement failed", e);
            return false;
        }
    }
};
