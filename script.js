/**
 * Präsentations-Steuerung für die GK-LK-Präsentation
 * Navigation per Pfeiltasten, Leertaste, Wischgeste, Folienübersicht (G) & Vollbild (F)
 */
(function () {
  const slides = Array.from(document.querySelectorAll('.slide'));
  const total = slides.length;
  const progressBar = document.getElementById('progressBar');
  const slideCounter = document.getElementById('slideCounter');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const overviewBtn = document.getElementById('overviewBtn');
  const closingOverviewBtn = document.getElementById('closingOverviewBtn');
  const closeOverviewBtn = document.getElementById('closeOverviewBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const overviewModal = document.getElementById('overviewModal');
  const overviewGrid = document.getElementById('overviewGrid');

  let currentIndex = 0;

  function pad(num) {
    return String(num).padStart(2, '0');
  }

  function buildOverview() {
    overviewGrid.innerHTML = '';
    slides.forEach((slide, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'overview-tile' + (idx === currentIndex ? ' is-current' : '');
      const title = slide.getAttribute('data-title') || `Folie ${idx + 1}`;
      btn.innerHTML = `
        <span class="overview-tile-num">Folie ${pad(idx + 1)}</span>
        <span class="overview-tile-title">${title}</span>
      `;
      btn.addEventListener('click', () => {
        goToSlide(idx);
        closeOverview();
      });
      overviewGrid.appendChild(btn);
    });
  }

  function updateUI() {
    slides.forEach((slide, idx) => {
      slide.classList.toggle('is-active', idx === currentIndex);
    });

    const pct = ((currentIndex + 1) / total) * 100;
    progressBar.style.width = `${pct}%`;
    slideCounter.textContent = `${pad(currentIndex + 1)} / ${pad(total)}`;

    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === total - 1;

    // Übersicht aktualisieren, falls geöffnet
    const tiles = overviewGrid.querySelectorAll('.overview-tile');
    tiles.forEach((tile, idx) => {
      tile.classList.toggle('is-current', idx === currentIndex);
    });

    // URL-Hash sanft aktualisieren
    const targetHash = `#folie-${currentIndex + 1}`;
    if (window.location.hash !== targetHash) {
      history.replaceState(null, '', targetHash);
    }
  }

  function goToSlide(index) {
    const clamped = Math.max(0, Math.min(total - 1, index));
    currentIndex = clamped;
    updateUI();
  }

  function nextSlide() {
    if (currentIndex < total - 1) {
      goToSlide(currentIndex + 1);
    }
  }

  function prevSlide() {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    }
  }

  function openOverview() {
    buildOverview();
    overviewModal.classList.add('is-open');
  }

  function closeOverview() {
    overviewModal.classList.remove('is-open');
  }

  function toggleOverview() {
    if (overviewModal.classList.contains('is-open')) {
      closeOverview();
    } else {
      openOverview();
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  // Direkt-Sprung-Buttons (z. B. Gliederung auf Folie 2 & Quellen-Button auf Folie 14)
  document.querySelectorAll('[data-goto]').forEach((el) => {
    el.addEventListener('click', () => {
      const slideNum = parseInt(el.getAttribute('data-goto'), 10);
      if (!Number.isNaN(slideNum)) {
        goToSlide(slideNum - 1);
      }
    });
  });

  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');

  function closeLightbox() {
    if (lightboxModal) {
      lightboxModal.classList.remove('is-open');
    }
  }

  document.querySelectorAll('[data-zoom-src]').forEach((el) => {
    el.addEventListener('click', () => {
      const src = el.getAttribute('data-zoom-src');
      if (src && lightboxModal && lightboxImg) {
        lightboxImg.src = src;
        lightboxModal.classList.add('is-open');
      }
    });
  });

  if (lightboxModal) {
    lightboxModal.addEventListener('click', closeLightbox);
  }

  prevBtn.addEventListener('click', prevSlide);
  nextBtn.addEventListener('click', nextSlide);
  overviewBtn.addEventListener('click', toggleOverview);
  if (closingOverviewBtn) {
    closingOverviewBtn.addEventListener('click', openOverview);
  }
  closeOverviewBtn.addEventListener('click', closeOverview);
  fullscreenBtn.addEventListener('click', toggleFullscreen);

  overviewModal.addEventListener('click', (e) => {
    if (e.target === overviewModal) {
      closeOverview();
    }
  });

  // Tastatur-Navigation
  window.addEventListener('keydown', (e) => {
    const isModalOpen = overviewModal.classList.contains('is-open');
    const isLightboxOpen = lightboxModal && lightboxModal.classList.contains('is-open');

    if (e.key === 'Escape') {
      if (isLightboxOpen) {
        e.preventDefault();
        closeLightbox();
        return;
      }
      if (isModalOpen) {
        e.preventDefault();
        closeOverview();
      }
      return;
    }

    if (e.key === 'g' || e.key === 'G') {
      e.preventDefault();
      toggleOverview();
      return;
    }

    if (e.key === 'f' || e.key === 'F') {
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleFullscreen();
        return;
      }
    }

    if (isModalOpen || isLightboxOpen) return;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case 'PageDown':
      case ' ':
        e.preventDefault();
        nextSlide();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        prevSlide();
        break;
      case 'Home':
        e.preventDefault();
        goToSlide(0);
        break;
      case 'End':
        e.preventDefault();
        goToSlide(total - 1);
        break;
      default:
        break;
    }
  });

  // Touch-Swipe für Tablet / iPad
  let touchStartX = null;
  let touchStartY = null;

  window.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    },
    { passive: true }
  );

  window.addEventListener(
    'touchend',
    (e) => {
      if (touchStartX === null || touchStartY === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx < 0) nextSlide();
        else prevSlide();
      }
      touchStartX = null;
      touchStartY = null;
    },
    { passive: true }
  );

  // Startfolie aus URL-Hash lesen (z. B. #folie-7)
  function initFromHash() {
    const match = window.location.hash.match(/^#folie-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= total) {
        currentIndex = num - 1;
      }
    }
    buildOverview();
    updateUI();
  }

  window.addEventListener('hashchange', () => {
    const match = window.location.hash.match(/^#folie-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= total && num - 1 !== currentIndex) {
        goToSlide(num - 1);
      }
    }
  });

  initFromHash();
})();
