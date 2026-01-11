# 🔧 استكشاف الأخطاء والمشاكل

دليل شامل لحل المشاكل الشائعة في منصة Piper TTS.

## 📋 جدول المحتويات

1. [مشاكل التثبيت](#مشاكل-التثبيت)
2. [مشاكل التشغيل](#مشاكل-التشغيل)
3. [مشاكل تحميل النموذج](#مشاكل-تحميل-النموذج)
4. [مشاكل معالجة النص](#مشاكل-معالجة-النص)
5. [مشاكل الصوت](#مشاكل-الصوت)
6. [مشاكل الأداء](#مشاكل-الأداء)
7. [مشاكل النشر](#مشاكل-النشر)

---

## مشاكل التثبيت

### ❌ "npm ERR! code ERESOLVE"

**السبب**: تضارب في التبعيات

**الحل**:
```bash
# استخدم --legacy-peer-deps
npm install --legacy-peer-deps

# أو استخدم pnpm (الأفضل)
pnpm install
```

### ❌ "Node version is not compatible"

**السبب**: إصدار Node قديم جداً

**الحل**:
```bash
# تحقق من الإصدار
node --version

# يجب أن يكون 16 أو أحدث
# للتحديث:
nvm install 18
nvm use 18
```

### ❌ "pnpm: command not found"

**السبب**: pnpm غير مثبت

**الحل**:
```bash
# تثبيت pnpm
npm install -g pnpm

# أو استخدم npm مباشرة
npm install
npm run dev
```

### ❌ "Permission denied"

**السبب**: مشكلة في الصلاحيات

**الحل**:
```bash
# إعطاء صلاحيات التنفيذ
chmod +x scripts/download-model.mjs

# أو استخدم sudo (غير موصى به)
sudo pnpm install
```

---

## مشاكل التشغيل

### ❌ "Port 5174 is already in use"

**السبب**: البورت مشغول

**الحل**:
```bash
# استخدم port مختلف
pnpm run dev -- --port 5175

# أو أغلق التطبيق الآخر
lsof -i :5174
kill -9 <PID>
```

### ❌ "ENOENT: no such file or directory"

**السبب**: ملف مفقود

**الحل**:
```bash
# تحقق من بنية المشروع
ls -la src/
ls -la public/

# أعد تثبيت التبعيات
rm -rf node_modules
pnpm install
```

### ❌ "Module not found: '@mintplex-labs/piper-tts-web'"

**السبب**: المكتبة غير مثبتة

**الحل**:
```bash
# أعد تثبيت المكتبة
pnpm add @mintplex-labs/piper-tts-web onnxruntime-web

# أو أعد تثبيت كل شيء
pnpm install
```

### ❌ "Vite config not found"

**السبب**: ملف vite.config.ts مفقود

**الحل**:
```bash
# أنشئ الملف
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5174,
  },
})
EOF
```

---

## مشاكل تحميل النموذج

### ❌ "Failed to load model"

**السبب**: URL النموذج غير صحيح أو الملف تالف

**الحل**:
```bash
# تحقق من URL
curl -I https://github.com/rhasspy/piper-voices/releases/download/v1.0.0/en_US-libritts-high.onnx

# أعد تحميل النموذج
pnpm run download-model

# تحقق من الملف
ls -lh public/models/
```

### ❌ "CORS error: No 'Access-Control-Allow-Origin' header"

**السبب**: مشكلة في CORS

**الحل**:
```typescript
// في src/main.ts، أضف headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
}

// أو استخدم proxy
// في vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/models': {
        target: 'https://github.com/rhasspy/piper-voices/releases/download/v1.0.0',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/models/, ''),
      },
    },
  },
})
```

### ❌ "Model loading timeout"

**السبب**: النموذج كبير جداً أو الإنترنت بطيء

**الحل**:
```bash
# تحميل النموذج محلياً أولاً
pnpm run download-model

# ثم استخدمه من public/models/
# في src/main.ts
this.state.modelUrl = '/models/en_US-libritts-high.onnx'
```

### ❌ "Out of memory while loading model"

**السبب**: الذاكرة غير كافية

**الحل**:
```bash
# زيادة حد الذاكرة في Node.js
NODE_OPTIONS=--max-old-space-size=4096 pnpm run dev

# أو استخدم نموذج أخف
# استبدل en_US-libritts-high بـ en_US-libritts-medium
```

---

## مشاكل معالجة النص

### ❌ "Text is empty or invalid"

**السبب**: النص فارغ أو يحتوي على أحرف غير مدعومة

**الحل**:
```typescript
// تحقق من صحة النص
if (!text || text.trim().length === 0) {
  console.error('النص فارغ')
  return
}

// أزل الأحرف الخاصة
const cleanText = text.replace(/[^\w\s\.\,\!\?\-]/g, '')
```

### ❌ "Synthesis failed"

**السبب**: خطأ في معالجة النص

**الحل**:
```bash
# جرّب نص أبسط
# مثل: "مرحبا"

# تحقق من وحدة التحكم (Console)
# Ctrl + Shift + I (Chrome)
# F12 (Firefox)

# ابحث عن رسالة الخطأ
```

### ❌ "Speaker not found"

**السبب**: رقم المتحدث غير صحيح

**الحل**:
```typescript
// استخدم المتحدث الافتراضي
const speaker = 0

// تحقق من عدد المتحدثين المدعومين
// في وثائق النموذج
```

---

## مشاكل الصوت

### ❌ "Audio not playing"

**السبب**: مشكلة في AudioContext أو المتصفح

**الحل**:
```typescript
// تحقق من AudioContext
if (audioContext.state === 'suspended') {
  audioContext.resume()
}

// جرّب متصفح مختلف
// تحقق من مستوى الصوت في النظام
```

### ❌ "No sound output"

**السبب**: الصوت مكتوم أو الملف فارغ

**الحل**:
```bash
# تحقق من مستوى الصوت
# في إعدادات النظام

# جرّب تشغيل ملف صوتي آخر
# للتأكد من أن الصوت يعمل

# تحقق من حجم الملف الصوتي
ls -lh ~/Downloads/*.wav
```

### ❌ "Audio buffer is corrupted"

**السبب**: خطأ في تحويل الصوت

**الحل**:
```bash
# أعد محاولة المعالجة
# جرّب نص مختلف
# تحقق من النموذج

# أعد تحميل النموذج
pnpm run download-model
```

### ❌ "Playback speed not working"

**السبب**: مشكلة في معامل السرعة

**الحل**:
```typescript
// تحقق من قيمة السرعة
const speed = parseFloat(speedInput.value)
if (speed < 0.5 || speed > 2.0) {
  console.error('السرعة خارج النطاق')
  return
}

// استخدم length_scale الصحيح
const length_scale = 1 / speed
```

---

## مشاكل الأداء

### ❌ "Application is slow"

**السبب**: النموذج كبير أو الجهاز ضعيف

**الحل**:
```bash
# تحسين الأداء:

# 1. استخدم نموذج أخف
# 2. أغلق التطبيقات الأخرى
# 3. استخدم متصفح حديث
# 4. زيادة RAM المتاحة

# تحقق من استهلاك الموارد
# في Chrome DevTools: Ctrl + Shift + I
# اذهب إلى Performance tab
```

### ❌ "High memory usage"

**السبب**: تسرب الذاكرة

**الحل**:
```typescript
// تحرير الذاكرة بعد الاستخدام
URL.revokeObjectURL(audioUrl)

// مسح المتغيرات الكبيرة
audioBuffer = null
```

### ❌ "Freezing during synthesis"

**السبب**: معالجة ثقيلة على الـ main thread

**الحل**:
```typescript
// استخدم Web Workers (متقدم)
const worker = new Worker('worker.js')
worker.postMessage({ text: 'مرحبا' })
```

---

## مشاكل النشر

### ❌ "Worker size exceeds limit"

**السبب**: حجم التطبيق أكبر من 25MB

**الحل**:
```bash
# تحقق من حجم dist/
du -sh dist/

# استضف ملفات النموذج خارجياً
# في GitHub Releases أو R2

# أزل الملفات الكبيرة من dist/
rm -rf dist/models/
```

### ❌ "Deployment failed"

**السبب**: مشكلة في بيانات اعتماد Cloudflare

**الحل**:
```bash
# تحقق من wrangler.toml
cat wrangler.toml

# تسجيل الدخول مجدداً
wrangler login

# جرّب النشر مرة أخرى
wrangler deploy
```

### ❌ "Model files not accessible after deployment"

**السبب**: URL النموذج غير صحيح على الخادم

**الحل**:
```typescript
// استخدم URL مطلق
this.state.modelUrl = 'https://github.com/rhasspy/piper-voices/releases/download/v1.0.0/en_US-libritts-high.onnx'

// أو استخدم R2
this.state.modelUrl = 'https://your-r2-domain.com/en_US-libritts-high.onnx'
```

---

## 🆘 الحصول على المساعدة

### 1. تحقق من السجلات

```bash
# في المتصفح
F12 أو Ctrl + Shift + I

# في Terminal
pnpm run dev 2>&1 | tee debug.log
```

### 2. ابحث عن الحل

- [GitHub Issues](https://github.com/Motaart/tet/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/piper-tts)
- [Piper TTS Docs](https://github.com/rhasspy/piper)

### 3. فتح Issue جديد

```markdown
**الوصف**:
وصف المشكلة بالتفصيل

**الخطوات لإعادة الإنتاج**:
1. ...
2. ...
3. ...

**السلوك المتوقع**:
...

**السلوك الفعلي**:
...

**البيئة**:
- OS: Windows/Mac/Linux
- Browser: Chrome/Firefox/Safari
- Node version: 18.x
- pnpm version: 8.x
```

---

## 📊 جدول التشخيص السريع

| الأعراض | السبب المحتمل | الحل |
|--------|-------------|------|
| لا شيء يحدث | المكتبات غير مثبتة | `pnpm install` |
| خطأ في المنفذ | البورت مشغول | `--port 5175` |
| لا يمكن تحميل النموذج | URL خاطئ | `pnpm run download-model` |
| لا صوت | AudioContext معطل | `audioContext.resume()` |
| بطء شديد | الجهاز ضعيف | استخدم نموذج أخف |
| فشل النشر | بيانات اعتماد خاطئة | `wrangler login` |

---

**آخر تحديث**: January 2026

إذا لم تجد حلاً، يرجى [فتح Issue جديد](https://github.com/Motaart/tet/issues/new) مع جميع التفاصيل.
