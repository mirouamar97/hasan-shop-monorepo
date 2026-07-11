import { eq } from 'drizzle-orm';
import { createDatabaseClient } from './client';
import {
  roles,
  users,
  storeSettings,
  featureFlags,
  carrierConfigs,
  suppliers,
  categories,
  categoryTranslations,
  brands,
  products,
  productTranslations,
  productImages,
  inventory,
  notificationTemplates,
} from './schema/index';
import { ROLES } from '@hasan-shop/shared/permissions';
import { seedGeographicData } from './geo-data';

async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcrypt');
  return bcrypt.hash(password, 12);
}

const DEFAULT_STORE_SETTINGS: Record<string, string> = {
  store_name: 'HASAN SHOP',
  store_tagline: 'متجرك الموثوق في الجزائر',
  store_logo_url: '',
  store_favicon_url: '/favicon.ico',
  primary_color: '#1a56db',
  secondary_color: '#111827',
  accent_color: '#f59e0b',
  contact_email: 'contact@hasan-shop.dz',
  contact_phone: '0550000000',
  contact_whatsapp: '213550000000',
  contact_address: 'الجزائر العاصمة، الجزائر',
  social_facebook: '',
  social_instagram: '',
  social_tiktok: '',
  social_twitter: '',
  seo_title_ar: 'HASAN SHOP — متجر إلكتروني موثوق في الجزائر',
  seo_title_fr: 'HASAN SHOP — Boutique en ligne de confiance en Algérie',
  seo_description_ar:
    'تسوق أونلاين في HASAN SHOP. توصيل سريع لجميع الولايات، الدفع عند الاستلام، منتجات عالية الجودة.',
  seo_description_fr:
    'Achetez en ligne sur HASAN SHOP. Livraison rapide dans toutes les wilayas, paiement à la livraison.',
  seo_keywords_ar: 'تسوق, الجزائر, dropshipping, دفع عند الاستلام',
  seo_keywords_fr: 'shopping, Algérie, dropshipping, paiement à la livraison',
  default_locale: 'ar',
  cod_enabled: 'true',
  online_payment_enabled: 'false',
  free_shipping_threshold: '10000',
  default_carrier: 'yalidine',
};

const DEFAULT_FEATURE_FLAGS = [
  {
    key: 'international_suppliers',
    enabled: false,
    description: 'Enable international supplier integration',
  },
  {
    key: 'online_payments',
    enabled: false,
    description: 'Enable CIB/Edahabia/BaridiMob online payments',
  },
  {
    key: 'whatsapp_notifications',
    enabled: false,
    description: 'Send order notifications via WhatsApp',
  },
];

async function seed() {
  const connectionString =
    process.env.DATABASE_URL ?? 'postgresql://hasan_shop:hasan_shop_dev@localhost:5432/hasan_shop';

  const db = createDatabaseClient(connectionString);

  console.log('Seeding database...');

  // Seed roles
  for (const [slug, role] of Object.entries(ROLES)) {
    await db
      .insert(roles)
      .values({
        slug,
        name: role.name,
        description: role.description,
        permissions: [...role.permissions],
      })
      .onConflictDoNothing({ target: roles.slug });
  }

  console.log('  ✓ Roles seeded');

  // Seed super admin user
  const [superAdminRole] = await db
    .select()
    .from(roles)
    .where(eq(roles.slug, 'super_admin'))
    .limit(1);

  if (superAdminRole) {
    const adminPassword =
      process.env.SEED_ADMIN_PASSWORD ?? 'DevOnly@HasanShop2026!Secure';
    const passwordHash = await hashPassword(adminPassword);
    await db
      .insert(users)
      .values({
        email: 'admin@hasan-shop.dz',
        passwordHash,
        firstName: 'Super',
        lastName: 'Admin',
        roleId: superAdminRole.id,
        status: 'active',
        totpEnabled: false,
        passwordChangedAt: new Date(),
      })
      .onConflictDoNothing({ target: users.email });
  }

  console.log('  ✓ Super admin user seeded (admin@hasan-shop.dz — password from SEED_ADMIN_PASSWORD env)');

  // Seed store settings
  for (const [key, value] of Object.entries(DEFAULT_STORE_SETTINGS)) {
    await db
      .insert(storeSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: storeSettings.key,
        set: { value, updatedAt: new Date() },
      });
  }

  console.log('  ✓ Store settings seeded');

  // Seed feature flags
  for (const flag of DEFAULT_FEATURE_FLAGS) {
    await db.insert(featureFlags).values(flag).onConflictDoNothing({ target: featureFlags.key });
  }

  console.log('  ✓ Feature flags seeded');

  // Seed carrier configs
  const carriers = [
    { carrier: 'yalidine' as const, displayName: 'Yalidine', isEnabled: true, isDefault: true },
    { carrier: 'zr_express' as const, displayName: 'ZR Express', isEnabled: false, isDefault: false },
    { carrier: 'ecotrack' as const, displayName: 'Ecotrack', isEnabled: false, isDefault: false },
    { carrier: 'noest' as const, displayName: 'Noest', isEnabled: false, isDefault: false },
  ];

  for (const carrier of carriers) {
    await db.insert(carrierConfigs).values(carrier).onConflictDoNothing({ target: carrierConfigs.carrier });
  }

  console.log('  ✓ Carrier configs seeded');

  // Seed default supplier
  await db
    .insert(suppliers)
    .values({
      name: 'Fournisseur Local Principal',
      slug: 'fournisseur-local-principal',
      type: 'local',
      contactPhone: '0550000000',
      isActive: true,
    })
    .onConflictDoNothing({ target: suppliers.slug });

  console.log('  ✓ Default supplier seeded');

  // Seed sample category
  const [category] = await db
    .insert(categories)
    .values({ slug: 'general', sortOrder: 0, isActive: true })
    .onConflictDoNothing({ target: categories.slug })
    .returning();

  if (category) {
    await db
      .insert(categoryTranslations)
      .values([
        { categoryId: category.id, locale: 'ar', name: 'عام', description: 'منتجات متنوعة' },
        { categoryId: category.id, locale: 'fr', name: 'Général', description: 'Produits divers' },
      ])
      .onConflictDoNothing();
  }

  // Seed sample brand
  const [brand] = await db
    .insert(brands)
    .values({ slug: 'hasan-shop', name: 'HASAN SHOP', isActive: true })
    .onConflictDoNothing({ target: brands.slug })
    .returning();

  const brandId = brand?.id ?? (
    await db.select({ id: brands.id }).from(brands).where(eq(brands.slug, 'hasan-shop')).limit(1)
  )[0]?.id;

  const categoryId = category?.id ?? (
    await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, 'general')).limit(1)
  )[0]?.id;

  const [supplier] = await db
    .select({ id: suppliers.id })
    .from(suppliers)
    .where(eq(suppliers.slug, 'fournisseur-local-principal'))
    .limit(1);

  const sampleProducts = [
    {
      sku: 'HS-001',
      slug: 'montre-intelligente',
      price: '4500.00',
      compareAtPrice: '5500.00',
      ar: { name: 'ساعة ذكية', description: 'ساعة ذكية متعددة الوظائف مع تتبع اللياقة' },
      fr: { name: 'Montre intelligente', description: 'Montre connectée avec suivi fitness' },
      image: 'https://picsum.photos/seed/hasan-hs-001/600/600',
    },
    {
      sku: 'HS-002',
      slug: 'ecouteurs-sans-fil',
      price: '2800.00',
      ar: { name: 'سماعات لاسلكية', description: 'سماعات بلوتوث بجودة صوت عالية' },
      fr: { name: 'Écouteurs sans fil', description: 'Écouteurs Bluetooth haute qualité' },
      image: 'https://picsum.photos/seed/hasan-hs-002/600/600',
    },
    {
      sku: 'HS-003',
      slug: 'chargeur-rapide',
      price: '1200.00',
      ar: { name: 'شاحن سريع', description: 'شاحن 65 واط متوافق مع معظم الأجهزة' },
      fr: { name: 'Chargeur rapide', description: 'Chargeur 65W compatible multi-appareils' },
      image: 'https://picsum.photos/seed/hasan-hs-003/600/600',
    },
  ];

  for (const sample of sampleProducts) {
    const [existing] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.sku, sample.sku))
      .limit(1);

    if (existing) continue;

    const [product] = await db
      .insert(products)
      .values({
        sku: sample.sku,
        slug: sample.slug,
        status: 'active',
        categoryId,
        brandId,
        supplierId: supplier?.id,
        price: sample.price,
        compareAtPrice: sample.compareAtPrice,
        isFeatured: sample.sku === 'HS-001',
        trackInventory: true,
      })
      .returning();

    if (!product) continue;

    await db.insert(productTranslations).values([
      {
        productId: product.id,
        locale: 'ar',
        name: sample.ar.name,
        description: sample.ar.description,
        shortDescription: sample.ar.description,
      },
      {
        productId: product.id,
        locale: 'fr',
        name: sample.fr.name,
        description: sample.fr.description,
        shortDescription: sample.fr.description,
      },
    ]);

    await db.insert(productImages).values({
      productId: product.id,
      url: sample.image,
      altText: sample.fr.name,
      sortOrder: 0,
      isPrimary: true,
    });

    await db.insert(inventory).values({
      productId: product.id,
      quantity: 50,
      reservedQuantity: 0,
    });
  }

  console.log('  ✓ Sample category, brand, and products seeded');

  const templates = [
    {
      slug: 'order_created_email',
      channel: 'email',
      name: 'Order Created (Email)',
      subject: 'تأكيد طلبك {{orderNumber}} — HASAN SHOP',
      body: 'مرحباً {{firstName}}،\n\nتم استلام طلبك رقم {{orderNumber}} بمبلغ {{total}} د.ج.\n\nسنتواصل معك قريباً لتأكيد الطلب.\n\nشكراً لثقتك — HASAN SHOP',
    },
    {
      slug: 'order_created_whatsapp',
      channel: 'whatsapp',
      name: 'Order Created (WhatsApp)',
      subject: null,
      body: 'مرحباً {{firstName}} 👋\nطلبك *{{orderNumber}}* بمبلغ *{{total}} د.ج* قيد المعالجة.\nHASAN SHOP',
    },
    {
      slug: 'order_confirmed_whatsapp',
      channel: 'whatsapp',
      name: 'Order Confirmed (WhatsApp)',
      subject: null,
      body: '✅ تم تأكيد طلبك *{{orderNumber}}*. جاري التحضير للشحن.',
    },
    {
      slug: 'order_shipped_whatsapp',
      channel: 'whatsapp',
      name: 'Order Shipped (WhatsApp)',
      subject: null,
      body: '📦 طلبك *{{orderNumber}}* في الطريق إليك. التسليم المتوقع: {{deliveryEstimate}}',
    },
    {
      slug: 'order_delivered_email',
      channel: 'email',
      name: 'Order Delivered (Email)',
      subject: 'تم تسليم طلبك {{orderNumber}}',
      body: 'مرحباً {{firstName}}،\n\nتم تسليم طلبك {{orderNumber}}.\n\nنأمل أن تكون راضياً عن مشترياتك!',
    },
  ];

  for (const tpl of templates) {
    await db
      .insert(notificationTemplates)
      .values(tpl)
      .onConflictDoUpdate({
        target: notificationTemplates.slug,
        set: { body: tpl.body, subject: tpl.subject, name: tpl.name, updatedAt: new Date() },
      });
  }
  console.log('  ✓ Notification templates seeded');

  await seedGeographicData(db);
  console.log('  ✓ Geographic data seeded');

  console.log('Database seeding completed successfully.');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
