# نشر HASAN SHOP على الإنترنت (Render)

## روابط مباشرة الآن (نفق Cloudflare مؤقت)

| الخدمة | الرابط |
|--------|--------|
| المتجر | https://divided-unlimited-colour-predict.trycloudflare.com/ar |
| الأدمن | https://forbes-lift-grant-imports.trycloudflare.com |
| API | https://raid-independence-curves-printing.trycloudflare.com/api/v1/health |

> تعمل طالما جهازك شغّال والـ tunnels مفتوحة. للنشر الدائم على Render أكمل خطوات GitHub أدناه.


## عائق النشر الحالي
1. **GitHub CLI غير مسجّل** (`gh auth login` مطلوب) — Render يسحب الكود من GitHub فقط.
2. **قاعدة PostgreSQL المجانية مشغولة** بحساب `amartech-dz-db` — لا يمكن إنشاء ثانية مجانية.

## خطوات النشر (مرة واحدة)

### أ) GitHub
```powershell
gh auth login
cd "c:\New folderYYTRT\OneDrive\Desktop\New folder (4)"
git -c safe.directory="." add -A
git -c safe.directory="." commit -m "Polish admin/storefront and add Render blueprint"
gh repo create hasan-shop-platform --private --source=. --push
```

### ب) قاعدة البيانات
- إما حذف/إنهاء `amartech-dz-db` الفارغة وإنشاء `hasan-shop-db`
- أو ترقية Postgres إلى **Basic** من لوحة Render

بعد الإنشاء انسخ `DATABASE_URL` من Render.

### ج) Render Blueprint
1. افتح https://dashboard.render.com/blueprints
2. New Blueprint Instance → اختر `hasan-shop-platform`
3. اربط القيم:
   - `DATABASE_URL` = Postgres
   - `REDIS_URL` = Internal URL لـ `hasan-shop-redis`
   - `NEXT_PUBLIC_API_URL` = `https://hasan-shop-api.onrender.com`
   - `APP_URL` / `NEXT_PUBLIC_APP_URL` = رابط الـ storefront
   - `ADMIN_URL` = رابط الأدمن
4. Deploy

### د) ترحيل القاعدة بعد أول deploy ناجح
من خدمة API (Shell) أو محلياً ضد `DATABASE_URL` الإنتاجي:
```powershell
$env:DATABASE_URL="postgresql://..."
pnpm db:migrate
pnpm db:seed
```

## عناوين متوقعة
| خدمة | URL تقريبي |
|------|-------------|
| Storefront | https://hasan-shop-storefront.onrender.com/ar |
| Admin | https://hasan-shop-admin.onrender.com |
| API | https://hasan-shop-api.onrender.com/api/v1/health |

> خطة Free على Render تدخل sleep بعد الخمول — أول طلب قد يأخذ ~50 ثانية.

## بديل فوري (نفق محلي عام)
إن أردت رابطاً عاماً الآن بدون GitHub:
```powershell
npx --yes cloudflared tunnel --url http://localhost:3003
npx --yes cloudflared tunnel --url http://localhost:3001
```
(مع بقاء API على :4000 محلياً وCORS مضبوطاً لعنوان النفق)
