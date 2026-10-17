(() => {
  const $ = (id) => document.getElementById(id);
  $('year').textContent = new Date().getFullYear();

  // Layihə filterləri
  const buttons = [...document.querySelectorAll('.filter')];
  const cards = [...document.querySelectorAll('#projectGrid .project')];
  const empty = $('emptyState');
  buttons.forEach(btn => btn.addEventListener('click', () => {
    buttons.forEach(b => b.classList.toggle('active', b === btn));
    const filter = btn.dataset.filter;
    let shown = 0;
    cards.forEach(card => {
      const show = filter === 'all' || (card.dataset.tags || '').split(' ').includes(filter);
      card.style.display = show ? 'flex' : 'none';
      if (show) shown++;
    });
    empty.style.display = shown ? 'none' : 'block';
  }));

  const cfg = window.PORTFOLIO_CONFIG || {};
  const configured = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes('YOUR-PROJECT') &&
    cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes('YOUR_SUPABASE');
  if (!configured || !window.supabase) {
    $('quickLinksEmpty').style.display = 'block';
    return;
  }

  const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  const bucket = cfg.STORAGE_BUCKET || 'portfolio-files';

  async function logEvent(eventName, eventDetail = '') {
    try {
      await client.from('portfolio_events').insert({event_name: eventName, event_detail: eventDetail.slice(0,160)});
    } catch (_) { /* Analytics must never interrupt the portfolio. */ }
  }
  logEvent('page_view', location.pathname);
  document.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (link && link.href) {
      const id = link.closest('#projectGrid') ? (link.closest('.project')?.querySelector('h3')?.textContent || 'project') : '';
      if (id) logEvent('project_click', id);
    }
  });

  async function publicFiles() {
    const { data, error } = await client.from('portfolio_files').select('*').eq('is_public', true).order('created_at', {ascending:false});
    if (error) return;
    const cvWrap = $('cvPublic'), docsWrap = $('documentsPublic');
    cvWrap.replaceChildren(); docsWrap.replaceChildren();
    if (!data || !data.length) {
      cvWrap.innerHTML = '<p class="sub">CV faylı hələ əlavə edilməyib.</p>';
      docsWrap.innerHTML = '<p class="sub">Hələ əlavə edilmiş sənəd yoxdur.</p>';
      return;
    }
    const cvFiles = data.filter(f => f.category === 'cv');
    const docs = data.filter(f => f.category !== 'cv');
    const addRow = (wrap, file) => {
      const row = document.createElement('div'); row.className = 'file-row';
      const type = document.createElement('span'); type.className = 'file-type';
      type.textContent = (file.file_name.split('.').pop() || 'FILE').slice(0,4).toUpperCase();
      const name = document.createElement('span'); name.className = 'file-name'; name.textContent = file.file_name;
      const link = document.createElement('a'); link.textContent = file.category === 'cv' ? 'CV-yə bax / yüklə ↗' : 'Faylı aç ↗';
      link.target = '_blank'; link.rel = 'noopener noreferrer';
      const { data: urlData } = client.storage.from(bucket).getPublicUrl(file.storage_path);
      link.href = urlData.publicUrl;
      row.append(type, name, link); wrap.append(row);
    };
    cvFiles.forEach(f => addRow(cvWrap, f)); docs.forEach(f => addRow(docsWrap, f));
    if (!cvFiles.length) cvWrap.innerHTML = '<p class="sub">CV faylı hələ əlavə edilməyib.</p>';
    if (!docs.length) docsWrap.innerHTML = '<p class="sub">Hələ əlavə edilmiş sənəd yoxdur.</p>';
  }
  async function publicLinks() {
    const { data, error } = await client.from('portfolio_links').select('*').eq('is_public', true).order('created_at', {ascending:false});
    if (error) return;
    const wrap = $('quickLinksList'); wrap.replaceChildren();
    $('quickLinksEmpty').style.display = data?.length ? 'none' : 'block';
    (data || []).forEach(item => {
      const card = document.createElement('article'); card.className = 'project';
      const top = document.createElement('div'); top.className = 'projecttop';
      const type = document.createElement('span'); type.className = 'type'; type.textContent = 'Layihə keçidi';
      const arrow = document.createElement('span'); arrow.className = 'arrow'; arrow.textContent = '↗';
      top.append(type, arrow);
      const title = document.createElement('h3'); title.textContent = item.name;
      const link = document.createElement('a'); link.className = 'pill light'; link.href = item.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Layihəyə keçid ↗';
      link.addEventListener('click', () => logEvent('quick_link_click', item.name));
      const actions = document.createElement('div'); actions.className = 'project-actions'; actions.append(link);
      card.append(top, title, actions); wrap.append(card);
    });
  }
  Promise.all([publicFiles(), publicLinks()]);
})();
