// Simple script to create PWA icons with proper background and "C" letter
// Run this in a browser console or Node.js environment

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const backgroundColor = '#322536';

function createIcon(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Fill background with the specified color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, size, size);

    // Create rounded corners (20% radius)
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    const radius = size * 0.2;

    // Manual rounded rectangle since roundRect might not be available
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';

    // Draw the "C" letter
    ctx.fillStyle = '#ff0000';
    ctx.font = `900 ${size * 0.55}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw the "C" with slight vertical adjustment for better centering
    ctx.fillText('C', size / 2, size / 2 + size * 0.02);

    return canvas;
}

function downloadIcon(canvas, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Generate and download all icons
function generateAllIcons() {
    sizes.forEach((size, index) => {
        setTimeout(() => {
            const canvas = createIcon(size);
            downloadIcon(canvas, `icon-${size}x${size}.png`);
        }, index * 500); // Stagger downloads by 500ms
    });
}

// If running in browser, you can call generateAllIcons()
if (typeof window !== 'undefined') {
    console.log('PWA Icon Generator loaded. Call generateAllIcons() to download all icons.');
    window.generateAllIcons = generateAllIcons;
    window.createIcon = createIcon;
    window.downloadIcon = downloadIcon;
}
