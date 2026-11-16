document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initFaqAccordion();
  initCommissionForm();
  renderGalleryPage();
});

function initNavigation() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');

  if (!toggle || !nav) {
    return;
  }

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach((item) => {
    const button = item.querySelector('.faq-question');

    if (!button) {
      return;
    }

    button.addEventListener('click', () => {
      const isExpanded = item.classList.contains('active');

      faqItems.forEach((entry) => {
        entry.classList.remove('active');
      });

      if (!isExpanded) {
        item.classList.add('active');
      }
    });
  });
}

function initCommissionForm() {
  const form = document.querySelector('#commission-form');

  if (!form) {
    return;
  }

  const statusNode = form.querySelector('.form-status');

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const fields = Array.from(form.querySelectorAll('input, select, textarea'));
    let valid = true;

    fields.forEach((field) => {
      if (!field.value.trim()) {
        valid = false;
        field.setAttribute('aria-invalid', 'true');
      } else {
        field.setAttribute('aria-invalid', 'false');
      }
    });

    const emailField = form.querySelector('input[name="email"]');
    if (emailField && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value.trim())) {
      valid = false;
      emailField.setAttribute('aria-invalid', 'true');
    }

    if (!statusNode) {
      return;
    }

    statusNode.classList.remove('error');

    if (!valid) {
      statusNode.textContent = 'Please complete all required fields before submitting your inquiry.';
      statusNode.classList.add('error');
      return;
    }

    statusNode.textContent = 'Thank you — your inquiry has been prepared. We will reply by email soon.';
    form.reset();
  });
}

async function renderGalleryPage() {
  const galleryRoot = document.querySelector('[data-gallery]');

  if (!galleryRoot) {
    return;
  }

  const pageName = document.body.dataset.page;
  if (!pageName) {
    return;
  }

  try {
    const response = await fetch('data/artworks.json');
    const data = await response.json();
    const items = data.filter((item) => item.page === pageName);
    const groups = groupByMedium(items);
    const orderedMediums = getPageMediumOrder(pageName);

    const markup = orderedMediums
      .map((medium) => {
        const groupItems = groups[medium] || [];

        if (!groupItems.length) {
          return '';
        }

        const cards = groupItems
          .map(
            (item) => `
              <article class="art-card" tabindex="0" data-item='${escapeAttribute(JSON.stringify(item))}'>
                <img src="${item.image}" alt="${item.title}" loading="lazy" />
                <div class="art-info">
                  <div class="art-header">
                    <h3>${item.title}</h3>
                    <span class="status-badge">${item.status}</span>
                  </div>
                  <p class="art-meta">${item.dimensions} · ${item.year}</p>
                </div>
              </article>
            `
          )
          .join('');

        return `
          <section id="${slugify(medium)}" class="gallery-section">
            <div class="gallery-section-header">
              <h3>${medium}</h3>
            </div>
            <div class="gallery-grid">${cards}</div>
          </section>
        `;
      })
      .join('');

    galleryRoot.innerHTML = markup;
    setupLightbox();
  } catch (error) {
    console.error('Gallery rendering failed:', error);
    galleryRoot.innerHTML = '<p>Unable to load artwork gallery at the moment.</p>';
  }
}

function groupByMedium(items) {
  return items.reduce((accumulator, item) => {
    const list = accumulator[item.medium] || [];
    list.push(item);
    accumulator[item.medium] = list;
    return accumulator;
  }, {});
}

function getPageMediumOrder(pageName) {
  const mediumMap = {
    illustrations: ['Gouache', 'Digital', 'Line Art', 'Watercolor'],
    artworks: ['Watercolor', 'Gouache', 'Oils', 'Digital', 'Acrylic'],
  };

  return mediumMap[pageName] || [];
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function setupLightbox() {
  const lightbox = document.querySelector('.lightbox');
  const closeButton = document.querySelector('.lightbox-close');

  if (!lightbox || !closeButton) {
    return;
  }

  const image = lightbox.querySelector('.lightbox-image');
  const title = lightbox.querySelector('.lightbox-title');
  const meta = lightbox.querySelector('.lightbox-meta');
  const description = lightbox.querySelector('.lightbox-description');

  document.querySelectorAll('.art-card').forEach((card) => {
    const openCard = () => {
      const item = JSON.parse(card.dataset.item || '{}');
      if (!item.title) {
        return;
      }

      image.src = item.image;
      image.alt = item.title;
      title.textContent = item.title;
      meta.textContent = `${item.medium} · ${item.dimensions} · ${item.year} · ${item.status}`;
      description.textContent = item.description || 'A coastal and botanical study from Lauza’s studio archive.';
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    card.addEventListener('click', openCard);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openCard();
      }
    });
  });

  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  closeButton.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && lightbox.classList.contains('is-open')) {
      closeLightbox();
    }
  });
}

function escapeAttribute(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
