# Design System — Radwa v2

## Colors

### Brand Colors (CSS Variables)
```css
--brand-primary         /* اللون الأساسي */
--brand-secondary       /* اللون الثانوي */
--brand-accent          /* لون التمييز */
```

### UI Colors
```css
--background            /* خلفية الصفحة */
--foreground            /* لون النص الأساسي */
--card / --card-foreground
--muted / --muted-foreground
--primary / --primary-foreground
--secondary / --secondary-foreground
--destructive           /* أحمر — حذف / خطأ */
--success               /* أخضر — نجاح */
--warning               /* أصفر — تحذير */
--border / --input / --ring
```

## Typography

| Level | Size | Usage |
|-------|------|-------|
| `text-h1` | 3rem (48px) | عنوان الصفحة |
| `text-h2` | 2.5rem (40px) | عنوان القسم |
| `text-h3` | 2rem (32px) | عنوان فرعي |
| `text-h4` | 1.5rem (24px) | عنوان المكوّن |
| `text-body` | 1rem (16px) | نص عادي |
| `text-body-sm` | 0.875rem (14px) | نص صغير |
| `text-caption` | 0.75rem (12px) | تعليقات |

## Components (Shadcn UI)

| Component | Usage |
|-----------|-------|
| `Button` | variants: default, secondary, outline, ghost, destructive |
| `Card` | بطاقات المنتجات |
| `Input` | حقول النموذج |
| `Badge` | حالة المنتج/الأوردر |
| `Skeleton` | حالة التحميل |
| `Dialog` | نوافذ منبثقة |

## Responsive Breakpoints

| Breakpoint | Size | Usage |
|------------|------|-------|
| `sm` | 640px | موبايل كبير |
| `md` | 768px | تابلت |
| `lg` | 1024px | لابتوب |
| `xl` | 1280px | ديسكتوب |

## Design Principles

1. **Mobile-first** — التصميم يبدأ من الموبايل
2. **RTL Support** — المنصة بالعربي (dir="rtl")
3. **Accessible** — ألوان واضحة + تباين كافي + focus states
4. **Loading States** — كل صفحة ليها skeleton loading
5. **Error States** — كل عملية ليها رسالة خطأ واضحة
