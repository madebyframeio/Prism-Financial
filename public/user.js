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
// Initial Load
async function loadDashboard() {
    try {
        // Fetch fresh user data including balance
        const user = await utils.getUserData(currentUser.id);

        if (!user) {
            utils.logout();
            return;
        }

        // Fetch fresh transactions
        const transactions = await utils.getTransactions(currentUser.id);

        // Update UI
        welcomeMsg.textContent = `Welcome, ${user.name}`;
        balanceDisplay.textContent = utils.formatCurrency(user.balance);

        // Determine which set of transactions to render
        // Since getTransactions returns flat array, we just pass it
        // renderTransactions filter logic will handle the rest
        renderTransactions(transactions);

    } catch (e) {
        console.error('Failed to load dashboard:', e);
        // Fallback or Logout?
        // utils.logout();
    }
}

function renderTransactions(transactions) {
    const listBody = document.getElementById('inv-history-body');
    if (!listBody) {
        console.error('Debug: inv-history-body not found');
        return;
    }

    listBody.innerHTML = '';

    console.log('Debug: Raw Transactions', transactions);

    if (!transactions || transactions.length === 0) {
        listBody.innerHTML = '<tr><td colspan="4" class="py-4 text-xs font-bold uppercase text-slate-400 tracking-widest text-center">No recent investment activity</td></tr>';
        return;
    }

    // Filter for Investment Only
    const investmentTx = transactions.filter(t =>
        t.category === 'investment' ||
        (t.description && t.description.includes('[INVESTMENT]')) ||
        t.type === 'investment_deposit' ||
        t.type === 'investment_withdrawal'
    );

    console.log('Debug: Filtered Investment Tx', investmentTx);

    // Sort by date desc
    const sorted = [...investmentTx].sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));

    if (sorted.length === 0) {
        listBody.innerHTML = '<tr><td colspan="4" class="py-4 text-xs font-bold uppercase text-slate-400 tracking-widest text-center">No recent investment activity</td></tr>';
        return;
    }

    sorted.forEach(t => {
        const date = new Date(t.created_at || t.date).toLocaleDateString();
        const isCredit = t.type === 'credit' || t.type === 'investment_deposit';
        const sign = isCredit ? '+' : '-';
        const colorClass = isCredit ? 'text-green-500' : 'text-rose-500';

        // Clean description tag for display
        const displayDesc = t.description ? t.description.replace('[INVESTMENT]', '').trim() : 'Investment Transaction';

        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors';
        tr.innerHTML = `
            <td class="py-3 text-sm font-bold text-slate-900">${displayDesc}</td>
            <td class="py-3 text-xs text-slate-500 text-right">${date}</td>
            <td class="py-3 text-sm font-bold text-right ${colorClass}">${sign}${utils.formatCurrency(t.amount)}</td>
        `;
        listBody.appendChild(tr);
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
