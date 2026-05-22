# Radwa Muhammed Official Platform

The official digital platform for Radwa Muhammed. This platform includes an e-commerce store for digital products, a consultation booking system, a blog, and a dynamic pop-up system, all managed through a comprehensive admin dashboard.

## 🌟 Key Features

- **Store & E-commerce:** Browse and purchase digital products with secure payments via Paymob.
- **Guest & Authenticated Checkout:** Seamless checkout experience with support for one-time guest purchases and persistent accounts.
- **Consultation Booking System:** Book online sessions with automated Google Calendar integration and reminders.
- **Installment Payments:** Support for installment plans and automated billing reminders.
- **Admin Dashboard:** Full control over content, products, bookings, coupons, and site settings.
- **Dynamic Pop-ups:** Smart, customizable pop-ups for lead generation and announcements.
- **Blog:** SEO-optimized content management for articles and updates.

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Payments:** [Paymob](https://paymob.com/)
- **Storage:** Cloudflare R2 / Supabase Storage
- **Deployment:** [Vercel](https://vercel.com/)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm, yarn, or pnpm
- Supabase Project
- Paymob Account

### Environment Variables
Create a `.env.local` file in the root directory and add your environment variables (Supabase URL/Keys, Paymob credentials, etc.):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
# Add other required keys...
```

### Installation

1. Install the dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📦 Deployment

This project is optimized for deployment on Vercel. 

If your Vercel project is linked to the GitHub repository, pushing to the `main` branch will automatically trigger a production deployment. (Ensure that `main` is set as your Production Branch in Vercel settings).

To deploy manually via CLI:
```bash
npm i -g vercel
vercel --prod
```
