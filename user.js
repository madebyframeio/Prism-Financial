// Check authentication
const currentUser = utils.getCurrentUser();
if (!currentUser || currentUser.role === 'admin') {
    window.location.href = 'login.html';
}

const welcomeMsg = document.getElementById('welcome-msg');
const balanceDisplay = document.getElementById('balance-display');
const transactionList = document.getElementById('transaction-list');
const withdrawalForm = document.getElementById('withdrawal-form');

// Initial Load
function loadDashboard() {
    const db = utils.getDB();
    const user = db.users.find(u => u.id === currentUser.id);

    // Safety check if user detected in session but not in DB (e.g. DB cleared)
    if (!user) {
        logout();
        return;
    }

    // Update UI
    welcomeMsg.textContent = `Welcome, ${user.name}`;
    balanceDisplay.textContent = utils.formatCurrency(user.balance);

    renderTransactions(user.transactions);
}

function renderTransactions(transactions) {
    transactionList.innerHTML = '';

    // Sort by date desc
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (sorted.length === 0) {
        transactionList.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">No transactions found.</p>';
        return;
    }

    sorted.forEach(t => {
        const li = document.createElement('li');
        li.className = 'transaction-item';

        const date = new Date(t.date).toLocaleDateString();
        const isCredit = t.type === 'credit';
        const sign = isCredit ? '+' : '-';
        const colorClass = isCredit ? 'amount-credit' : 'amount-debit';
        const statusHtml = t.status === 'pending'
            ? '<span class="status-pending" style="display: block; font-size: 0.8rem;">Pending</span>'
            : '';

        li.innerHTML = `
            <div>
                <div style="font-weight: 500;">${t.description}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${date}</div>
            </div>
            <div style="text-align: right;">
                <div class="${colorClass}" style="font-weight: 600;">${sign}${utils.formatCurrency(t.amount)}</div>
                ${statusHtml}
            </div>
        `;
        transactionList.appendChild(li);
    });
}

withdrawalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('amount').value);
    const description = document.getElementById('description').value;

    if (amount <= 0) {
        alert('Please enter a valid amount.');
        return;
    }

    const db = utils.getDB();
    const userIndex = db.users.findIndex(u => u.id === currentUser.id);
    const user = db.users[userIndex];

    if (amount > user.balance) {
        alert('Insufficient funds for this withdrawal request.');
        return;
    }

    // Create Transaction
    const newTransaction = {
        id: utils.generateId(),
        date: new Date().toISOString(),
        description: description,
        amount: amount,
        type: 'debit',
        status: 'pending' // Waiting for admin approval
    };

    // Update DB
    db.users[userIndex].transactions.push(newTransaction);
    utils.saveDB(db);

    // Reset form and reload
    withdrawalForm.reset();
    loadDashboard();
    alert('Withdrawal request submitted for approval.');
});

function logout() {
    utils.setCurrentUser(null);
    window.location.href = 'login.html';
}

// Start
loadDashboard();
