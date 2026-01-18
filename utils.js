// --- Supabase Config ---
const SUPABASE_URL = 'https://igwvqcwwrrrwunsgykxk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_KCtVujwVKyQsw4vVrWrMFw_j-eZOKzP'; // User provided key

// Initialize Client (Relies on CDN script being loaded in HTML)
let supabaseClient = null;

const utils = {
    init: () => {
        if (window.supabase) {
            const { createClient } = window.supabase;
            supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
            console.log('Supabase Connected');
        } else {
            console.error('Supabase SDK not loaded');
        }
    },

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
        window.location.href = 'index.html';
    },

    // --- Data Formatting ---
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    generateId: () => crypto.randomUUID(), // Use native UUID

    // --- Async Data Access ---

    // Get full user data (with balance)
    getUserData: async (userId) => {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        return data;
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
        const { data, error } = await supabaseClient
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        return data || [];
    },

    // Create a transaction
    createTransaction: async (userId, amount, type, description, status = 'completed') => {
        // 1. Insert Transaction
        const { error: txError } = await supabaseClient
            .from('transactions')
            .insert({
                user_id: userId,
                amount: amount,
                type: type,
                description: description || 'TRANSACTION',
                status: status
            });

        if (txError) throw txError;

        // 2. Update User Balance (only if completed/approved)
        if (type === 'debit' || (type === 'credit' && status === 'completed')) {
            const user = await utils.getUserData(userId);
            let newBalance = Number(user.balance);

            // If creating a DEBIT (Wire), we deduct immediately even if pending (funds reserved)
            // If creating a CREDIT (Deposit), we only add if completed.

            if (type === 'debit') newBalance -= amount;
            else if (type === 'credit') newBalance += amount;

            const { error: balError } = await supabaseClient
                .from('users')
                .update({ balance: newBalance })
                .eq('id', userId);

            if (balError) throw balError;
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
        const { data } = await supabaseClient.from('users').select('*').order('name');
        return data || [];
    },

    getAllTransactions: async () => {
        // Join with users to get names (Supabase syntax)
        const { data } = await supabaseClient
            .from('transactions')
            .select(`
                *,
                users (name)
            `)
            .order('created_at', { ascending: false });

        // Flatten structure for easier UI consumption: t.users.name -> t.userName
        return data.map(t => ({ ...t, userName: t.users?.name || 'Unknown' }));
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

    createUser: async (userData) => {
        // Ensure PIN falls back to defaults if not provided, though DB default handles it too
        const { error } = await supabaseClient.from('users').insert(userData);
        if (error) throw error;
    },

    updateUser: async (id, updates) => {
        const { error } = await supabaseClient.from('users').update(updates).eq('id', id);
        if (error) throw error;
    },

    deleteUser: async (id) => {
        // Cascade delete transactions first usually, or relay on DB cascade
        await supabaseClient.from('transactions').delete().eq('user_id', id);
        const { error } = await supabaseClient.from('users').delete().eq('id', id);
        if (error) throw error;
    },
    deleteTransaction: async (txId) => {
        // 1. Fetch original to reverse balance
        const { data: originalTx, error: fetchError } = await supabaseClient
            .from('transactions')
            .select('*')
            .eq('id', txId)
            .single();

        if (fetchError || !originalTx) throw new Error('Transaction not found');

        // 2. Reverse Balance Impact
        if (originalTx.status === 'completed') {
            const negation = originalTx.type === 'credit' ? -originalTx.amount : originalTx.amount;

            // Apply negation
            const { error: balanceError } = await supabaseClient.rpc('increment_balance', {
                user_id: originalTx.user_id,
                amount: negation
            });

            if (balanceError) {
                // Fallback if RPC fails or doesn't exist (simulated approach)
                const { data: user } = await supabaseClient.from('users').select('balance').eq('id', originalTx.user_id).single();
                if (user) {
                    await supabaseClient.from('users').update({ balance: user.balance + negation }).eq('id', originalTx.user_id);
                }
            }
        }

        // 3. Delete Record
        const { error: deleteError } = await supabaseClient
            .from('transactions')
            .delete()
            .eq('id', txId);

        if (deleteError) throw deleteError;
        return true;
    }
};
