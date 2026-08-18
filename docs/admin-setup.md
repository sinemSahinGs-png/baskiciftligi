# Supabase admin bootstrap

Admin yetkisi signup metadata'sından, client formundan veya
`SUPABASE_SERVICE_ROLE_KEY` paylaşımından verilmez. Otorite
`public.profiles.role`; aktiflik `public.profiles.is_active` alanıdır.

## İlk admin

Ön koşullar:

1. Production migration'ları uygulanmış olmalı.
2. Sahip için kişisel, doğrulanmış bir Supabase Auth kullanıcısı Dashboard'dan
   invite edilmeli veya normal signup ile oluşturulmalı.
3. Güçlü parola ve MFA etkinleştirilmeli; ortak `admin@...` hesabı
   kullanılmamalı.
4. Auth Dashboard'dan kullanıcının UUID'si kopyalanmalı. Email'i SQL
   koşuluna koyup “ilk eşleşeni” yükseltmeyin.

Supabase SQL Editor'da project owner olarak aşağıdaki tek seferlik işlemi
çalıştırın. Placeholder değiştirilmezse sorgu bilerek hata vermelidir:

```sql
begin;

do $bootstrap$
declare
  target_user_id uuid := 'REPLACE_WITH_AUTH_USER_UUID';
begin
  if not exists (
    select 1
    from auth.users
    where id = target_user_id
      and email_confirmed_at is not null
  ) then
    raise exception 'confirmed auth user not found';
  end if;

  if not exists (
    select 1 from public.profiles where id = target_user_id
  ) then
    raise exception 'profile sync missing; stop and inspect auth trigger';
  end if;

  update public.profiles
  set role = 'owner'::public.app_role,
      is_active = true
  where id = target_user_id;
end
$bootstrap$;

commit;
```

Profile yoksa elle eksik alanlarla insert etmeyin. Önce
`public.handle_auth_user_sync()` trigger'ının migration ile kurulduğunu ve Auth
user oluşturulduktan sonra çalıştığını düzeltin.

## Doğrulama

SQL Editor:

```sql
select id, email, role, is_active, updated_at
from public.profiles
where id = 'REPLACE_WITH_AUTH_USER_UUID';
```

Ardından:

1. Tüm mevcut oturumlardan çıkıp tekrar giriş yapın.
2. Admin route'una erişimin server-side role kontrolüyle açıldığını doğrulayın.
3. Normal customer hesabıyla aynı route/mutation'ın 403/redirect verdiğini test
   edin.
4. Anonymous/customer'ın draft product ve başka kullanıcı private verisini
   okuyamadığını doğrulayın.
5. `public.is_admin()` fonksiyonunun `is_active=true` şartını kullandığını ve
   RLS policy'lerinin recursive profile sorgusu üretmediğini kontrol edin.

Yalnız menüyü göstermek/gizlemek yetki kontrolü değildir. Proxy session varlığını
kontrol etse bile her admin Server Action/API ayrıca role kontrolü yapmalıdır.

## Sonraki adminler

İlk admin oluşturulduktan sonra güvenilen server-side yönetim akışı
`public.admin_set_profile_access` fonksiyonunu çağırabilir:

```sql
select public.admin_set_profile_access(
  'REPLACE_WITH_AUTH_USER_UUID',
  'admin'::public.app_role,
  true
);
```

Bu çağrı authenticated actor için `public.is_admin()` kontrolü yapar. Browser'a
service key verilmez ve raw profile update ile role alanı kabul edilmez.
Yetkilendirme olayı actor, hedef user, eski/yeni role, gerekçe ve zamanla
`audit_logs` içinde kaydedilmelidir. Audit yazımı uygulamada henüz yoksa
değişiklik ticket/change record ile ayrıca belgelenmelidir.

Owner/admin promotion'ın self-service admin UI'da olmaması güvenli varsayımdır.

## Yetki kaldırma

1. Tek admin'i kaldırmadan önce ikinci, test edilmiş owner/admin hesabı olduğuna
   emin olun.
2. SQL Editor veya güvenilen server akışından:

   ```sql
   select public.admin_set_profile_access(
     'REPLACE_WITH_AUTH_USER_UUID',
     'customer'::public.app_role,
     false
   );
   ```

3. Supabase Auth Dashboard/Admin API üzerinden user session'larını revoke edin;
   gerekirse Auth user'ı banlayın.
4. Vercel, Supabase, PayTR ve diğer provider erişimleri database role'ünden
   ayrıdır; personelin tüm dış erişimlerini ayrıca kaldırın ve ilgili secret'ları
   rotate edin.
5. Customer ve eski session ile negatif erişim testini tekrarlayın.

`service_role` insan admin hesabı değildir, MFA/session sağlamaz ve RLS'yi bypass
eder. Günlük yönetim için asla paylaşılmaz.

## Local development

Production admin'i seed'e, dokümana veya source'a eklemeyin. Local Supabase'te
ayrı test kullanıcısı oluşturup aynı UUID tabanlı bootstrap'i uygulayın.
`DEMO` admin mutation modu yalnız local development içindir ve production'da
`ALLOW_DEMO_ADMIN_MUTATIONS=false` olmalıdır.
