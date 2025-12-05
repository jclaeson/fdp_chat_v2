// Content Script - Injects the UI into developer.fedex.com

const API_URL = "http://localhost:5000"; // Or your cloud URL

function createOverlay() {
  // 1. Create Floating Action Button
  const fab = document.createElement('div');
  fab.id = 'fdp-assistant-fab';
  fab.innerHTML = `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
    </svg>
  `;
  document.body.appendChild(fab);

  // 2. Create Chat Window
  const window = document.createElement('div');
  window.id = 'fdp-assistant-window';
  window.innerHTML = `
    <div class="fdp-header">
      <div class="fdp-title">
        <span>FedEx Assistant</span>
        <span style="font-size: 10px; background: #FF6200; padding: 2px 6px; border-radius: 10px;">AI</span>
      </div>
      <div class="fdp-close">✕</div>
    </div>
    <div class="fdp-content">
      <!-- Points to your deployed React Chat page (stripped version) -->
      <iframe id="fdp-frame" src="${API_URL}/chat?embed=true"></iframe>
    </div>
  `;
  document.body.appendChild(window);

  // 3. Toggle Logic
  let isOpen = false;
  
  fab.addEventListener('click', () => {
    isOpen = !isOpen;
    window.classList.toggle('visible', isOpen);
  });

  window.querySelector('.fdp-close').addEventListener('click', () => {
    isOpen = false;
    window.classList.remove('visible');
  });
}

// Initialize
createOverlay();
console.log("FedEx Developer Assistant Loaded");
