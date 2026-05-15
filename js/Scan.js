function initQRMode() {
    loadScript('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js').then(() => {
        showToast('QR Scanner ready — point at a QR code');
    });
    const video = document.getElementById('cameraVideo');
    let scanInterval;

    const startScan = () => {
        scanInterval = setInterval(() => {
            const result = scanQR(video);
            if (result) {
                clearInterval(scanInterval);
                showToast(`QR: ${result.data}`, 'success');
                if (result.data.startsWith('http')) {
                    setTimeout(() => {
                        if (confirm(`Open URL?\n${result.data}`)) window.open(result.data, '_blank');
                    }, 300);
                }
                setTimeout(startScan, 3000);
            }
        }, 500);
    };

    startScan();
    return () => clearInterval(scanInterval);
}