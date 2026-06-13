import fs from 'fs';
import path from 'path';

// Parse .env.local
const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    env[key.trim()] = values.join('=').trim().replace(/^"|"$/g, '');
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/portfolio_items';
const key = env.SUPABASE_SERVICE_ROLE_KEY;

const content = `<h3>التحدي (The Challenge):</h3><p>كانت الشركة تعتمد بشكل أساسي على رحلات الحج والعمرة فقط، مع غياب موقع إلكتروني فعّال للاعتماد عليه في الحجوزات، وضعف في التنوع البصري للمحتوى رغم وجود قاعدة جماهيرية جيدة (51 ألف متابع). كان التحدي هو تغيير الصورة النمطية وفتح أسواق جديدة للسياحة الخارجية (مصر وتركيا).</p><h3>الدراسة والتحليل (Analysis & Strategy):</h3><p>تم إجراء دراسة SWOT شاملة للسوق الليبي ووضع المنافسين، وتم تحديد الفرص المتاحة في الطلب المتزايد على الرحلات السياحية، وتحديد الفئة المستهدفة بدقة (+18، مهتمون بالسفر والتسوق الإلكتروني).</p><h3>خطة العمل والحلول (The Execution):</h3><ul><li><strong>تطوير البنية التحتية:</strong> توجيه الشركة لإنشاء موقع إلكتروني مزود بنظام حجز أونلاين وتوسيع التواجد على TikTok و Instagram.</li><li><strong>استراتيجية المحتوى:</strong> نشر 4 منشورات أسبوعياً تنوعت بين الفيديوهات (Reels) ومراجعات العملاء الواقعية، وتسليط الضوء على الوجهات السياحية المختلفة لتخطي حاجز الحج والعمرة فقط.</li><li><strong>الخطة الإعلانية:</strong> وضع ميزانية محددة بقيمة 750$ شهرياً مقسمة استراتيجياً على (رسائل فيسبوك وانستجرام، تفاعل تيك توك، زيارات بروفايل انستجرام، وزيادة الإعجابات).</li></ul><h3>الأهداف والنتائج المتوقعة (Goals):</h3><ul><li>زيادة الأرباح بنسبة 20% بعد الشهر الثالث.</li><li>الوصول لـ 80,000 متابع حقيقي ومستهدف.</li><li>تحقيق 10,000 محادثة (Lead) خلال أول 3 أشهر.</li></ul>`;

const data = {
  type: 'case_study',
  title: 'استراتيجية النمو والتسويق لشركة الجناح الذهبي للسياحة',
  short_description: 'إعداد دراسة سوق شاملة وخطة إعلانية ومحتوى متكاملة لزيادة الأرباح بنسبة 20% وبناء تواجد رقمي قوي لشركة الجناح الذهبي في السوق الليبي.',
  content_body: content,
  category: 'تسويق سياحي',
  tags: ['سياحة', 'استراتيجية تسويق', 'دراسة منافسين', 'سوق ليبي'],
  client_name: 'شركة الجناح الذهبي للخدمات السياحية',
  role: 'مستشار ومخطط استراتيجي',
  year: '2023',
  is_published: true
};

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': key,
    'Authorization': 'Bearer ' + key,
    'Prefer': 'return=representation'
  },
  body: JSON.stringify(data)
}).then(async res => {
  if (!res.ok) {
    console.error(await res.text());
  } else {
    console.log('Seeded successfully!');
  }
}).catch(console.error);
