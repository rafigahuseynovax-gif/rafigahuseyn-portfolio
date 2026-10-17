(() => {
  const $ = id => document.getElementById(id);
  const cfg = window.PORTFOLIO_CONFIG || {};
  const ready = window.supabase && cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes('YOUR-PROJECT') &&
    cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes('YOUR_SUPABASE');
  if (!ready) {
    $('authStatus').textContent = 'Supabase hələ qurulmayıb. config.js və README.md addımlarını tamamlayın.';
    $('loginBtn').disabled = true;
    return;
  }
  const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  const bucket = cfg.STORAGE_BUCKET || 'portfolio-files';
  let currentUser = null;

  const message = (id, text) => { $(id).textContent = text; };
  $('loginBtn').addEventListener('click', async () => {
    message('authStatus', 'Giriş yoxlanılır…');
    const { data, error } = await client.auth.signInWithPassword({email:$('email').value.trim(), password:$('password').value});
    if (error) { message('authStatus', 'Giriş alınmadı: ' + error.message); return; }
    currentUser = data.user; await refresh();
  });
  $('logoutBtn').addEventListener('click', async () => {
    await client.auth.signOut(); currentUser = null; $('adminContent').classList.add('hidden');
    message('authStatus', 'Sistemdən çıxış edildi.');
  });
  client.auth.getSession().then(({data}) => {
    if (data.session) { currentUser = data.session.user; refresh(); }
    else message('authStatus', 'Admin e-poçtu və şifrəsi ilə daxil olun.');
  });

  async function refresh() {
    if (!currentUser) return;
    $('adminContent').classList.remove('hidden');
    message('authStatus', 'Daxil olundu: ' + currentUser.email);
    await Promise.all([loadLinks(), loadFiles(), loadStats()]);
  }
  async function loadLinks() {
    const {data,error} = await client.from('portfolio_links').select('*').order('created_at',{ascending:false});
    const wrap = $('linksAdmin'); wrap.replaceChildren();
    if (error) { message('authStatus', 'Linklər oxunmadı. README.md-dəki SQL və RLS quruluşunu yoxlayın.'); return; }
    (data || []).forEach(item => {
      const row = document.createElement('div'); row.className = 'admin-row';
      const info = document.createElement('div'); info.textContent = item.name;
      const small = document.createElement('small'); small.textContent = item.url + (item.is_public ? ' · İctimai' : ' · Gizli'); info.append(small);
      const actions = document.createElement('div'); actions.className = 'actions';
      const toggle = document.createElement('button'); toggle.className = 'pill light'; toggle.textContent = item.is_public ? 'Gizlət' : 'Göstər';
      toggle.addEventListener('click', async () => { const {error} = await client.from('portfolio_links').update({is_public:!item.is_public}).eq('id',item.id); if(error) alert(error.message); else loadLinks(); });
      const del = document.createElement('button'); del.className = 'pill light danger'; del.textContent = 'Sil';
      del.addEventListener('click', async () => { if(!confirm('Bu linki silmək istəyirsiniz?')) return; const {error}=await client.from('portfolio_links').delete().eq('id',item.id); if(error) alert(error.message); else loadLinks(); });
      actions.append(toggle,del); row.append(info,actions); wrap.append(row);
    });
  }
  $('linkForm').addEventListener('submit', async e => {
    e.preventDefault(); if(!currentUser) return;
    const name = $('linkName').value.trim(), url = $('linkUrl').value.trim();
    try { const parsed = new URL(url); if(!['https:','http:'].includes(parsed.protocol)) throw new Error(); } catch (_) { alert('Düzgün http/https linki daxil edin.'); return; }
    const {error} = await client.from('portfolio_links').insert({name,url,is_public:$('linkPublic').checked,created_by:currentUser.id});
    if(error) { alert('Yadda saxlamaq mümkün olmadı: '+error.message); return; }
    $('linkForm').reset(); $('filePublic').checked = true; $('linkPublic').checked = true; await loadLinks();
  });

  async function loadFiles() {
    const {data,error} = await client.from('portfolio_files').select('*').order('created_at',{ascending:false});
    const wrap = $('filesAdmin'); wrap.replaceChildren();
    if(error) { const p=document.createElement('p'); p.className='status'; p.textContent='Fayllar oxunmadı. SQL/RLS quruluşunu yoxlayın.'; wrap.append(p); return; }
    (data||[]).forEach(item => {
      const row=document.createElement('div'); row.className='admin-row';
      const info=document.createElement('div'); info.textContent=item.file_name;
      const small=document.createElement('small'); small.textContent=item.category+' · '+(item.is_public?'İctimai':'Gizli'); info.append(small);
      const actions=document.createElement('div'); actions.className='actions';
      const toggle=document.createElement('button'); toggle.className='pill light'; toggle.textContent=item.is_public?'Gizlət':'Göstər';
      toggle.addEventListener('click',async()=>{const {error}=await client.from('portfolio_files').update({is_public:!item.is_public}).eq('id',item.id);if(error)alert(error.message);else loadFiles();});
      const del=document.createElement('button'); del.className='pill light danger'; del.textContent='Sil';
      del.addEventListener('click',async()=>{if(!confirm('Faylı və qeydini silmək istəyirsiniz?'))return; const {error:storageError}=await client.storage.from(bucket).remove([item.storage_path]); if(storageError){alert(storageError.message);return;} const {error}=await client.from('portfolio_files').delete().eq('id',item.id);if(error)alert(error.message);else loadFiles();});
      actions.append(toggle,del); row.append(info,actions); wrap.append(row);
    });
  }
  $('fileForm').addEventListener('submit', async e => {
    e.preventDefault(); if(!currentUser) return;
    const file=$('filePicker').files[0]; if(!file) return;
    if($('fileCategory').value==='cv' && file.type!=='application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) { alert('CV yalnız PDF formatında olmalıdır.'); return; }
    if(file.size > 20*1024*1024) { alert('Fayl 20 MB-dan kiçik olmalıdır.'); return; }
    const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
    const path=Date.now()+'-'+crypto.randomUUID()+'-'+safeName;
    message('authStatus','Fayl yüklənir…');
    const {error:uploadError}=await client.storage.from(bucket).upload(path,file,{upsert:false,contentType:file.type||'application/octet-stream'});
    if(uploadError){alert('Fayl yüklənmədi: '+uploadError.message);message('authStatus','Daxil olundu: '+currentUser.email);return;}
    const {error}=await client.from('portfolio_files').insert({file_name:file.name,storage_path:path,category:$('fileCategory').value,is_public:$('filePublic').checked,uploaded_by:currentUser.id});
    if(error){await client.storage.from(bucket).remove([path]);alert('Fayl qeydi yazılmadı: '+error.message);return;}
    $('fileForm').reset(); $('filePublic').checked=true; message('authStatus','Fayl uğurla yükləndi.'); await loadFiles();
  });

  async function loadStats() {
    const {data,error}=await client.from('portfolio_events').select('event_name');
    if(error){message('statsStatus','Statistika cədvəlini oxumaq mümkün olmadı. SQL/RLS quruluşunu yoxlayın.');return;}
    const rows=data||[];
    $('viewsMetric').textContent=rows.filter(x=>x.event_name==='page_view').length;
    $('projectMetric').textContent=rows.filter(x=>x.event_name==='project_click').length;
    $('linkMetric').textContent=rows.filter(x=>x.event_name==='quick_link_click').length;
    message('statsStatus','Statistika Supabase event cədvəlindən hesablanır. Trafik artdıqca daha geniş hesabat üçün GA4-dən istifadə edin.');
  }
})();
