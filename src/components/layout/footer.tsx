/**
 * Footer Component
 * @phase Phase 4: Public Pages
 * @author Agent (Antigravity)
 * @created 2026-02-15
 */
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-transparent py-12 border-t border-white/5">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2">
          <Link href="/" className="font-serif text-2xl font-bold text-primary">رضوى محمد</Link>
          <p className="mt-3 text-sm text-muted-foreground max-w-xs">أبني استراتيجيات عملية تقدم نمواً حقيقياً وقابلاً للقياس.</p>
        </div>
        <div>
          <h3 className="font-semibold mb-3 text-sm">روابط</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/shop" className="hover:text-primary">المتجر</Link></li>
            <li><Link href="/blog" className="hover:text-primary">المدونة</Link></li>
            <li><Link href="/about" className="hover:text-primary">من أنا</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3 text-sm">قانوني</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/terms" className="hover:text-primary">شروط الخدمة</Link></li>
            <li><Link href="/privacy" className="hover:text-primary">الخصوصية</Link></li>
            <li><Link href="/refund" className="hover:text-primary">الاسترجاع</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} رضوى محمد. جميع الحقوق محفوظة.</span>
        <Link href="https://muhammedmekky.com" target="_blank" className="hover:text-primary">طوّر بواسطة محمد مكي</Link>
      </div>
    </footer>
  )
}
