# Security release checklist

Kutular ancak staging/production kanıtı (test çıktısı, ayar ekranı, change
record) varsa işaretlenir. Bu belge tamamlanmış güvenlik iddiası değildir.
`P1` Phase 1 release gate'idir; sonraki etiketler özellik aktive edilirken
zorunlu olur.

## Secrets ve deployment

- [ ] **P1** `.env*`, log, source map, client bundle ve Git history secret
      içermiyor.
- [ ] **P1** Yalnız `NEXT_PUBLIC_*` değerleri browser-visible; service role ve
      provider secret'ları server-only.
- [ ] **P1** Staging/production Supabase ve secret setleri ayrı; preview
      production verisine bağlanmıyor.
- [ ] **P1** `SUPABASE_SERVICE_ROLE_KEY` web runtime'da gerekmiyorsa tanımlı
      değil; gerekiyorsa minimum server path'inde ve rotation sahibi belirli.
- [ ] **P1** `ALLOW_DEMO_ADMIN_MUTATIONS=false`; production demo fallback
      gerçek ürün/stock gibi sunulmuyor.
- [ ] **P1** Secret rotation ve erişimden ayrılan personel için revoke runbook'u
      denenmiş.

## Authentication ve session

- [ ] **P1** Supabase Auth Site URL/redirect allow-list yalnız bilinen HTTPS
      origin'lerini içeriyor.
- [ ] **P1** Email verification, password policy, abuse/rate limit ve account
      recovery ayarları gözden geçirildi.
- [ ] **P1** Session cookie'leri `Secure`, `HttpOnly` (uygulanabildiği yerde) ve
      uygun `SameSite`; session refresh/testleri geçti.
- [ ] **P1** Login, reset ve signup cevapları account enumeration azaltıyor.
- [ ] **P1** Admin hesaplarında MFA zorunlu; ortak admin hesabı yok.
- [ ] **P1** Inactive/revoked admin'in session'ları iptal edilip erişimi
      yeniden test edildi.

## Authorization, RLS ve IDOR

- [ ] **P1** Tüm exposed tablolarda RLS açık; grants ve policies local reset
      sonrası denetlendi.
- [ ] **P1** Anonymous kullanıcı yalnız published catalog/content okuyabiliyor.
- [ ] **P1** Customer başka profile, address, cart, favorite veya private kaydı
      UUID/path tahminiyle okuyup değiştiremiyor.
- [ ] **P1** `/admin` için session kontrolüne ek olarak server-side
      `profiles.role=admin` kontrolü var; UI gizlemek authorization değil.
- [ ] **P1** Role user metadata'dan veya profile self-update payload'ından
      değiştirilemiyor.
- [ ] **P1** `public.is_admin()` non-recursive `SECURITY DEFINER`, sabit
      `search_path` ve dar execute grant kullanıyor.
- [ ] **P1** Admin mutations field allow-list/schema kullanıyor; mass assignment
      ile `role`, price, stock, owner veya status yazılamıyor.
- [ ] **P3** Upload/quote/signed URL sahiplik ve admin access negatif testleri
      geçti.

## Veri bütünlüğü ve commerce

- [ ] **P1** TRY tutarları integer minor unit; client fiyatı hiçbir write
      işleminde otorite değil.
- [ ] **P1** Cart server'da katalog/stoktan yeniden fiyatlanıyor; geçersiz
      variant ve overflow/negatif adet reddediliyor.
- [ ] **P1** Admin CRUD audit actor, zaman ve değişiklik özeti üretiyor.
- [ ] **P2** Order/quote snapshots finalize olduktan sonra immutable.
- [ ] **P2** Stock reservation, coupon redemption ve order creation transaction + idempotency key kullanıyor.
- [ ] **P2** Payment callback signature, amount/currency, state transition ve
      duplicate/out-of-order event testleri geçti.

## Input, browser ve API

- [ ] **P1** URL param, form, Server Action/API payload ve provider response'u
      runtime schema ile doğrulanıyor.
- [ ] **P1** Rich text sanitize ediliyor; user HTML/URL'si doğrudan render
      edilmiyor.
- [ ] **P1** State-changing cookie-auth request'lerinde Origin/CSRF savunması ve
      method/content-type kontrolü var.
- [ ] **P1** Login, search, contact ve admin mutation endpoint'lerinde uygun
      rate limit/body-size limit var.
- [ ] **P1** CSP, HSTS, `nosniff`, referrer ve frame politikaları staging'de
      rapor-only gözlem sonrası enforce edildi.
- [ ] **P1** CSP yalnız gereken image/video/Supabase origin'lerini içeriyor;
      wildcard ve unsafe bypass belgelenmemiş.
- [ ] **P1** Error response stack, SQL, object path, secret veya kişisel veri
      sızdırmıyor.

## Storage ve dosya işleme

- [ ] **P3** `model-uploads` private; public list/read policy yok.
- [ ] **P3** 100 MB application limiti, user quota, rate limit ve signed upload
      expiry uygulanıyor.
- [ ] **P3** Extension + MIME + magic bytes doğrulanıyor; 3MF archive bomb/path
      traversal ve malformed mesh testleri var.
- [ ] **P3** Original dosya quarantine'da; preview/worker erişimi kısa ömürlü
      signed URL ile.
- [ ] **P3** Signed URL query string'i log/analytics/Referer'a gitmiyor.
- [ ] **P3** Retention, orphan cleanup, legal hold ve silme audit'i
      [storage lifecycle](./storage-lifecycle.md) ile doğrulandı.
- [ ] **P4** Slicer/container non-root, read-only image, resource/time limit,
      izole scratch ve egress allow-list kullanıyor.
- [ ] **P4** Worker callback imzalı, replay/idempotency korumalı; native binary
      Vercel içinde çalışmıyor.

## External providers

- [ ] **P2** PayTR key/salt server-only; resmi signature test vector'ları var.
- [ ] **P2** Email template/link'leri injection ve açık redirect testlerinden
      geçti; unsubscribe/consent kapsamı tanımlı.
- [ ] **P5** Thingiverse yalnız official API; scraping/undocumented endpoint yok.
- [ ] **P5** `permission_verified` olmayan model checkout'a giremiyor;
      revocation/takedown testi geçti.
- [ ] **P5** Provider token, permission evidence ve original model private.

## Privacy, logging ve operations

- [ ] **P1** KVKK aydınlatma/consent kayıtları amaç, policy version ve zamanla
      saklanıyor; zorunlu ve pazarlama consent'i ayrılmış.
- [ ] **P1** Data minimization, erişim/düzeltme/silme talebi ve yasal hold
      sahipleri belirli.
- [ ] **P1** Log redaction email/telefon/adres/token/signed URL/model adını
      gereksiz toplamıyor; retention tanımlı.
- [ ] **P1** Database backup encrypted; restore tatbikatı ve RPO/RTO kaydı var.
- [ ] **P1** Dependency/lockfile review, `npm audit` değerlendirmesi, lint,
      typecheck, test ve production build CI gate'i.
- [ ] **P1** Security incident owner, credential rotation, kullanıcı bildirimi,
      audit preservation ve rollback runbook'u denenmiş.
