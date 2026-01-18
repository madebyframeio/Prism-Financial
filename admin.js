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

// Init
function loadAdmin() {
    db = utils.getDB(); // refresh
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
    editBalanceModal.style.display = 'block';
}

function saveBalance() {
    const userId = editUserId.value;
    const newBal = parseFloat(newBalanceInput.value);

    if (isNaN(newBal)) {
        alert('Invalid amount');
        return;
    }

    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        db.users[userIndex].balance = newBal;

        // Add a system log transaction for record keeping (optional, but good practice)
        db.users[userIndex].transactions.push({
            id: utils.generateId(),
            date: new Date().toISOString(),
            description: 'System Balance Adjustment',
            amount: 0,
            type: 'credit', // Neutral
            status: 'completed'
        });

        utils.saveDB(db);
        alert('Balance updated');
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

        tr.innerHTML = `
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
    const type = document.getElementById('t-type').value;
    const amount = parseFloat(document.getElementById('t-amount').value);
    const desc = document.getElementById('t-desc').value;

    if (!userId || isNaN(amount) || amount <= 0 || !desc) {
        alert('Please fill all fields correctly');
        return;
    }

    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) return;

    const user = db.users[userIndex];

    // Optional: Pre-validation for debit
    /*
    if (type === 'debit' && user.balance < amount) {
         if(!confirm('User has insufficient funds for this debit. Continue anyway (balance will go negative)?')) return;
    }
    */

    const newT = {
        id: utils.generateId(),
        date: new Date().toISOString(),
        description: desc,
        amount: amount,
        type: type,
        status: 'completed' // Direct add is auto-completed
    };

    // Update Balance Immediately
    if (type === 'credit') {
        user.balance += amount;
    } else {
        user.balance -= amount;
    }

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
