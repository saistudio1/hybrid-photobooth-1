// Aesthetic SVG preset portrait poses for demo/testing mode

export function createSamplePose(index: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 960;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background gradients
  const gradients = [
    ['#fda4af', '#f43f5e', '#881337'], // Rose pink
    ['#c4b5fd', '#8b5cf6', '#4c1d95'], // Lavender purple
    ['#67e8f9', '#06b6d4', '#164e63'], // Cyan blue
    ['#fde047', '#f59e0b', '#78350f'], // Amber gold
  ];

  const [c1, c2, c3] = gradients[index % gradients.length];
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, c1);
  grad.addColorStop(0.5, c2);
  grad.addColorStop(1, c3);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Soft studio light circles
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.beginPath();
  ctx.arc(640, 480, 400, 0, Math.PI * 2);
  ctx.fill();

  // Draw stylish silhouette / avatar graphic
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 120px "Plus Jakarta Sans", sans-serif';
  const emojis = ['✌️', '✨', '📸', '🫶'];
  ctx.fillText(emojis[index % emojis.length], 640, 420);

  ctx.font = '800 48px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`POSE #${index + 1}`, 640, 540);

  ctx.font = '500 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText('SAI STUDIO · AESTHETIC SNAP', 640, 600);

  return canvas.toDataURL('image/jpeg', 0.92);
}
