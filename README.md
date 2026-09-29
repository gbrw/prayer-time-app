# مواقيت العراق

تطبيق عربي متجاوب لمواقيت الصلاة في العراق، يعمل على الهاتف ويمكن تثبيته كتطبيق على أندرويد أو iPhone عبر المتصفح (PWA). يعتمد على [IQPR Time](https://iqpr-time-neon.vercel.app/) لجلب البيانات بتوقيت بغداد.

## التشغيل

افتح `index.html` عبر خادم محلي، لأن Service Worker لا يعمل من `file://`:

```bash
npx serve .
```

ثم افتح الرابط من Safari على iPhone واختر **مشاركة → إضافة إلى الشاشة الرئيسية**. وعلى Android اختر **إضافة إلى الشاشة الرئيسية**.

لتحويله إلى تطبيق Android أو iOS أصلي باستخدام Capacitor:

```bash
npm install
npx cap add android
npx cap add ios
npx cap sync android
npx cap sync ios
npx cap open ios
npx cap open android
```

يتطلب بناء iOS جهاز Mac وXcode. إعدادات iOS تشمل اسم التطبيق، الأيقونة، واتجاه RTL من خلال `capacitor.config.ts` وملفات الويب.

## النشر على Vercel

1. ارفع المشروع إلى GitHub.
2. من [vercel.com/new](https://vercel.com/new) اختر **Import Git Repository** ثم اختر المستودع.
3. اترك **Framework Preset** على `Other`، واترك **Build Command** و**Output Directory** فارغين.
4. اضغط **Deploy**. ملف `vercel.json` موجود مسبقًا لضبط ملفات PWA وService Worker.

بعد النشر افتح رابط Vercel من Safari على iPhone ثم اختر **مشاركة → إضافة إلى الشاشة الرئيسية**.