# 🚀 دليل النشر على Cloudflare Workers

هذا الدليل يشرح كيفية نشر منصة Piper TTS على Cloudflare Workers مع حل مشكلة حجم الملفات.

## 📋 المتطلبات الأساسية

- حساب Cloudflare مع Workers مفعّل
- Wrangler CLI مثبت (`npm install -g wrangler`)
- GitHub Personal Access Token (اختياري، للتوثيق)
- Node.js 16+

## 🔑 الخطوة 1: إعداد بيانات اعتماد Cloudflare

```bash
# تسجيل الدخول إلى Cloudflare
wrangler login

# ستُطلب منك فتح صفحة في المتصفح والموافقة على الوصول
```

## 📝 الخطوة 2: تحديث wrangler.toml

قم بتعديل ملف `wrangler.toml` وأضف بيانات حسابك:

```toml
name = "piper-tts-platform"
type = "javascript"
account_id = "YOUR_ACCOUNT_ID"  # ابحث عنه في لوحة Cloudflare
workers_dev = true
main = "dist/index.js"
compatibility_date = "2024-01-01"

# للإنتاج، أضف:
[env.production]
name = "piper-tts-prod"
workers_dev = false
route = "yourdomain.com/*"
zone_id = "YOUR_ZONE_ID"
```

### كيفية الحصول على Account ID و Zone ID:

1. اذهب إلى [Cloudflare Dashboard](https://dash.cloudflare.com)
2. اختر الحساب الخاص بك
3. انسخ **Account ID** من الأسفل يميناً
4. اختر النطاق الخاص بك
5. انسخ **Zone ID** من الأسفل يميناً

## 🏗️ الخطوة 3: بناء المشروع

```bash
# تثبيت التبعيات
pnpm install

# بناء المشروع
pnpm run build

# التحقق من أن dist/ تم إنشاؤه بنجاح
ls -la dist/
```

## 📦 الخطوة 4: نشر على Cloudflare Workers

### النشر على Workers Dev (للاختبار):

```bash
# نشر مباشر
wrangler deploy

# أو نشر مع بيئة محددة
wrangler deploy --env development
```

### النشر على النطاق الخاص بك (الإنتاج):

```bash
# تأكد من تحديث wrangler.toml أولاً
wrangler deploy --env production
```

## 🎯 الخطوة 5: استضافة ملفات النموذج

### الخيار 1: استخدام GitHub Releases (الموصى به)

```bash
# 1. تحميل النموذج وتقسيمه
pnpm run download-model

# 2. إنشاء Release على GitHub
gh release create v1.0.0 \
  --title "Piper TTS Model v1.0.0" \
  --notes "LibriTTS High Quality Model" \
  public/models/en_US-libritts-high.onnx.part* \
  public/models/en_US-libritts-high.onnx.json

# 3. تحديث URL في src/main.ts
# غيّر modelUrl إلى:
# https://github.com/Motaart/tet/releases/download/v1.0.0/en_US-libritts-high.onnx.part0
```

### الخيار 2: استخدام R2 (Cloudflare's Object Storage)

```bash
# 1. إنشاء R2 Bucket
wrangler r2 bucket create piper-models

# 2. رفع الملفات
wrangler r2 object put piper-models/en_US-libritts-high.onnx.part0 \
  --file public/models/en_US-libritts-high.onnx.part0

# 3. تحديث wrangler.toml
[[r2_buckets]]
binding = "MODELS"
bucket_name = "piper-models"

# 4. تحديث src/main.ts
const modelUrl = 'https://your-r2-domain.com/en_US-libritts-high.onnx.part0';
```

### الخيار 3: استخدام CDN خارجي (مثل jsDelivr)

```bash
# 1. رفع الملفات إلى npm
npm publish

# 2. استخدام jsDelivr
# https://cdn.jsdelivr.net/npm/piper-tts-platform@1.0.0/public/models/en_US-libritts-high.onnx.part0
```

## ⚙️ الخطوة 6: تكوين CORS (إذا لزم الأمر)

إذا كنت تحمّل ملفات النموذج من نطاق مختلف، أضف CORS headers:

```typescript
// في src/main.ts
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Range',
};
```

## 🧪 الخطوة 7: الاختبار

### اختبار محلي:

```bash
# تشغيل خادم التطوير
pnpm run dev

# افتح http://localhost:5173 في المتصفح
```

### اختبار على Workers Dev:

```bash
# بعد النشر، سيظهر URL مثل:
# https://piper-tts-platform.your-account.workers.dev

# اختبر الرابط في المتصفح
```

## 🔍 استكشاف الأخطاء

### المشكلة: "Model failed to load"

**الحل**:
- تحقق من أن ملفات النموذج موجودة وقابلة للوصول
- تأكد من صحة URL في `modelUrl`
- تحقق من CORS headers

```bash
# اختبر الوصول للملف
curl -I https://your-model-url/en_US-libritts-high.onnx.part0
```

### المشكلة: "Worker size exceeds limit"

**الحل**:
- تأكد من أن `dist/` لا يحتوي على ملفات النموذج
- استخدم `.gitignore` بشكل صحيح
- استضف ملفات النموذج خارجياً (GitHub, R2, CDN)

```bash
# تحقق من حجم dist/
du -sh dist/

# يجب أن يكون أقل من 25MB
```

### المشكلة: "Timeout during synthesis"

**الحل**:
- زيادة CPU timeout في wrangler.toml:
```toml
limits = { cpu_ms = 50000 }  # 50 ثانية
```

- استخدم نموذج أخف (مثل `en_US-libritts-medium`)

## 📊 مراقبة الأداء

### استخدام Cloudflare Analytics:

```bash
# عرض إحصائيات الطلبات
wrangler tail

# عرض الأخطاء
wrangler tail --status error
```

### تحسين الأداء:

1. **تفعيل التخزين المؤقت**:
```typescript
const cacheKey = new Request(url, { method: 'GET' });
const cache = caches.default;
```

2. **ضغط الملفات**:
```bash
gzip -9 public/models/*.onnx
```

3. **استخدام CDN**:
- استخدم Cloudflare's global CDN
- استضف ملفات النموذج على R2 مع CDN

## 🔐 الأمان

### نصائح الأمان:

1. **لا تشارك التوكنات**: استخدم متغيرات البيئة
```bash
export CLOUDFLARE_API_TOKEN="your-token"
```

2. **قيّد الوصول**: استخدم IP whitelist
```toml
[env.production]
route = "yourdomain.com/*"
```

3. **استخدم HTTPS فقط**:
```typescript
if (request.url.startsWith('http://')) {
  return new Response('HTTPS required', { status: 403 });
}
```

## 📈 التوسع والصيانة

### تحديث النموذج:

```bash
# 1. حمّل نموذج جديد
pnpm run download-model

# 2. أنشئ Release جديد
gh release create v2.0.0 public/models/en_US-libritts-high.onnx.part*

# 3. حدّث src/main.ts
# غيّر URL إلى الإصدار الجديد

# 4. أعد النشر
pnpm run build
wrangler deploy
```

### النسخ الاحتياطية:

```bash
# احفظ نسخة من dist/
git tag v1.0.0-deployed
git push origin v1.0.0-deployed

# احفظ ملفات النموذج
gh release create backup-v1.0.0 public/models/*
```

## 📞 الدعم والمساعدة

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- [GitHub Issues](https://github.com/Motaart/tet/issues)

---

**ملاحظة**: تأكد من اتباع جميع الخطوات بعناية. إذا واجهت مشاكل، تحقق من السجلات باستخدام `wrangler tail`.
