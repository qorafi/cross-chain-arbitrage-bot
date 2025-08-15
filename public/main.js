document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // --- DOM Elements ---
    const priceAValue = document.getElementById('price-a-value');
    const priceBValue = document.getElementById('price-b-value');
    const chainAName = document.getElementById('chain-a-name');
    const chainBName = document.getElementById('chain-b-name');
    const logsContainer = document.getElementById('logs');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');

    // --- Socket.io Event Listeners ---

    socket.on('connect', () => {
        statusText.textContent = 'Connected & Idle';
        statusIndicator.classList.remove('bg-gray-500');
        statusIndicator.classList.add('bg-green-500');
        addLog({ type: 'info', message: 'Successfully connected to the bot server.' });
    });

    socket.on('disconnect', () => {
        statusText.textContent = 'Disconnected';
        statusIndicator.classList.remove('bg-green-500', 'bg-yellow-500');
        statusIndicator.classList.add('bg-red-500');
        addLog({ type: 'error', message: 'Disconnected from the bot server.' });
    });

    // Listen for log messages from the server
    socket.on('log', (log) => {
        addLog(log);
    });

    // Listen for price updates
    socket.on('priceUpdate', (data) => {
        chainAName.textContent = data.chainA.name;
        chainBName.textContent = data.chainB.name;
        priceAValue.textContent = `${parseFloat(data.chainA.price).toFixed(5)} WETH`;
        priceBValue.textContent = `${parseFloat(data.chainB.price).toFixed(5)} WETH`;
    });

    // Listen for status updates
    socket.on('statusUpdate', (data) => {
        statusText.textContent = data.status;
        if (data.busy) {
            statusIndicator.classList.remove('bg-green-500');
            statusIndicator.classList.add('bg-yellow-500');
        } else {
            statusIndicator.classList.remove('bg-yellow-500');
            statusIndicator.classList.add('bg-green-500');
        }
    });

    // --- Helper Functions ---
    function addLog({ type, message }) {
        const now = new Date();
        const timestamp = now.toLocaleTimeString();
        const logEntry = document.createElement('p');

        let typeClass = '';
        if (type === 'opportunity') typeClass = 'log-opportunity';
        if (type === 'error') typeClass = 'log-error';
        if (type === 'warn') typeClass = 'log-warn';
        
        logEntry.className = typeClass;
        logEntry.innerHTML = `<span class="text-gray-500">[${timestamp}]</span> ${message}`;
        logsContainer.appendChild(logEntry);
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }
});
