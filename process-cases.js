
(() => {
  const wrap = document.getElementById('processCases');
  const cfg = window.PORTFOLIO_CONFIG || {};

  if (!wrap || !window.supabase || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) {
    if (wrap) wrap.innerHTML = '<p class="sub">Proses nümunələri hazırda göstərilə bilmir.</p>';
    return;
  }

  const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  const bucket = cfg.STORAGE_BUCKET || 'portfolio-files';

  const esc = value => String(value || '').replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]));

  // Böyük şəkil pəncərəsi
  let lightbox = document.getElementById('processLightbox');

  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.id = 'processLightbox';
    lightbox.className = 'process-lightbox';
    lightbox.innerHTML = `
      <button class="process-lightbox-close" aria-label="Bağla">&times;</button>
      <img src="" alt="Böyük proses şəkli">
    `;
    document.body.appendChild(lightbox);
  }

  const largeImage = lightbox.querySelector('img');

  function closeLightbox() {
    lightbox.classList.remove('active');
    largeImage.src = '';
    document.body.style.overflow = '';
  }

  lightbox.querySelector('.process-lightbox-close').addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeLightbox();
  });

  async function load() {
    const { data, error } = await client
      .from('process_cases')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) {
      wrap.innerHTML = '<p class="sub">Proses nümunələrini yükləmək mümkün olmadı.</p>';
      return;
    }

    wrap.replaceChildren();

    if (!data?.length) {
      wrap.innerHTML = '<p class="sub">Hələ proses nümunəsi əlavə edilməyib.</p>';
      return;
    }

    data.forEach(item => {
      const { data: urlData } = client.storage.from(bucket).getPublicUrl(item.image_path);

      const card = document.createElement('article');
      card.className = 'process-card';

      const img = document.createElement('img');
      img.className = 'process-image';
      img.src = urlData.publicUrl;
      img.alt = item.title;
      img.loading = 'lazy';
      img.title = 'Şəkli böyütmək üçün kliklə';

      img.addEventListener('click', () => {
        largeImage.src = urlData.publicUrl;
        largeImage.alt = item.title;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
      });

      const body = document.createElement('div');
      body.className = 'process-body';

      body.innerHTML = `
        <div class="process-meta">${esc(item.category || 'PROSES')}</div>
        <h3>${esc(item.title)}</h3>
        <p class="process-description">${esc(item.description)}</p>
        <div class="story-box">
          <h4>User Story</h4>
          <p>${esc(item.user_story)}</p>
        </div>
        ${item.acceptance_criteria ? `
          <div class="story-box">
            <h4>Acceptance Criteria</h4>
            <p>${esc(item.acceptance_criteria)}</p>
          </div>` : ''}
      `;

      card.append(img, body);
      wrap.append(card);
    });
  }

  load();
})();
