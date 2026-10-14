// Subly — Landing Page Interactive Engine
document.addEventListener('DOMContentLoaded', () => {
  initMascotParallax();
  initMascotQuotes();
  initMascotClickEffect();
  initMobileStickyBar();
});

// ── 1. Mascot 3D Parallax Tilt ──────────────────────────
function initMascotParallax() {
  const card = document.getElementById('mascotCard');
  const img = document.getElementById('mascotImg');
  if (!card || !img) return;

  let isHovered = false;

  card.addEventListener('mouseenter', () => {
    isHovered = true;
  });

  card.addEventListener('mouseleave', () => {
    isHovered = false;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    img.style.transform = 'translateY(0) scale(1)';
  });

  window.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const cardCenterX = rect.left + rect.width / 2;
    const cardCenterY = rect.top + rect.height / 2;

    const deltaX = e.clientX - cardCenterX;
    const deltaY = e.clientY - cardCenterY;

    // Only tilt when cursor is reasonably close or hovering
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance < 600 || isHovered) {
      const rotateX = -(deltaY / 20).toFixed(2);
      const rotateY = (deltaX / 20).toFixed(2);

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04, 1.04, 1.04)`;
      img.style.transform = `translate(${deltaX * 0.05}px, ${deltaY * 0.05}px) scale(1.03)`;
    }
  });

  // Mobile Touch Support for Parallax
  card.addEventListener('touchmove', (e) => {
    if (!e.touches[0]) return;
    const touch = e.touches[0];
    const rect = card.getBoundingClientRect();
    const cardCenterX = rect.left + rect.width / 2;
    const cardCenterY = rect.top + rect.height / 2;

    const deltaX = touch.clientX - cardCenterX;
    const deltaY = touch.clientY - cardCenterY;

    const rotateX = -(deltaY / 14).toFixed(2);
    const rotateY = (deltaX / 14).toFixed(2);

    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    img.style.transform = `translate(${deltaX * 0.05}px, ${deltaY * 0.05}px) scale(1.04)`;
  }, { passive: true });

  card.addEventListener('touchend', () => {
    setTimeout(() => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      img.style.transform = 'translateY(0) scale(1)';
    }, 350);
  }, { passive: true });
}

// ── 2. Mascot Speech Bubble Quotes ──────────────────────
function initMascotQuotes() {
  const bubble = document.getElementById('mascotBubble');
  if (!bubble) return;

  const quotes = [
    'I guard your wallet! 🛡️',
    'Never get charged by surprise! 🔥',
    'Open the provider cancellation page! ⚡',
    'Download the APK below! 📱',
    'Smart 9:00 AM alarms ready! ⏰',
    'No bank passwords needed! 🔒',
  ];

  let index = 0;

  // Cycle quote on bubble click
  bubble.addEventListener('click', () => {
    index = (index + 1) % quotes.length;
    const textSpan = bubble.querySelector('.bubble-text');
    if (textSpan) {
      textSpan.textContent = quotes[index];
    }
    // Quick pop animation
    bubble.style.transform = 'scale(1.15)';
    setTimeout(() => {
      bubble.style.transform = '';
    }, 180);
  });

  // Cycle quote every 6 seconds automatically
  setInterval(() => {
    index = (index + 1) % quotes.length;
    const textSpan = bubble.querySelector('.bubble-text');
    if (textSpan) {
      bubble.style.opacity = '0';
      setTimeout(() => {
        textSpan.textContent = quotes[index];
        bubble.style.opacity = '1';
      }, 300);
    }
  }, 6500);
}

// ── 3. Mascot Click / Tap Particles & Animation ─────────
function initMascotClickEffect() {
  const card = document.getElementById('mascotCard');
  if (!card) return;

  const particles = ['💰', '🛡️', '✨', '🚀', '🔥', '🎉'];

  const triggerAnimation = (clientX, clientY) => {
    for (let i = 0; i < 5; i++) {
      createParticle(clientX, clientY, particles[Math.floor(Math.random() * particles.length)]);
    }

    const img = document.getElementById('mascotImg');
    if (img) {
      img.style.transform = 'scale(1.14) rotate(4deg)';
      setTimeout(() => {
        img.style.transform = '';
      }, 250);
    }
  };

  card.addEventListener('click', (e) => {
    triggerAnimation(e.clientX, e.clientY);
  });

  card.addEventListener('touchstart', (e) => {
    if (e.touches[0]) {
      triggerAnimation(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });
}

function createParticle(x, y, char) {
  const particle = document.createElement('div');
  particle.textContent = char;
  particle.style.position = 'fixed';
  particle.style.left = `${x}px`;
  particle.style.top = `${y}px`;
  particle.style.fontSize = '24px';
  particle.style.pointerEvents = 'none';
  particle.style.zIndex = '9999';
  particle.style.userSelect = 'none';
  particle.style.transition = 'transform 1s cubic-bezier(0.1, 0.8, 0.2, 1), opacity 1s ease';

  document.body.appendChild(particle);

  const angle = Math.random() * Math.PI * 2;
  const distance = 60 + Math.random() * 80;
  const destX = Math.cos(angle) * distance;
  const destY = Math.sin(angle) * distance - 40; // float upwards

  requestAnimationFrame(() => {
    particle.style.transform = `translate(${destX}px, ${destY}px) scale(0.4) rotate(${Math.random() * 90 - 45}deg)`;
    particle.style.opacity = '0';
  });

  setTimeout(() => {
    particle.remove();
  }, 1000);
}

// ── 4. Interactive Phone Simulator Action ───────────────
let currentSavings = 2297;

window.simulateCancel = function(button, serviceName) {
  const item = button.closest('.trial-item');
  if (!item) return;

  // Visual strikeout and success
  item.style.opacity = '0.45';
  item.style.transform = 'scale(0.97)';
  
  const statusEl = item.querySelector('.trial-status');
  if (statusEl) {
    statusEl.textContent = 'Demo: marked cancelled';
    statusEl.className = 'trial-status normal';
  }

  button.textContent = 'Demo only';
  button.disabled = true;
  button.style.background = '#10B981';
  button.style.borderColor = '#10B981';
  button.style.color = '#FFF';

  // Spawn confetti particles at button
  const rect = button.getBoundingClientRect();
  createParticle(rect.left + 20, rect.top, '🛡️');
  createParticle(rect.left + 40, rect.top, '✨');

  // Update speech bubble
  const bubble = document.getElementById('mascotBubble');
  if (bubble) {
    const textSpan = bubble.querySelector('.bubble-text');
    if (textSpan) {
      textSpan.textContent = `Great job! ${serviceName} is saved! 🎉`;
      bubble.style.transform = 'scale(1.1)';
      setTimeout(() => bubble.style.transform = '', 300);
    }
  }
};

// ── 7. Mobile Sticky Download Bar Controller ────────────
function initMobileStickyBar() {
  const bar = document.getElementById('mobileStickyBar');
  if (!bar) return;

  const updateBar = () => {
    // Show bar when scrolled past 280px
    if (window.scrollY > 280) {
      bar.classList.add('visible');
    } else {
      bar.classList.remove('visible');
    }
  };

  window.addEventListener('scroll', updateBar, { passive: true });
  updateBar();
}

