import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// =============================================================================
// Enums
// =============================================================================

export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'suspended']);
export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'confirmed',
  'preparing',
  'ready_to_ship',
  'shipped',
  'delivered',
  'completed',
  'cancelled',
  'customer_refused',
  'returned',
  'failed_delivery',
  'refunded',
]);
export const paymentMethodEnum = pgEnum('payment_method', ['cod', 'cib', 'edahabia', 'baridimob']);
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'authorized',
  'captured',
  'failed',
  'refunded',
  'cancelled',
]);
export const productStatusEnum = pgEnum('product_status', ['draft', 'active', 'archived']);
export const supplierTypeEnum = pgEnum('supplier_type', ['local', 'international']);
export const deliveryTypeEnum = pgEnum('delivery_type', ['home', 'stop_desk']);
export const carrierSlugEnum = pgEnum('carrier_slug', [
  'yalidine',
  'zr_express',
  'ecotrack',
  'noest',
]);
export const confirmationMethodEnum = pgEnum('confirmation_method', [
  'phone',
  'whatsapp',
  'sms',
  'email',
]);
export const confirmationOutcomeEnum = pgEnum('confirmation_outcome', [
  'confirmed',
  'no_answer',
  'wrong_number',
  'cancelled_by_customer',
  'rescheduled',
]);
export const shipmentStatusEnum = pgEnum('shipment_status', [
  'created',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'refused',
  'returned',
  'cancelled',
]);
export const auditActionEnum = pgEnum('audit_action', [
  'create',
  'update',
  'delete',
  'login',
  'logout',
  'export',
  'status_change',
]);
export const fulfillmentStageEnum = pgEnum('fulfillment_stage', [
  'picking',
  'packing',
  'quality_check',
  'ready_to_ship',
]);
export const fulfillmentStatusEnum = pgEnum('fulfillment_status', [
  'pending',
  'in_progress',
  'completed',
  'skipped',
]);

// =============================================================================
// Users & Auth (Admin)
// =============================================================================

export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  permissions: jsonb('permissions').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    firstName: varchar('first_name', { length: 50 }).notNull(),
    lastName: varchar('last_name', { length: 50 }).notNull(),
    phone: varchar('phone', { length: 15 }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id),
    status: userStatusEnum('status').notNull().default('active'),
    totpSecret: varchar('totp_secret', { length: 255 }),
    totpEnabled: boolean('totp_enabled').notNull().default(false),
    failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    passwordChangedAt: timestamp('password_changed_at', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('users_role_id_idx').on(table.roleId), index('users_status_idx').on(table.status)],
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 255 }).notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('sessions_user_id_idx').on(table.userId),
    index('sessions_expires_at_idx').on(table.expiresAt),
  ],
);

// =============================================================================
// Customers
// =============================================================================

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 15 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }),
    firstName: varchar('first_name', { length: 50 }).notNull(),
    lastName: varchar('last_name', { length: 50 }).notNull(),
    locale: varchar('locale', { length: 5 }).notNull().default('ar'),
    emailVerified: boolean('email_verified').notNull().default(false),
    phoneVerified: boolean('phone_verified').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('customers_email_idx').on(table.email)],
);

export const customerAddresses = pgTable(
  'customer_addresses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 50 }),
    firstName: varchar('first_name', { length: 50 }).notNull(),
    lastName: varchar('last_name', { length: 50 }).notNull(),
    phone: varchar('phone', { length: 15 }).notNull(),
    wilayaCode: varchar('wilaya_code', { length: 3 }).notNull(),
    wilayaName: varchar('wilaya_name', { length: 100 }).notNull(),
    communeCode: varchar('commune_code', { length: 6 }).notNull(),
    communeName: varchar('commune_name', { length: 100 }).notNull(),
    address: text('address').notNull(),
    landmark: varchar('landmark', { length: 200 }),
    deliveryType: deliveryTypeEnum('delivery_type').notNull().default('home'),
    stopDeskId: varchar('stop_desk_id', { length: 50 }),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('customer_addresses_customer_id_idx').on(table.customerId)],
);

// =============================================================================
// Geography (Algeria)
// =============================================================================

export const wilayas = pgTable('wilayas', {
  code: varchar('code', { length: 3 }).primaryKey(),
  nameAr: varchar('name_ar', { length: 100 }).notNull(),
  nameFr: varchar('name_fr', { length: 100 }).notNull(),
  nameEn: varchar('name_en', { length: 100 }),
  region: varchar('region', { length: 50 }),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
});

export const communes = pgTable(
  'communes',
  {
    code: varchar('code', { length: 6 }).primaryKey(),
    wilayaCode: varchar('wilaya_code', { length: 3 })
      .notNull()
      .references(() => wilayas.code),
    nameAr: varchar('name_ar', { length: 100 }).notNull(),
    nameFr: varchar('name_fr', { length: 100 }).notNull(),
    nameEn: varchar('name_en', { length: 100 }),
    postalCode: varchar('postal_code', { length: 10 }),
    dairaAr: varchar('daira_ar', { length: 100 }),
    dairaFr: varchar('daira_fr', { length: 100 }),
    latitude: decimal('latitude', { precision: 10, scale: 7 }),
    longitude: decimal('longitude', { precision: 10, scale: 7 }),
  },
  (table) => [index('communes_wilaya_code_idx').on(table.wilayaCode)],
);

// =============================================================================
// Catalog
// =============================================================================

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: varchar('slug', { length: 200 }).notNull().unique(),
    parentId: uuid('parent_id'),
    sortOrder: integer('sort_order').notNull().default(0),
    imageUrl: varchar('image_url', { length: 500 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('categories_parent_id_idx').on(table.parentId)],
);

export const categoryTranslations = pgTable(
  'category_translations',
  {
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    locale: varchar('locale', { length: 5 }).notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    metaTitle: varchar('meta_title', { length: 200 }),
    metaDescription: text('meta_description'),
  },
  (table) => [primaryKey({ columns: [table.categoryId, table.locale] })],
);

export const brands = pgTable('brands', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  logoUrl: varchar('logo_url', { length: 500 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const suppliers = pgTable(
  'suppliers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 200 }).notNull().unique(),
    type: supplierTypeEnum('type').notNull().default('local'),
    contactName: varchar('contact_name', { length: 100 }),
    contactPhone: varchar('contact_phone', { length: 15 }),
    contactEmail: varchar('contact_email', { length: 255 }),
    address: text('address'),
    wilayaCode: varchar('wilaya_code', { length: 3 }),
    isActive: boolean('is_active').notNull().default(true),
    leadTimeDays: integer('lead_time_days').default(3),
    notes: text('notes'),
    defaultMarginPercent: decimal('default_margin_percent', { precision: 5, scale: 2 }),
    /** Extensible metadata for international suppliers (country, customs, lead time) */
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('suppliers_type_idx').on(table.type)],
);

export const products = pgTable(
  'products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sku: varchar('sku', { length: 100 }).notNull().unique(),
    slug: varchar('slug', { length: 300 }).notNull().unique(),
    status: productStatusEnum('status').notNull().default('draft'),
    categoryId: uuid('category_id').references(() => categories.id),
    brandId: uuid('brand_id').references(() => brands.id),
    supplierId: uuid('supplier_id').references(() => suppliers.id),
    price: decimal('price', { precision: 12, scale: 2 }).notNull(),
    compareAtPrice: decimal('compare_at_price', { precision: 12, scale: 2 }),
    costPrice: decimal('cost_price', { precision: 12, scale: 2 }),
    weightKg: decimal('weight_kg', { precision: 8, scale: 3 }).notNull().default('0.5'),
    isFeatured: boolean('is_featured').notNull().default(false),
    trackInventory: boolean('track_inventory').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('products_category_id_idx').on(table.categoryId),
    index('products_brand_id_idx').on(table.brandId),
    index('products_supplier_id_idx').on(table.supplierId),
    index('products_status_idx').on(table.status),
  ],
);

export const productTranslations = pgTable(
  'product_translations',
  {
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    locale: varchar('locale', { length: 5 }).notNull(),
    name: varchar('name', { length: 300 }).notNull(),
    description: text('description'),
    shortDescription: varchar('short_description', { length: 500 }),
    metaTitle: varchar('meta_title', { length: 200 }),
    metaDescription: text('meta_description'),
  },
  (table) => [primaryKey({ columns: [table.productId, table.locale] })],
);

export const productVariants = pgTable(
  'product_variants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sku: varchar('sku', { length: 100 }).notNull().unique(),
    name: varchar('name', { length: 200 }).notNull(),
    price: decimal('price', { precision: 12, scale: 2 }),
    compareAtPrice: decimal('compare_at_price', { precision: 12, scale: 2 }),
    attributes: jsonb('attributes').$type<Record<string, string>>().default({}),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('product_variants_product_id_idx').on(table.productId)],
);

export const productImages = pgTable(
  'product_images',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    url: varchar('url', { length: 500 }).notNull(),
    altText: varchar('alt_text', { length: 200 }),
    sortOrder: integer('sort_order').notNull().default(0),
    isPrimary: boolean('is_primary').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('product_images_product_id_idx').on(table.productId)],
);

export const inventory = pgTable(
  'inventory',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(0),
    reservedQuantity: integer('reserved_quantity').notNull().default(0),
    lowStockThreshold: integer('low_stock_threshold').notNull().default(5),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('inventory_product_variant_idx').on(table.productId, table.variantId),
    index('inventory_product_id_idx').on(table.productId),
  ],
);

// =============================================================================
// Cart & Orders
// =============================================================================

export const carts = pgTable(
  'carts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    sessionToken: varchar('session_token', { length: 255 }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('carts_customer_id_idx').on(table.customerId),
    index('carts_session_token_idx').on(table.sessionToken),
  ],
);

export const cartItems = pgTable(
  'cart_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    cartId: uuid('cart_id')
      .notNull()
      .references(() => carts.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    variantId: uuid('variant_id').references(() => productVariants.id),
    quantity: integer('quantity').notNull().default(1),
    unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('cart_items_cart_id_idx').on(table.cartId)],
);

export const coupons = pgTable('coupons', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: text('description'),
  discountType: varchar('discount_type', { length: 20 }).notNull(), // 'percentage' | 'fixed'
  discountValue: decimal('discount_value', { precision: 12, scale: 2 }).notNull(),
  minOrderAmount: decimal('min_order_amount', { precision: 12, scale: 2 }),
  maxUses: integer('max_uses'),
  usedCount: integer('used_count').notNull().default(0),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderNumber: varchar('order_number', { length: 20 }).notNull().unique(),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    status: orderStatusEnum('status').notNull().default('pending'),
    paymentMethod: paymentMethodEnum('payment_method').notNull().default('cod'),
    paymentStatus: paymentStatusEnum('payment_status').notNull().default('pending'),
    subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
    shippingCost: decimal('shipping_cost', { precision: 12, scale: 2 }).notNull().default('0'),
    discountAmount: decimal('discount_amount', { precision: 12, scale: 2 }).notNull().default('0'),
    total: decimal('total', { precision: 12, scale: 2 }).notNull(),
    couponId: uuid('coupon_id').references(() => coupons.id),
    couponCode: varchar('coupon_code', { length: 50 }),
    customerNotes: text('customer_notes'),
    internalNotes: text('internal_notes'),
    locale: varchar('locale', { length: 5 }).notNull().default('ar'),
    // Shipping address snapshot
    shippingFirstName: varchar('shipping_first_name', { length: 50 }).notNull(),
    shippingLastName: varchar('shipping_last_name', { length: 50 }).notNull(),
    shippingPhone: varchar('shipping_phone', { length: 15 }).notNull(),
    shippingWilayaCode: varchar('shipping_wilaya_code', { length: 3 }).notNull(),
    shippingWilayaName: varchar('shipping_wilaya_name', { length: 100 }).notNull(),
    shippingCommuneCode: varchar('shipping_commune_code', { length: 6 }).notNull(),
    shippingCommuneName: varchar('shipping_commune_name', { length: 100 }).notNull(),
    shippingAddress: text('shipping_address').notNull(),
    shippingLandmark: varchar('shipping_landmark', { length: 200 }),
    shippingDeliveryType: deliveryTypeEnum('shipping_delivery_type').notNull().default('home'),
    shippingStopDeskId: varchar('shipping_stop_desk_id', { length: 50 }),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    shippedAt: timestamp('shipped_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    assignedOperatorId: uuid('assigned_operator_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    deliveryEstimateDays: integer('delivery_estimate_days'),
    deliveryEstimateText: varchar('delivery_estimate_text', { length: 200 }),
    idempotencyKey: varchar('idempotency_key', { length: 64 }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('orders_customer_id_idx').on(table.customerId),
    index('orders_status_idx').on(table.status),
    index('orders_created_at_idx').on(table.createdAt),
    index('orders_order_number_idx').on(table.orderNumber),
    index('orders_assigned_operator_id_idx').on(table.assignedOperatorId),
    index('orders_shipping_phone_idx').on(table.shippingPhone),
    uniqueIndex('orders_idempotency_key_idx').on(table.idempotencyKey),
    index('orders_status_created_at_idx').on(table.status, table.createdAt),
  ],
);

export const orderNumberSequences = pgTable('order_number_sequences', {
  dateKey: varchar('date_key', { length: 8 }).primaryKey(),
  lastValue: integer('last_value').notNull().default(0),
});

export const inventoryMovements = pgTable(
  'inventory_movements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
    movementType: varchar('movement_type', { length: 30 }).notNull(),
    quantityChange: integer('quantity_change').notNull(),
    quantityBefore: integer('quantity_before').notNull(),
    quantityAfter: integer('quantity_after').notNull(),
    referenceType: varchar('reference_type', { length: 30 }),
    referenceId: uuid('reference_id'),
    note: text('note'),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('inventory_movements_product_idx').on(table.productId),
    index('inventory_movements_created_at_idx').on(table.createdAt),
  ],
);

export const fulfillmentTasks = pgTable(
  'fulfillment_tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    stage: fulfillmentStageEnum('stage').notNull(),
    status: fulfillmentStatusEnum('status').notNull().default('pending'),
    assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
    barcode: varchar('barcode', { length: 50 }),
    qrCodeData: text('qr_code_data'),
    note: text('note'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    completedBy: uuid('completed_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('fulfillment_tasks_order_stage_idx').on(table.orderId, table.stage),
    index('fulfillment_tasks_order_id_idx').on(table.orderId),
  ],
);

export const customerNotes = pgTable(
  'customer_notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
    phone: varchar('phone', { length: 15 }),
    note: text('note').notNull(),
    authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('customer_notes_customer_idx').on(table.customerId),
    index('customer_notes_phone_idx').on(table.phone),
  ],
);

export const customerTags = pgTable(
  'customer_tags',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
    phone: varchar('phone', { length: 15 }),
    tag: varchar('tag', { length: 50 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('customer_tags_customer_idx').on(table.customerId),
    index('customer_tags_tag_idx').on(table.tag),
  ],
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    variantId: uuid('variant_id').references(() => productVariants.id),
    supplierId: uuid('supplier_id').references(() => suppliers.id),
    sku: varchar('sku', { length: 100 }).notNull(),
    name: varchar('name', { length: 300 }).notNull(),
    variantName: varchar('variant_name', { length: 200 }),
    quantity: integer('quantity').notNull(),
    unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
    totalPrice: decimal('total_price', { precision: 12, scale: 2 }).notNull(),
    costPrice: decimal('cost_price', { precision: 12, scale: 2 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('order_items_order_id_idx').on(table.orderId)],
);

export const orderStatusHistory = pgTable(
  'order_status_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    fromStatus: orderStatusEnum('from_status'),
    toStatus: orderStatusEnum('to_status').notNull(),
    note: text('note'),
    actorId: uuid('actor_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('order_status_history_order_id_idx').on(table.orderId)],
);

export const orderConfirmations = pgTable(
  'order_confirmations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => users.id),
    method: confirmationMethodEnum('method').notNull(),
    outcome: confirmationOutcomeEnum('outcome').notNull(),
    notes: text('notes'),
    attemptedAt: timestamp('attempted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('order_confirmations_order_id_idx').on(table.orderId)],
);

// =============================================================================
// Shipping
// =============================================================================

export const carrierConfigs = pgTable(
  'carrier_configs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    carrier: carrierSlugEnum('carrier').notNull().unique(),
    displayName: varchar('display_name', { length: 100 }).notNull(),
    isEnabled: boolean('is_enabled').notNull().default(false),
    isDefault: boolean('is_default').notNull().default(false),
    credentials: jsonb('credentials').$type<Record<string, string>>().default({}),
    settings: jsonb('settings').$type<Record<string, unknown>>().default({}),
    originWilayaCode: varchar('origin_wilaya_code', { length: 3 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
);

export const shipments = pgTable(
  'shipments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    carrier: carrierSlugEnum('carrier').notNull(),
    trackingNumber: varchar('tracking_number', { length: 100 }),
    carrierParcelId: varchar('carrier_parcel_id', { length: 100 }),
    status: shipmentStatusEnum('status').notNull().default('created'),
    labelUrl: varchar('label_url', { length: 500 }),
    codAmount: decimal('cod_amount', { precision: 12, scale: 2 }).notNull(),
    shippingCost: decimal('shipping_cost', { precision: 12, scale: 2 }),
    weightKg: decimal('weight_kg', { precision: 8, scale: 3 }),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    shippedAt: timestamp('shipped_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('shipments_order_id_idx').on(table.orderId),
    index('shipments_tracking_number_idx').on(table.trackingNumber),
    index('shipments_status_idx').on(table.status),
  ],
);

export const shipmentEvents = pgTable(
  'shipment_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    shipmentId: uuid('shipment_id')
      .notNull()
      .references(() => shipments.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 50 }).notNull(),
    statusLabel: varchar('status_label', { length: 200 }),
    location: varchar('location', { length: 200 }),
    rawPayload: jsonb('raw_payload').$type<Record<string, unknown>>(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('shipment_events_shipment_id_idx').on(table.shipmentId)],
);

// =============================================================================
// Payments
// =============================================================================

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    method: paymentMethodEnum('method').notNull(),
    status: paymentStatusEnum('status').notNull().default('pending'),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('DZD'),
    gatewayProvider: varchar('gateway_provider', { length: 50 }),
    gatewayTransactionId: varchar('gateway_transaction_id', { length: 255 }),
    gatewayResponse: jsonb('gateway_response').$type<Record<string, unknown>>(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('payments_order_id_idx').on(table.orderId)],
);

export const codReconciliations = pgTable(
  'cod_reconciliations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    shipmentId: uuid('shipment_id')
      .notNull()
      .references(() => shipments.id),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id),
    carrier: carrierSlugEnum('carrier').notNull(),
    expectedAmount: decimal('expected_amount', { precision: 12, scale: 2 }).notNull(),
    receivedAmount: decimal('received_amount', { precision: 12, scale: 2 }),
    commission: decimal('commission', { precision: 12, scale: 2 }),
    status: varchar('status', { length: 20 }).notNull().default('pending'), // pending | received | disputed
    remittedAt: timestamp('remitted_at', { withTimezone: true }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('cod_reconciliations_order_id_idx').on(table.orderId)],
);

// =============================================================================
// Reviews & Wishlists
// =============================================================================

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id').references(() => orders.id),
    rating: integer('rating').notNull(),
    title: varchar('title', { length: 200 }),
    body: text('body'),
    isApproved: boolean('is_approved').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('reviews_product_id_idx').on(table.productId),
    uniqueIndex('reviews_customer_product_idx').on(table.customerId, table.productId),
  ],
);

export const wishlists = pgTable(
  'wishlists',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('wishlists_customer_product_idx').on(table.customerId, table.productId),
    index('wishlists_customer_id_idx').on(table.customerId),
  ],
);

export const recentlyViewed = pgTable(
  'recently_viewed',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionToken: varchar('session_token', { length: 255 }),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    viewedAt: timestamp('viewed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('recently_viewed_session_idx').on(table.sessionToken),
    index('recently_viewed_customer_idx').on(table.customerId),
    index('recently_viewed_viewed_at_idx').on(table.viewedAt),
  ],
);

export const newsletterSubscribers = pgTable(
  'newsletter_subscribers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    locale: varchar('locale', { length: 5 }).notNull().default('ar'),
    source: varchar('source', { length: 50 }).notNull().default('homepage'),
    isActive: boolean('is_active').notNull().default(true),
    subscribedAt: timestamp('subscribed_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('newsletter_subscribers_email_idx').on(table.email)],
);

export const notificationTemplates = pgTable('notification_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 80 }).notNull().unique(),
  channel: varchar('channel', { length: 20 }).notNull(),
  name: varchar('name', { length: 120 }).notNull(),
  subject: varchar('subject', { length: 255 }),
  body: text('body').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const notificationLogs = pgTable(
  'notification_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
    channel: varchar('channel', { length: 20 }).notNull(),
    templateSlug: varchar('template_slug', { length: 80 }),
    recipient: varchar('recipient', { length: 255 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    errorMessage: text('error_message'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('notification_logs_order_id_idx').on(table.orderId)],
);

// =============================================================================
// Store Settings & Feature Flags
// =============================================================================

export const storeSettings = pgTable('store_settings', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id),
});

export const featureFlags = pgTable('feature_flags', {
  key: varchar('key', { length: 100 }).primaryKey(),
  enabled: boolean('enabled').notNull().default(false),
  description: text('description'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// Audit Logs
// =============================================================================

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id),
    action: auditActionEnum('action').notNull(),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: varchar('entity_id', { length: 100 }),
    changes: jsonb('changes').$type<Record<string, unknown>>(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    requestId: varchar('request_id', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('audit_logs_user_id_idx').on(table.userId),
    index('audit_logs_entity_idx').on(table.entityType, table.entityId),
    index('audit_logs_created_at_idx').on(table.createdAt),
  ],
);

// =============================================================================
// Relations
// =============================================================================

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  addresses: many(customerAddresses),
  orders: many(orders),
  reviews: many(reviews),
  wishlists: many(wishlists),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, { fields: [categories.parentId], references: [categories.id] }),
  translations: many(categoryTranslations),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  brand: one(brands, { fields: [products.brandId], references: [brands.id] }),
  supplier: one(suppliers, { fields: [products.supplierId], references: [suppliers.id] }),
  translations: many(productTranslations),
  variants: many(productVariants),
  images: many(productImages),
  inventory: many(inventory),
  reviews: many(reviews),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
  confirmations: many(orderConfirmations),
  shipments: many(shipments),
  payments: many(payments),
}));

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  order: one(orders, { fields: [shipments.orderId], references: [orders.id] }),
  events: many(shipmentEvents),
}));

export const wilayasRelations = relations(wilayas, ({ many }) => ({
  communes: many(communes),
}));

export const communesRelations = relations(communes, ({ one }) => ({
  wilaya: one(wilayas, { fields: [communes.wilayaCode], references: [wilayas.code] }),
}));
