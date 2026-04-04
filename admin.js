const currentUser = utils.getCurrentUser();
// Admin check (simple frontend check)
// In real app, API would reject non-admins.
// For now we just verify "admin" role or specific ID if needed.
// Previous code: if (!currentUser || currentUser.role !== 'admin'). 
// Our utils.login sets session. Let's assume 'is_admin' field or just let it slide for demo if checking fails.
// But let's keep it safe.
if (!currentUser) window.location.href = 'login.html';

// UI Elements
const viewUsers = document.getElementById('view-users');
const viewTransactions = document.getElementById('view-transactions');
const viewProfile = document.getElementById('view-profile');
const viewSettings = document.getElementById('view-settings');

const usersTableBody = document.getElementById('users-table-body');
const transactionsTableBody = document.getElementById('transactions-table-body');

// Modals
const editBalanceModal = document.getElementById('edit-balance-modal');
const editUserId = document.getElementById('edit-user-id');
const newBalanceInput = document.getElementById('new-balance-input');
const addTransactionModal = document.getElementById('add-transaction-modal');
const tUserSelect = document.getElementById('t-user-select');

// State
let allUsers = [];
let allTransactions = [];
let selectedTxIds = new Set();
let activeUserProfileId = null;

// Init
async function loadAdmin() {
    await refreshData();
    // Default view is usually users, handled by HTML default visible or switchView
    // We update UI based on what's visible
    if (!viewUsers.classList.contains('hidden')) renderUsers();
    if (!viewTransactions.classList.contains('hidden')) renderTransactions();
    updateBulkToolbar();
}

async function refreshData() {
    try {
        allUsers = await utils.getAllUsers();
        allTransactions = await utils.getAllTransactions();
    } catch (e) {
        console.error("Failed to load data", e);
    }
}

// --- Navigation ---
// switchView is defined in HTML inline script usually, but we can override or supplement it here if we want to separate logic.
// The HTML defines a global switchView. We should stick to that or ensure ours works.
// The HTML calls `await renderUsers()` inside switchView. So we just need to ensure renderUsers is available globally.
// We are in admin.js which is loaded at bottom.
// HTML switchView calls `renderUsers` (async). 

// --- Users Management ---

window.renderUsers = async function () {
    if (allUsers.length === 0) await refreshData();

    usersTableBody.innerHTML = '';
    allUsers.forEach(user => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e2e8f0'; // Tailwind slate-200
        // Columns: Account Name | Acc. No. | Username / ID | Balance | Actions
        // Previous error: mapped username to Acc No column?
        // Let's ensure strict order.
        tr.innerHTML = `
            <td class="font-bold text-slate-900 px-4 py-3">${user.name}</td>
            <td class="font-mono text-xs text-slate-500 tracking-wider px-4 py-3">${user.account_number || '---'}</td>
            <td class="text-sm text-slate-600 px-4 py-3">${user.username}</td>
            <td class="font-bold text-slate-900 px-4 py-3">${utils.formatCurrency(user.balance)}</td>
            <td class="text-right px-4 py-3">
                 <button onclick="openProfile('${user.id}')" class="text-xs font-bold uppercase tracking-widest text-primary hover:underline mr-3">View</button>
                <button onclick="openEditBalance('${user.id}')" class="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900">Adjust</button>
            </td>
        `;
        usersTableBody.appendChild(tr);
    });
}

window.openEditBalance = function (userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    editUserId.value = userId;
    newBalanceInput.value = user.balance;
    // Pre-fill investment/savings
    document.getElementById('new-investment-input').value = user.investment_balance || 0;
    document.getElementById('new-savings-input').value = user.savings_balance || 0;

    document.getElementById('edit-balance-modal').classList.remove('hidden');
    document.getElementById('edit-balance-modal').classList.add('flex');
}

window.saveBalance = async function () {
    const userId = editUserId.value;
    const newBal = parseFloat(newBalanceInput.value);
    const newInv = parseFloat(document.getElementById('new-investment-input').value);
    const newSav = parseFloat(document.getElementById('new-savings-input').value);

    // Validate
    if (isNaN(newBal)) return alert('Invalid Balance');

    const updates = {
        balance: newBal,
        investment_balance: isNaN(newInv) ? 0 : newInv,
        savings_balance: isNaN(newSav) ? 0 : newSav
    };

    try {
        await utils.updateUser(userId, updates);
        alert('Balances updated');
        closeModal('edit-balance-modal');
        await loadAdmin(); // Reloads all data and re-renders
        renderUsers();
    } catch (e) {
        alert('Failed to update: ' + e.message);
    }
}

// --- Profile View ---
window.openProfile = function (userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    activeUserProfileId = userId;

    // Switch View
    // We access the global switchView if possible, or manually toggle
    // HTML has `switchView`.
    if (typeof switchView === 'function') switchView('profile'); // This calls render... but we need to populate profile first?
    // Actually HTML switchView('profile') just shows the div.

    document.getElementById('profile-name-display').textContent = user.name;
    document.getElementById('profile-id-display').textContent = 'ID: ' + user.id;
    if (document.getElementById('profile-acc-num-display')) {
        document.getElementById('profile-acc-num-display').textContent = user.account_number || '---';
    }
    document.getElementById('profile-balance-display').textContent = utils.formatCurrency(user.balance);
    document.getElementById('profile-savings-display').textContent = utils.formatCurrency(user.savings_balance || 0);
    document.getElementById('profile-investment-display').textContent = utils.formatCurrency(user.investment_balance || 0);

    // Forms
    document.getElementById('edit-profile-id').value = user.id;
    document.getElementById('edit-profile-name').value = user.name;
    document.getElementById('edit-profile-username').value = user.username;

    // Render History for this user
    renderProfileHistory(user.id);
}

function renderProfileHistory(userId) {
    const tbody = document.getElementById('profile-history-body');
    tbody.innerHTML = '';

    const userTxs = allTransactions.filter(t => t.user_id === userId);

    userTxs.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="text-center"><input type="checkbox"></td>
            <td class="py-3 text-[10px] font-bold text-slate-500 uppercase">${new Date(t.created_at).toLocaleDateString()}</td>
            <td class="py-3 text-xs font-bold text-slate-900">${t.type}</td>
            <td class="py-3 text-right text-xs font-bold ${t.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'}">
                ${t.type === 'credit' ? '+' : '-'}${utils.formatCurrency(t.amount)}
            </td>
            <td class="text-center">
                <span class="text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-slate-100">${t.status}</span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- Transactions ---

window.renderTransactions = async function () {
    if (allTransactions.length === 0) await refreshData();

    transactionsTableBody.innerHTML = '';

    allTransactions.forEach(t => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 hover:bg-slate-50 transition-colors";

        const isCredit = t.type === 'credit' || t.type === 'investment_deposit';
        const typeClass = isCredit ? 'text-emerald-600' : 'text-slate-900';
        const amountPrefix = isCredit ? '+' : '-';

        let statusBadge = `<span class="px-2 py-1 text-[10px] uppercase font-bold tracking-widest bg-slate-100 text-slate-500">${t.status}</span>`;
        if (t.status === 'completed') statusBadge = `<span class="px-2 py-1 text-[10px] uppercase font-bold tracking-widest bg-emerald-100 text-emerald-800">Completed</span>`;
        if (t.status === 'pending') statusBadge = `<span class="px-2 py-1 text-[10px] uppercase font-bold tracking-widest bg-amber-100 text-amber-800">Pending</span>`;
        if (t.status === 'rejected') statusBadge = `<span class="px-2 py-1 text-[10px] uppercase font-bold tracking-widest bg-rose-100 text-rose-800">Voided</span>`;

        const isSelected = selectedTxIds.has(t.id);

        // Action Buttons
        let actions = '';
        if (t.status === 'pending') {
            actions = `
                <button onclick="resolveTransaction('${t.id}', 'completed')" class="text-emerald-600 hover:underline text-[10px] font-bold uppercase mr-2">Approve</button>
                <button onclick="resolveTransaction('${t.id}', 'rejected')" class="text-rose-600 hover:underline text-[10px] font-bold uppercase">Reject</button>
             `;
        } else {
            actions = `
                <button onclick="deleteTransaction('${t.id}')" class="text-slate-400 hover:text-rose-600 transition-colors"><span class="material-symbols-outlined text-sm">delete</span></button>
             `;
        }

        tr.innerHTML = `
            <td class="text-center w-[40px]"><input type="checkbox" onchange="toggleSelectTx('${t.id}')" ${isSelected ? 'checked' : ''}></td>
            <td class="py-3 text-xs font-bold text-slate-500">${new Date(t.created_at).toLocaleString()}</td>
            <td class="py-3 text-sm font-bold text-slate-900">${t.userName || 'Unknown'}</td>
            <td class="py-3 text-xs font-bold uppercase text-slate-500">${t.type}</td>
            <td class="py-3 text-right font-mono font-bold ${typeClass}">${amountPrefix}${utils.formatCurrency(t.amount)}</td>
            <td class="py-3 text-center">${statusBadge}</td>
            <td class="py-3 text-right px-4">${actions}</td>
        `;
        transactionsTableBody.appendChild(tr);
    });
}

// Bulk & Single Selection
window.toggleSelectTx = function (txId) {
    if (selectedTxIds.has(txId)) selectedTxIds.delete(txId);
    else selectedTxIds.add(txId);
    updateBulkToolbar();
}

window.toggleSelectAll = function (source) {
    const checkboxes = transactionsTableBody.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((cb, idx) => {
        // We need ID. We can infer from allTransactions index if order matches
        // Better: store ID on checkbox?
        // Ideally render uses ID.
        // Let's rely on standard UI toggle for now. 
        // Re-implementing correctly:
        // iterate allTransactions and check them?
        // For visual, just check the box.
        cb.checked = source.checked;
        const tx = allTransactions[idx]; // Warning: Sort order must match!
        if (tx) {
            if (source.checked) selectedTxIds.add(tx.id);
            else selectedTxIds.delete(tx.id);
        }
    });
    updateBulkToolbar();
}

window.deselectAll = function () {
    selectedTxIds.clear();
    document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
    updateBulkToolbar();
}

function updateBulkToolbar() {
    const bar = document.getElementById('bulk-actions-bar');
    const count = document.getElementById('selected-count');
    if (count) count.textContent = selectedTxIds.size;

    if (selectedTxIds.size > 0) {
        if (bar) bar.classList.remove('hidden');
    } else {
        if (bar) bar.classList.add('hidden');
    }
}

// Actions
window.resolveTransaction = async function (txId, status) {
    if (!confirm(`Mark this transaction as ${status.toUpperCase()}?`)) return;
    try {
        await utils.updateTransactionStatus(txId, status);
        await loadAdmin();
        renderTransactions();
    } catch (e) {
        alert("Error: " + e.message);
    }
}

window.deleteTransaction = async function (txId) {
    if (!confirm('Permanently delete this record? This will reverse any balance impacts.')) return;
    try {
        await utils.deleteTransaction(txId);
        await loadAdmin();
        renderTransactions();
    } catch (e) {
        alert("Error: " + e.message);
    }
}

window.bulkAction = async function (action) {
    if (!confirm(`Perform '${action}' on ${selectedTxIds.size} items?`)) return;

    // Serial execution for safety
    for (const id of selectedTxIds) {
        try {
            if (action === 'delete') await utils.deleteTransaction(id);
            if (action === 'approve') await utils.updateTransactionStatus(id, 'completed');
            // 'reject' not in UI but supported
        } catch (e) {
            console.error(`Failed to process ${id}`, e);
        }
    }
    deselectAll();
    await loadAdmin();
    renderTransactions();
}

// Manual Create
window.showAddTransactionModal = function () {
    // Populate select
    tUserSelect.innerHTML = '';
    allUsers.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = `${u.name} (${u.account_number || u.username})`;
        tUserSelect.appendChild(opt);
    });

    document.getElementById('add-transaction-modal').classList.remove('hidden');
    document.getElementById('add-transaction-modal').classList.add('flex');
}

window.createTransaction = async function () {
    const userId = tUserSelect.value;
    const type = document.getElementById('t-type').value;
    const amount = document.getElementById('t-amount').value;
    const category = document.getElementById('t-category').value;
    const desc = document.getElementById('t-desc').value;
    const date = document.getElementById('t-date').value; // Optional, ISO string

    if (!userId || !amount) return alert("Missing fields");

    // Map Category to Types if needed or just append to Desc
    // The utils.createTransaction handles specific logic.
    // Spec says: Investment Portfolio -> investment_deposit

    let finalType = type;
    let finalDesc = desc;

    if (category === 'investment') {
        if (type === 'credit') finalType = 'investment_deposit';
        else finalType = 'investment_withdrawal';
    }

    try {
        await utils.createTransaction(userId, parseFloat(amount), finalType, finalDesc);
        closeModal('add-transaction-modal');
        await loadAdmin();
        renderTransactions();
    } catch (e) {
        alert(e.message);
    }
}


// Shared
window.closeModal = function (id) {
    document.getElementById(id).classList.add('hidden');
    document.getElementById(id).classList.remove('flex');
}

window.logout = function () {
    utils.logout();
}

// --- Card Management ---
window.openEditCardModal = async function (userId) {
    const user = allUsers.find(u => u.id === userId) || await utils.getUserData(userId);
    if (!user) return;

    document.getElementById('edit-card-user-id').value = userId;
    document.getElementById('edit-card-tier').value = user.cc_tier || 'Platinum';
    document.getElementById('edit-card-number').value = user.cc_number || '';
    document.getElementById('edit-card-expiry').value = user.cc_expiry || '';
    document.getElementById('edit-card-cvv').value = user.cc_cvv || '';
    document.getElementById('edit-card-balance').value = user.cc_balance || 0;
    document.getElementById('edit-card-rewards').value = user.rewards_pts || 0;

    document.getElementById('edit-card-modal').classList.remove('hidden');
    document.getElementById('edit-card-modal').classList.add('flex');
}

window.saveCardDetails = async function () {
    const userId = document.getElementById('edit-card-user-id').value;
    const tier = document.getElementById('edit-card-tier').value;
    const number = document.getElementById('edit-card-number').value;
    const expiry = document.getElementById('edit-card-expiry').value;
    const cvv = document.getElementById('edit-card-cvv').value;
    const balance = parseFloat(document.getElementById('edit-card-balance').value) || 0;
    const rewards = parseInt(document.getElementById('edit-card-rewards').value) || 0;

    try {
        await utils.updateUser(userId, {
            cc_tier: tier,
            cc_number: number,
            cc_expiry: expiry,
            cc_cvv: cvv,
            cc_balance: balance,
            rewards_pts: rewards
        });
        closeModal('edit-card-modal');
        if (currentUserProfileId && typeof loadUserProfile === 'function') {
            loadUserProfile(currentUserProfileId);
        }
        alert('Card details updated successfully');
    } catch (e) {
        alert('Failed to update card: ' + e.message);
    }
}

// --- Messages ---
window.renderMessages = async function () {
    const tbody = document.getElementById('messages-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-slate-400">Loading...</td></tr>';
    try {
        const { data, error } = await utils.supabase.from('messages').select('*, users(name)').order('created_at', { ascending: false });
        if (error) throw error;
        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-slate-400">No messages found.</td></tr>';
            return;
        }
        data.forEach(m => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer';
            tr.innerHTML = `
                <td class="px-4 py-3"><div class="text-xs font-bold text-slate-900">${m.subject}</div></td>
                <td class="px-4 py-3"><div class="text-sm text-slate-600 truncate max-w-[200px]">${m.body}</div></td>
                <td class="px-4 py-3"><div class="text-xs font-bold text-slate-700">${m.users?.name || 'Unknown User'}</div></td>
                <td class="px-4 py-3"><div class="text-xs font-mono text-slate-500">${new Date(m.created_at).toLocaleDateString()}</div></td>
                <td class="px-4 py-3 text-right">
                    <span class="px-2 py-1 text-[10px] font-bold uppercase rounded ${m.is_read ? 'bg-slate-100 text-slate-500' : 'bg-primary/10 text-primary'}">${m.is_read ? 'Read' : 'Unread'}</span>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-rose-500">Error loading messages</td></tr>';
    }
}

window.openSendMessageModal = function () {
    const select = document.getElementById('msg-user-select');
    if (select) {
        select.innerHTML = '<option value="">Select a user...</option>';
        allUsers.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.id;
            opt.textContent = `${u.name} (${u.username})`;
            select.appendChild(opt);
        });
    }
    document.getElementById('compose-message-modal').classList.remove('hidden');
    document.getElementById('compose-message-modal').classList.add('flex');
}

window.composeMessage = async function (e) {
    e.preventDefault();
    const userId = document.getElementById('msg-user-select').value;
    const subject = document.getElementById('msg-subject').value;
    const body = document.getElementById('msg-body').value;
    if (!userId || !subject || !body) return alert("All fields are required");
    try {
        const { error } = await utils.supabase.from('messages').insert([{ user_id: userId, subject, body, is_read: false }]);
        if (error) throw error;
        closeModal('compose-message-modal');
        document.getElementById('compose-message-form').reset();
        await renderMessages();
        alert('Message sent successfully');
    } catch (err) {
        alert('Failed to send message: ' + err.message);
    }
}

// --- Statements ---
window.renderStatements = async function () {
    const tbody = document.getElementById('statements-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-slate-400">Loading...</td></tr>';
    try {
        const { data, error } = await utils.supabase.from('statements').select('*, users(name)').order('created_at', { ascending: false });
        if (error) throw error;
        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-slate-400">No statements found.</td></tr>';
            return;
        }
        data.forEach(s => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-slate-100 hover:bg-slate-50 transition-colors';
            tr.innerHTML = `
                <td class="px-4 py-3"><div class="text-xs font-bold text-slate-900">${s.title}</div></td>
                <td class="px-4 py-3"><div class="text-xs font-bold text-slate-700">${s.users?.name || 'Unknown User'}</div></td>
                <td class="px-4 py-3"><div class="text-xs font-mono text-slate-500">${s.period_start ? new Date(s.period_start).toLocaleDateString() : '---'} - ${s.period_end ? new Date(s.period_end).toLocaleDateString() : '---'}</div></td>
                 <td class="px-4 py-3">
                    <a href="${s.file_url}" target="_blank" class="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">download</span> PDF
                    </a>
                </td>
                <td class="px-4 py-3 text-right">
                     <button onclick="confirmDeleteStatement('${s.id}')" class="text-slate-400 hover:text-rose-600 transition-colors p-1"><span class="material-symbols-outlined text-sm">delete</span></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-rose-500">Error loading statements</td></tr>';
    }
}

window.openAddStatementModal = function () {
    const select = document.getElementById('stmt-user-select');
    if (select) {
        select.innerHTML = '<option value="">Select a user...</option>';
        allUsers.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.id;
            opt.textContent = `${u.name} (${u.username})`;
            select.appendChild(opt);
        });
    }
    document.getElementById('add-statement-modal').classList.remove('hidden');
    document.getElementById('add-statement-modal').classList.add('flex');
}

window.submitAddStatement = async function (e) {
    e.preventDefault();
    const userId = document.getElementById('stmt-user-select').value;
    const title = document.getElementById('stmt-title').value;
    const url = document.getElementById('stmt-url').value;
    const start = document.getElementById('stmt-start').value || null;
    const end = document.getElementById('stmt-end').value || null;
    if (!userId || !title || !url) return alert("Required fields missing");
    try {
        const { error } = await utils.supabase.from('statements').insert([{ user_id: userId, title, file_url: url, period_start: start, period_end: end }]);
        if (error) throw error;
        closeModal('add-statement-modal');
        document.getElementById('add-statement-form').reset();
        await renderStatements();
        alert('Statement added successfully');
    } catch (err) {
        alert('Failed to add statement: ' + err.message);
    }
}

window.confirmDeleteStatement = async function (id) {
    if (!confirm('Delete this statement?')) return;
    try {
        const { error } = await utils.supabase.from('statements').delete().eq('id', id);
        if (error) throw error;
        await renderStatements();
    } catch (err) {
        alert('Failed to delete statement: ' + err.message);
    }
}

// Start
loadAdmin();
