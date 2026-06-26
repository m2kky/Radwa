'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import gsap from 'gsap'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { SiteGeneralSettings } from '@/lib/site-content'
import styles from './navbar.module.css'

export default function Navbar({ settings }: { settings: SiteGeneralSettings }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [user, setUser] = useState<{ email?: string } | null>(null);
    const pathname = usePathname();
    const router = useRouter();

    // Refs للـ GSAP
    const overlayRef = useRef<HTMLDivElement>(null);
    const menuTitleRef = useRef<HTMLHeadingElement>(null);
    const linksRef = useRef<(HTMLAnchorElement | null)[]>([]);
    const imageRef = useRef<HTMLImageElement>(null);
    const timeline = useRef<gsap.core.Timeline | null>(null);

    const NAV_LINKS = [
      { label: 'الرئيسية', href: '/' },
      { label: 'الخدمات', href: '/services' },
      { label: 'Guides & Templates', href: '/guides' },
      { label: 'المتجر', href: '/shop' },
      { label: 'أعمالي', href: '/portfolio' },
      { label: 'المدونة', href: '/blog' },
      { label: 'من أنا', href: '/about' },
    ]

    useEffect(() => {
        const handleScroll = () => {
            const headerOffset = 50; 
            const elementsAtPoint = document.elementsFromPoint(window.innerWidth / 2, headerOffset);

            let isLightUnderneath = false;

            for (const el of elementsAtPoint) {
                if (el.closest('#main-nav') || el.closest(`.${styles.overlay}`)) continue;

                const bg = window.getComputedStyle(el).backgroundColor;
                if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
                    const rgb = bg.match(/\d+/g);
                    if (rgb && rgb.length >= 3) {
                        const r = parseInt(rgb[0]);
                        const g = parseInt(rgb[1]);
                        const b = parseInt(rgb[2]);

                        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                        if (brightness > 128) {
                            isLightUnderneath = true;
                        }
                        break; 
                    }
                }
            }

            const navElement = document.getElementById('main-nav');
            if (navElement) {
                if (isLightUnderneath) {
                    navElement.classList.add(styles.lightMode);
                } else {
                    navElement.classList.remove(styles.lightMode);
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll, { passive: true });
        setTimeout(handleScroll, 100);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, []);

    useEffect(() => {
        const supabase = createClient()
        supabase.auth.getUser().then(({ data }) => setUser(data.user))
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setUser(s?.user ?? null))
        return () => subscription.unsubscribe()
    }, [])

    const logout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        setIsMenuOpen(false)
        router.push('/')
        router.refresh()
    }

    // Animation overlay changes ...
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.set(overlayRef.current, {
                clipPath: 'inset(0% 0% 100% 0%)',
                visibility: 'hidden'
            });

            gsap.set(menuTitleRef.current, { yPercent: 120, skewY: 5, opacity: 0 });
            gsap.set(linksRef.current, { yPercent: 120, skewY: 5, opacity: 0 });
            if (imageRef.current) {
                gsap.set(imageRef.current, { scale: 1.2 });
            }

            timeline.current = gsap.timeline({ paused: true })
                .to(overlayRef.current, {
                    clipPath: 'inset(0% 0% 0% 0%)',
                    visibility: 'visible',
                    duration: 1.2,
                    ease: 'expo.inOut',
                })
                .to(imageRef.current, {
                    scale: 1,
                    duration: 1.2,
                    ease: 'expo.inOut',
                }, 0)
                .to(menuTitleRef.current, {
                    yPercent: 0,
                    skewY: 0,
                    opacity: 1,
                    duration: 0.8,
                    ease: 'power4.out',
                }, "-=0.6")
                .to(linksRef.current, {
                    yPercent: 0,
                    skewY: 0,
                    opacity: 1,
                    duration: 0.8,
                    ease: 'power4.out',
                    stagger: 0.1,
                }, "-=0.7");
        });

        return () => ctx.revert();
    }, []);

    useEffect(() => {
        if (isMenuOpen) {
            // Prevent scrolling on body
            document.body.style.overflow = 'hidden';
            timeline.current?.play();
            document.getElementById('main-nav')?.classList.remove(styles.lightMode);
        } else {
            document.body.style.overflow = '';
            timeline.current?.reverse();
            window.dispatchEvent(new Event('scroll'));
        }
    }, [isMenuOpen]);

    // Close menu purely on route change
    useEffect(() => {
        const closeTimer = window.setTimeout(() => {
            setIsMenuOpen(false);
        }, 0);

        return () => window.clearTimeout(closeTimer);
    }, [pathname]);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <>
            {/* ── Navbar ── */}
            <nav id="main-nav" className={`${styles.nav} ${isMenuOpen ? styles.menuIsOpenOverride : ''}`}>
                <div className={styles.navBackground}></div>
                <div className={styles.right}>
                    {/* زرار الـ Menu */}
                    <button
                        className={`${styles.menuBtn} ${isMenuOpen ? styles.menuOpen : ''}`}
                        onClick={toggleMenu}
                        aria-label="Toggle Menu"
                    >
                        <div className={styles.linesContainer}>
                            <div className={styles.line1}></div>
                            <div className={styles.line2}></div>
                        </div>
                    </button>

                    <Link href="/about" className={styles.link}>من أنا</Link>
                    <Link href="/services" className={styles.link}>الخدمات</Link>
                    <Link href="/guides" className={styles.link}>Guides</Link>
                    <Link href="/portfolio" className={styles.link}>أعمالي</Link>
                    <Link href="/blog" className={styles.link}>المدونة</Link>
                </div>

                <div className={styles.center}>
                    <Link href="/" className={styles.logo}>RADWA MUHAMMED</Link>
                </div>

                <div className={styles.left}>
                    <span className={styles.label} dangerouslySetInnerHTML={{ __html: 'SEO Specialist & Business Developer<br />FOR AMBITIOUS BRANDS' }} />
                </div>
            </nav>

            {/* ── Fullscreen Menu Overlay ── */}
            <div
                ref={overlayRef}
                className={`${styles.overlay} ${isMenuOpen ? styles.isOpen : ''}`}
            >
                <div className="absolute inset-0 w-full h-full -z-10 overflow-hidden bg-cold-black">
                   <Image 
                      ref={imageRef}
                      src="/menu-bg.webp" 
                      alt="Radwa Muhammed Menu Background" 
                      fill 
                      className="object-cover object-center blur-[2px] opacity-50"
                   />
                </div>

                <div className={styles.overlayContent}>
                    {/* العمود الأيمن: كلمة MENU */}
                    <div>
                        <div className={styles.linkItem}>
                            <h2 ref={menuTitleRef} className={styles.menuTitle}>MENU</h2>
                        </div>
                    </div>

                    {/* العمود الأيسر: اللينكات */}
                    <div className={styles.menuLinks}>
                        <div className={styles.navLinksList}>
                            {NAV_LINKS.map((item, index) => (
                                <div key={item.label} className={styles.linkItem}>
                                    <Link
                                        href={item.href}
                                        className={styles.hugeLink}
                                        ref={(el) => {
                                            linksRef.current[index] = el;
                                        }}
                                    >
                                        {item.label}
                                    </Link>
                                </div>
                            ))}
                        </div>

                        <div className={styles.menuActions}>
                            <Link
                                href={settings.booking_cta_href || '/book'}
                                className={styles.menuActionButton}
                            >
                                {settings.booking_cta_label || 'احجزي جلسة'}
                            </Link>

                            {user ? (
                                <>
                                    <Link
                                        href="/dashboard"
                                        className={styles.menuActionButton}
                                    >
                                        داشبورد
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className={styles.menuActionButton}
                                        style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444' }}
                                    >
                                        خروج
                                    </button>
                                </>
                            ) : (
                                <Link
                                    href="/login"
                                    className={styles.menuActionButton}
                                >
                                    دخول
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
