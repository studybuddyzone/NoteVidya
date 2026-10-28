
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role') || '';
    const prn = params.get('prn') || '';
    const orderId = params.get('order_id') || '';

    document.getElementById('branchBadge').textContent = role.toUpperCase();
    document.getElementById('prnText').textContent = 'PRN: ' + prn;
    document.getElementById('orderIdText').textContent = 'Order ID: ' + orderId;
  