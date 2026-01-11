# 🎙️ 

منصة تحويل النص إلى صوت (Text-to-Speech) باستخدام **Piper TTS** في المتصفح مع نموذج **en_US-libritts-high.onnx**. المشروع مصمم للعمل على **Cloudflare Workers** مع حل ذكي لمشكلة حد الـ 25 ميجابايت.

## ✨ المميزات

- **تحويل نص إلى صوت في المتصفح** - لا حاجة لخادم
- **نموذج عالي الجودة** - LibriTTS بجودة عالية
- **تحكم كامل** - السرعة والمتحدث والمزيد
- **تحميل وتشغيل** - حفظ الملفات الصوتية
- **متوافق مع Cloudflare Workers** - حل تقسيم الملفات الذكي
- **واجهة عربية** - دعم كامل للغة العربية

## 🚀 البدء السريع

### المتطلبات

- Node.js 16+
- pnpm أو npm

### التثبيت

```bash
# استنساخ المستودع
git clone https://github.com/Motaart/tet.git
cd piper-tts-platform

# تثبيت التبعيات
pnpm install

# تحميل نموذج Piper TTS
pnpm run download-model

# تشغيل خادم التطوير
pnpm run dev
```

### البناء للإنتاج

```bash
pnpm run build
```

## 📋 البنية الأساسية

```
piper-tts-platform/
├── src/
│   ├── main.ts           # التطبيق الرئيسي
│   └── style.css         # الأنماط
├── public/
│   └── models/           # ملفات النموذج (تُحمّل تلقائياً)
├── scripts/
│   └── download-model.mjs # سكريبت تحميل وتقسيم النموذج
├── index.html            # الصفحة الرئيسية
├── package.json          # التبعيات
└── README.md            # هذا الملف
```

## 🔧 حل مشكلة حجم الملفات

### المشكلة
نموذج **en_US-libritts-high.onnx** يبلغ حجمه **~137 ميجابايت**، بينما Cloudflare Workers يسمح بـ **25 ميجابايت فقط** للملف الواحد.

### الحل المطبق

1. **تقسيم الملفات** - تقسيم النموذج إلى أجزاء بحجم 20 ميجابايت
2. **استضافة على GitHub Releases** - رفع الأجزاء على GitHub
3. **تحميل ديناميكي** - تحميل الأجزاء تلقائياً عند الحاجة
4. **ملف Manifest** - تتبع جميع الأجزاء

### كيفية التطبيق

```bash
# تحميل النموذج وتقسيمه
pnpm run download-model

# سيتم إنشاء:
# - en_US-libritts-high.onnx.part0 (20MB)
# - en_US-libritts-high.onnx.part1 (20MB)
# - en_US-libritts-high.onnx.part2 (20MB)
# - en_US-libritts-high.onnx.part3 (20MB)
# - en_US-libritts-high.onnx.part4 (20MB)
# - en_US-libritts-high.onnx.part5 (17MB)
# - en_US-libritts-high.onnx.json
# - manifest.json
```

## 🌐 النشر على Cloudflare Workers

### الخطوة 1: إنشاء wrangler.toml

```toml
name = "piper-tts"
type = "javascript"
account_id = "your-account-id"
workers_dev = true
route = "example.com/*"
zone_id = "your-zone-id"

[env.production]
name = "piper-tts-prod"
route = "yourdomain.com/*"
zone_id = "your-zone-id"

[build]
command = "npm install && npm run build"
cwd = "./"
watch_paths = ["src/**/*.ts"]

[build.upload]
format = "modules"
main = "./dist/index.js"
```

### الخطوة 2: بناء وتشغيل

```bash
# بناء المشروع
pnpm run build

# نشر على Cloudflare Workers
wrangler publish
```

### الخطوة 3: رفع ملفات النموذج

```bash
# رفع الأجزاء على GitHub Releases
gh release create v1.0.0 \
  public/models/en_US-libritts-high.onnx.part* \
  public/models/en_US-libritts-high.onnx.json
```

## 📚 الاستخدام

### في المتصفح

1. افتح التطبيق في المتصفح
2. أدخل النص المراد تحويله إلى صوت
3. اختر السرعة والمتحدث
4. انقر على "تحويل إلى صوت"
5. استمع أو حمّل الملف

### في الكود

```typescript
import { PiperTTS } from '@mintplex-labs/piper-tts-web';

const piper = new PiperTTS();
await piper.loadModel('path/to/model.onnx');

const audioBuffer = await piper.synthesize('مرحبا', {
  speaker: 0,
  length_scale: 1.0,
});

// تشغيل الصوت
const audio = new Audio(URL.createObjectURL(new Blob([audioBuffer])));
audio.play();
```

## 🔗 المراجع والموارد

- [Piper TTS - GitHub](https://github.com/rhasspy/piper)
- [Piper Voices - HuggingFace](https://huggingface.co/rhasspy/piper-voices)
- [ONNX Runtime Web](https://github.com/microsoft/onnxruntime/tree/main/js/web)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [@mintplex-labs/piper-tts-web](https://www.npmjs.com/package/@mintplex-labs/piper-tts-web)

## 📝 الملاحظات المهمة

### حول النموذج
- **الحجم الأصلي**: 137 ميجابايت
- **بعد التقسيم**: 6 أجزاء (20MB + 20MB + 20MB + 20MB + 20MB + 17MB)
- **الجودة**: عالية جداً مع 904 متحدث
- **اللغة**: الإنجليزية الأمريكية

### حول الأداء
- **التحميل الأول**: قد يستغرق 1-2 دقيقة (يتم التخزين المؤقت بعدها)
- **المعالجة**: سريعة جداً (ثوان معدودة)
- **استهلاك الذاكرة**: ~500MB عند التحميل الكامل

### التوافقية
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ❌ Internet Explorer (غير مدعوم)

## 🤝 المساهمة

نرحب بالمساهمات! يرجى:

1. عمل Fork للمستودع
2. إنشاء فرع للميزة الجديدة (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push إلى الفرع (`git push origin feature/AmazingFeature`)
5. فتح Pull Request

## 📄 الترخيص

هذا المشروع مرخص تحت MIT License - انظر ملف [LICENSE](LICENSE) للتفاصيل.

## 👨‍💻 المؤلف

تم بناء هذا المشروع بواسطة **Motaart** لتوفير حل سهل وفعال لتحويل النص إلى صوت في المتصفح.

## 📞 الدعم

إذا واجهت أي مشاكل:

1. تحقق من [Issues](https://github.com/Motaart/tet/issues)
2. ابحث عن حل مشابه
3. فتح Issue جديد مع التفاصيل الكاملة

---

**ملاحظة**: هذا المشروع يستخدم نماذج مفتوحة المصدر من Rhasspy Piper. شكراً لفريق Piper على العمل الرائع!
