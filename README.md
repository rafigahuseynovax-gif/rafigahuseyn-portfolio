# Rəfiqə Hüseynova — Portfolio

Bej/qızılı dizaynlı statik portfolio saytı. Layihəyə `index.html`, `admin.html`, CSS və JavaScript faylları daxildir.

## Fayllar
- `index.html` — ictimai portfolio.
- `admin.html` — Supabase Auth ilə qorunan idarəetmə paneli.
- `styles.css` — ümumi dizayn.
- `app.js` — layihə filtrləri, ictimai fayl/link siyahısı və event qeydləri.
- `admin.js` — giriş, fayl/link idarəetməsi və sadə statistika.
- `config.js` — Supabase URL, anon key və Storage bucket adı.
- `supabase-schema.sql` — cədvəllər, RLS siyasətləri və storage siyasətləri.

## 1. Supabase qurulması
1. https://supabase.com saytında layihə yarat.
2. Project Settings → API bölməsindən Project URL və `anon/public` key-i götür.
3. `config.js` faylında `YOUR-PROJECT` və `YOUR_SUPABASE_ANON_KEY` hissələrini dəyiş.
4. Supabase SQL Editor bölməsində `supabase-schema.sql` faylının hamısını işə sal.
5. Storage bölməsində `portfolio-files` adlı bucket yaradın və Public seçimini aktiv edin (ictimai portfolio fayllarını ziyarətçilərin açması üçün).
6. Authentication → Users bölməsində admin istifadəçisini əlavə edin. Qeydiyyat səhifəsi yoxdur; istifadəçi yalnız layihə sahibinin yaratdığı admin hesabı ilə daxil olur.

### Təhlükəsizlik qeydləri
- Brauzerə yalnız `anon/public` açar yerləşdirilir. `service_role` açarını heç vaxt `config.js`-ə və ya GitHub-a qoymayın.
- SQL-də `portfolio_events` üçün anonim INSERT açıqdır, amma SELECT yalnız daxil olmuş istifadəçiyə verilir. İstifadəçi hadisələri saxtalaşdıra bilər; bu, sadə portfolio statistikasıdır, audit/maliyyə ölçümü deyil.
- Public bucket-ə yüklənmiş faylları linki olan hər kəs aça bilər. Həssas şəxsi sənədlər yükləməyin.
- Admin panelini yayımlamadan öncə RLS siyasətlərini diqqətlə yoxlayın. Admin girişi Supabase Auth-a bağlıdır.

## 2. Google Analytics 4
1. https://analytics.google.com/ saytında GA4 property yaradın.
2. Web data stream yaradıb Measurement ID-ni ( `G-...` ) götürün.
3. `index.html` içindəki hər iki `G-XXXXXXXXXX` yerini həmin ID ilə dəyişin.
4. GA4 real-time hesabatı ayrıca Google Analytics hesabında görünəcək. Bu starter layihə GA4 Data API ilə şəxsi dashboard-u avtomatik doldurmur; admin paneldəki rəqəmlər Supabase event cədvəlindən gəlir.

## 3. Saytı lokal yoxlama
`index.html`-i birbaşa fayl kimi açmaq bəzən brauzer məhdudiyyətləri yarada bilər. VS Code Live Server kimi lokal serverdən və ya hostingdən istifadə edin.

## 4. GitHub-a yükləmək
1. GitHub-da yeni repository yaradın, məsələn `rafiga-portfolio`.
2. ZIP-i kompüterinizdə açın.
3. ZIP-in içindəki faylları (qovluğun özünü deyil) repository-nin əsas qovluğuna yükləyin.
4. `config.js`-dəki real Supabase URL və anon key GitHub-a yüklənə bilər, çünki bunlar public key-dir; amma `service_role` və şəxsi şifrələri yükləməyin.
5. GitHub Pages → Settings → Pages → Deploy from a branch → `main` / root seçə bilərsiniz. Alternativ olaraq Netlify/Vercel-də repository-ni import edin.

## 5. İlk faylları əlavə etmək
1. Saytı yayımladıqdan sonra `/admin.html` açın.
2. Supabase Auth-da yaratdığınız e-poçt və şifrə ilə daxil olun.
3. CV-ni PDF olaraq yükləyin və ictimai göstərilməsini seçin.
4. Digər portfolio fayllarını və layihə keçidlərini əlavə edin.
5. Əsas portfolio səhifəsini yeniləyin.

## 6. Əhəmiyyətli məhdudiyyətlər
- Bu layihə üçüncü tərəf xidmətləri (Supabase və Google Analytics) qurulmadan tam işləməyəcək.
- Supabase cədvəlləri/Storage siyasətləri yaradılmadan admin funksiyaları işləməyəcək.
- `PRD.pdf` və ya `Rafiga Huseynova CV.pdf` kimi mövcud sənədlər yüklənməyib; onları ayrıca əlavə etmək lazımdır.
- Google Analytics-də istifadəçi məlumatlarını izləməzdən əvvəl tətbiq olunan məxfilik və cookie tələblərini nəzərə alın.
