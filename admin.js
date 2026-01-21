const currentUser = utils.getCurrentUser();
if (!currentUser || currentUser.role !== 'admin') {
    window.location.href = 'login.html';
}

// UI Elements
const viewUsers = document.getElementById('view-users');
const viewTransactions = document.getElementById('view-transactions');
const usersTableBody = document.getElementById('users-table-body');
const transactionsTableBody = document.getElementById('transactions-table-body');
const btns = document.querySelectorAll('.admin-tab-btn');

const editBalanceModal = document.getElementById('edit-balance-modal');
const editUserId = document.getElementById('edit-user-id');
const newBalanceInput = document.getElementById('new-balance-input');

const addTransactionModal = document.getElementById('add-transaction-modal');
const tUserSelect = document.getElementById('t-user-select');

// State
let db = utils.getDB();
let selectedTxIds = new Set();

// Init
function loadAdmin() {
    db = utils.getDB(); // refresh
    selectedTxIds.clear(); // Clear selection on reload
    updateBulkToolbar();
    renderUsers();
    renderTransactions();
}

function switchView(viewName) {
    btns.forEach(b => b.classList.remove('active'));

    if (viewName === 'users') {
        viewUsers.style.display = 'block';
        viewTransactions.style.display = 'none';
        btns[0].classList.add('active');
    } else {
        viewUsers.style.display = 'none';
        viewTransactions.style.display = 'block';
        btns[1].classList.add('active');
        renderTransactions(); // Refresh in case of updates
    }
}

// --- Users Management ---

function renderUsers() {
    usersTableBody.innerHTML = '';
    db.users.forEach(user => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--glass-border)';
        tr.innerHTML = `
            <td style="padding: 12px; color: var(--text-muted); font-size: 0.8rem;">${user.id}</td>
            <td style="padding: 12px; font-weight: 500;">${user.name}</td>
            <td style="padding: 12px;">${user.username}</td>
            <td style="padding: 12px; font-weight: 600;">${utils.formatCurrency(user.balance)}</td>
            <td style="padding: 12px;">
                <button onclick="openEditBalance('${user.id}')" class="btn btn-primary action-btn">Edit Balance</button>
            </td>
        `;
        usersTableBody.appendChild(tr);
    });
}

function openEditBalance(userId) {
    const user = db.users.find(u => u.id === userId);
    if (!user) return;

    editUserId.value = userId;
    newBalanceInput.value = user.balance;
    // Pre-fill investment input
    const invInput = document.getElementById('new-investment-input');
    if (invInput) invInput.value = user.investmentBalance || 0;

    // Pre-fill savings input
    const savInput = document.getElementById('new-savings-input');
    if (savInput) savInput.value = user.savingsBalance || 0;

    editBalanceModal.style.display = 'block';
}

function saveBalance() {
    const userId = editUserId.value;
    const newBal = parseFloat(newBalanceInput.value);
    const newInv = parseFloat(document.getElementById('new-investment-input').value);
    const newSav = parseFloat(document.getElementById('new-savings-input').value);

    // Validate inputs (allow 0)
    if (isNaN(newBal) || isNaN(newInv)) {
        alert('Invalid amounts entered');
        return;
    }

    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        // Update Balances
        db.users[userIndex].balance = newBal;
        db.users[userIndex].investmentBalance = newInv;

        // Settings/Savings logic if needed, but here we persist directly to user object
        // If savings is used: db.users[userIndex].savingsBalance = newSav; 

        utils.saveDB(db);
        alert('Balances updated successfully');
        closeModal('edit-balance-modal');
        loadAdmin();
    }
}


// --- Transactions Management ---

function renderTransactions() {
    transactionsTableBody.innerHTML = '';

    // Flatten transactions from all users
    let allTransactions = [];
    db.users.forEach(user => {
        user.transactions.forEach(t => {
            allTransactions.push({ ...t, userId: user.id, userName: user.name });
        });
    });

    // Sort by date desc
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    allTransactions.forEach(t => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--glass-border)';

        // Contextual Actions
        let actionButtons = '';
        if (t.status === 'pending') {
            actionButtons += `<button onclick="resolveTransaction('${t.userId}', '${t.id}', 'approve')" class="btn btn-primary action-btn" style="background: var(--success-color);">Approve</button>`;
            actionButtons += `<button onclick="resolveTransaction('${t.userId}', '${t.id}', 'reject')" class="btn btn-danger action-btn">Reject</button>`;
        } else {
            actionButtons += `<button onclick="deleteTransaction('${t.userId}', '${t.id}')" class="btn action-btn" style="background: rgba(255,255,255,0.1);">Delete</button>`;
        }

        const typeColor = t.type === 'credit' ? 'var(--success-color)' : 'var(--danger-color)';
        const amountDisplay = (t.type === 'credit' ? '+' : '-') + utils.formatCurrency(t.amount);
        const isSelected = selectedTxIds.has(t.id);

        tr.innerHTML = `
            <td class="text-center"><input type="checkbox" onchange="toggleSelectTx('${t.id}')" ${isSelected ? 'checked' : ''}></td>
            <td style="padding: 12px; font-size: 0.8rem;">${new Date(t.date).toLocaleDateString()}</td>
            <td style="padding: 12px;">${t.userName}</td>
            <td style="padding: 12px;">${t.description}</td>
            <td style="padding: 12px; color: ${typeColor}; font-weight: 600;">${amountDisplay}</td>
            <td style="padding: 12px; text-transform: capitalize;">${t.type}</td>
            <td style="padding: 12px;">
                <span style="${t.status === 'pending' ? 'color: var(--accent-color); font-weight:bold;' : ''}">${t.status}</span>
            </td>
            <td style="padding: 12px;">
                ${actionButtons}
            </td>
        `;
        transactionsTableBody.appendChild(tr);
    });
}

// --- Bulk Actions ---

function toggleSelectTx(txId) {
    if (selectedTxIds.has(txId)) {
        selectedTxIds.delete(txId);
    } else {
        selectedTxIds.add(txId);
    }
    updateBulkToolbar();
}

function toggleSelectAll(checkbox) {
    const checkboxes = transactionsTableBody.querySelectorAll('input[type="checkbox"]');
    if (checkbox.checked) {
        // Select all currently visible
        checkboxes.forEach(cb => {
            // Find ID from the row? Or better, scan the DB data used to render.
            // But we can infer order? No, simpler to just re-render or iterate DOM?
            // Wait, we can't easily get ID from DOM unless we store it.
            // Let's rely on the helper.
            // Actually, best is to select all *visible*. 
            // We'll iterate the 'allTransactions' array logic again? No inefficient.
            // Let's store IDs on the checkbox element.
        });
        // Correct approach:
        // We need to know which IDs are in the current view.
        // Let's modify render to store ID on input.
    } else {
        selectedTxIds.clear();
    }

    // Easier impl:
    const inputs = transactionsTableBody.querySelectorAll('input[type="checkbox"]');
    inputs.forEach(input => {
        input.checked = checkbox.checked;
        // The onchange won't fire automatically, so update set manually
        // We need the ID. Let's add data-id to the input in render.
        const id = input.getAttribute('onchange').match(/'([^']+)'/)[1];
        if (checkbox.checked) selectedTxIds.add(id);
        else selectedTxIds.delete(id);
    });
    updateBulkToolbar();
}

function deselectAll() {
    selectedTxIds.clear();
    document.getElementById('select-all-tx').checked = false;
    renderTransactions(); // Re-render to clear checks
    updateBulkToolbar();
}

function updateBulkToolbar() {
    const bar = document.getElementById('bulk-actions-bar');
    const countSpan = document.getElementById('selected-count');
    countSpan.textContent = selectedTxIds.size;

    if (selectedTxIds.size > 0) {
        bar.classList.remove('hidden');
    } else {
        bar.classList.add('hidden');
    }
}

function bulkAction(action) {
    if (selectedTxIds.size === 0) return;
    if (!confirm(`Are you sure you want to ${action} ${selectedTxIds.size} transactions?`)) return;

    let changed = false;

    db.users.forEach(user => {
        if (action === 'delete') {
            const initialCount = user.transactions.length;
            user.transactions = user.transactions.filter(t => !selectedTxIds.has(t.id));
            if (user.transactions.length !== initialCount) changed = true;
        } else if (action === 'approve') {
            user.transactions.forEach(t => {
                if (selectedTxIds.has(t.id) && t.status === 'pending') {
                    // Approve Logic
                    if (t.type === 'debit') {
                        user.balance -= t.amount;
                    } else {
                        user.balance += t.amount;
                    }
                    t.status = 'completed';
                    changed = true;
                }
            });
        }
    });

    if (changed) {
        utils.saveDB(db);
        deselectAll(); // Clear selection
        loadAdmin();
        alert('Bulk action completed.');
    } else {
        alert('No applicable transactions changed.');
    }
}

function resolveTransaction(userId, transactionId, action) {
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) return;

    const user = db.users[userIndex];
    const tIndex = user.transactions.findIndex(t => t.id === transactionId);
    if (tIndex === -1) return;

    const t = user.transactions[tIndex];

    if (action === 'approve') {
        if (t.type === 'debit') {
            // Check funds again just in case
            if (user.balance < t.amount) {
                alert('User does not have enough funds to approve this withdrawal.');
                return;
            }
            user.balance -= t.amount;
        } else {
            // Credit
            user.balance += t.amount;
        }
        t.status = 'completed';
    } else {
        // Reject
        t.status = 'rejected';
    }

    utils.saveDB(db);
    loadAdmin();
}

function deleteTransaction(userId, transactionId) {
    if (!confirm('Are you sure you want to delete this transaction record?')) return;

    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        db.users[userIndex].transactions = db.users[userIndex].transactions.filter(t => t.id !== transactionId);
        utils.saveDB(db);
        loadAdmin();
    }
}


// --- Add Transaction Manually ---

function showAddTransactionModal() {
    // Populate user select
    tUserSelect.innerHTML = '';
    db.users.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = `${u.name} (${u.username})`;
        tUserSelect.appendChild(opt);
    });

    addTransactionModal.style.display = 'block';
}

function createTransaction() {
    const userId = tUserSelect.value;
    const type = document.getElementById('t-type').value; // credit/debit
    const amount = parseFloat(document.getElementById('t-amount').value);
    const desc = document.getElementById('t-desc').value;
    const dateInput = document.getElementById('t-date').value;
    const category = document.getElementById('t-category').value; // investment, current, etc.

    if (!userId || isNaN(amount) || amount <= 0 || !desc) {
        alert('Please fill all required fields (Amount, Description, User)');
        return;
    }

    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) return;

    const user = db.users[userIndex];

    // Use provided date or current time
    const finalDate = dateInput ? new Date(dateInput).toISOString() : new Date().toISOString();

    const newT = {
        id: utils.generateId(),
        date: finalDate,
        description: desc,
        amount: amount,
        type: type,
        category: category,
        status: 'completed'
    };

    // Update Balance logic based on Category
    if (category === 'investment') {
        // Init investment balance if missing
        if (typeof user.investmentBalance !== 'number') user.investmentBalance = 0;

        if (type === 'credit') {
            user.investmentBalance += amount;
        } else {
            user.investmentBalance -= amount;
        }
    } else if (category === 'current') {
        if (type === 'credit') {
            user.balance += amount;
        } else {
            user.balance -= amount;
        }
    }
    // 'savings' logic can be added here if needed, usually simpler to just log it

    db.users[userIndex].transactions.push(newT);
    utils.saveDB(db);

    closeModal('add-transaction-modal');
    loadAdmin();
}


// --- Shared ---

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function logout() {
    utils.setCurrentUser(null);
    window.location.href = 'login.html';
}

// Start
loadAdmin();
