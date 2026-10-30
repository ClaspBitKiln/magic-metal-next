import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_media_role" AS ENUM('hero', 'product-photo', 'technical-drawing', 'material', 'application', 'logistics', 'infographic');
  CREATE TYPE "public"."enum_media_rights" AS ENUM('owned', 'partner-approved', 'licensed', 'generated');
  CREATE TYPE "public"."enum_products_origin_options" AS ENUM('russia', 'cis', 'china', 'other');
  CREATE TYPE "public"."enum_products_group" AS ENUM('electrowelded-pipes', 'seamless-pipes', 'pipeline-parts', 'insulated', 'sheet', 'sections', 'forgings', 'special-steel', 'non-ferrous', 'consumables', 'equipment');
  CREATE TYPE "public"."enum_requests_product_direction" AS ENUM('electrowelded-pipes', 'seamless-pipes', 'pipeline-parts', 'insulated', 'other');
  CREATE TYPE "public"."enum_requests_origin_preference" AS ENUM('any', 'russia-cis', 'china', 'other');
  CREATE TYPE "public"."enum_requests_status" AS ENUM('new', 'in-progress', 'quoted', 'closed');
  CREATE TYPE "public"."enum_deal_results_result" AS ENUM('won', 'lost', 'cancelled');
  CREATE TYPE "public"."enum_deal_results_currency" AS ENUM('RUB', 'USD', 'EUR', 'UZS', 'KZT', 'CNY');
  CREATE TYPE "public"."enum_supplier_sources_source_type" AS ENUM('price-file', 'public-catalog', 'marketplace', 'api');
  CREATE TYPE "public"."enum_supplier_sources_last_import_status" AS ENUM('pending', 'success', 'partial', 'error');
  CREATE TYPE "public"."enum_supplier_offers_currency" AS ENUM('RUB', 'USD', 'EUR', 'UZS', 'KZT', 'CNY');
  CREATE TYPE "public"."enum_supplier_offers_availability" AS ENUM('price-confirmed', 'market-listed', 'on-request', 'inactive');
  CREATE TYPE "public"."enum_logistics_benchmarks_mode" AS ENUM('road', 'rail', 'sea', 'multimodal');
  CREATE TYPE "public"."enum_logistics_benchmarks_evidence_level" AS ENUM('observed', 'verified');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"role" "enum_media_role" DEFAULT 'product-photo' NOT NULL,
  	"rights" "enum_media_rights" DEFAULT 'owned' NOT NULL,
  	"credit" varchar,
  	"source_url" varchar,
  	"technical_verified" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar
  );
  
  CREATE TABLE "products_origin_options" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_products_origin_options",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "products" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"group" "enum_products_group" NOT NULL,
  	"summary" varchar NOT NULL,
  	"hero_image_id" integer,
  	"technical_drawing_id" integer,
  	"dimensions" varchar,
  	"standards" varchar,
  	"steel_grades" varchar,
  	"priority" numeric DEFAULT 100 NOT NULL,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "products_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "request_files" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"company" varchar,
  	"phone" varchar NOT NULL,
  	"email" varchar,
  	"message" varchar NOT NULL,
  	"context" varchar,
  	"product_direction" "enum_requests_product_direction",
  	"origin_preference" "enum_requests_origin_preference" DEFAULT 'any',
  	"status" "enum_requests_status" DEFAULT 'new' NOT NULL,
  	"source" varchar,
  	"landing_page" varchar,
  	"referrer" varchar,
  	"utm_source" varchar,
  	"utm_medium" varchar,
  	"utm_campaign" varchar,
  	"email_delivered" boolean DEFAULT false,
  	"crm_delivered" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "requests_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"request_files_id" integer
  );
  
  CREATE TABLE "deal_results" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"request_id" integer NOT NULL,
  	"result" "enum_deal_results_result" NOT NULL,
  	"loss_reason" varchar,
  	"quote_total" numeric,
  	"actual_selling_total" numeric,
  	"currency" "enum_deal_results_currency" DEFAULT 'RUB',
  	"actual_purchase_cost" numeric,
  	"actual_logistics_cost" numeric,
  	"actual_landed_cost" numeric,
  	"actual_gross_profit" numeric,
  	"actual_lead_time_days" numeric,
  	"delivery_successful" boolean,
  	"reclamation" boolean,
  	"reclamation_note" varchar,
  	"actual_procurement_route" varchar,
  	"actual_supplier" varchar,
  	"recorded_at" timestamp(3) with time zone NOT NULL,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "supplier_sources" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"code" varchar NOT NULL,
  	"website" varchar NOT NULL,
  	"city" varchar,
  	"country" varchar,
  	"source_type" "enum_supplier_sources_source_type" NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"public_visible" boolean DEFAULT false,
  	"last_checked_at" timestamp(3) with time zone,
  	"last_import_status" "enum_supplier_sources_last_import_status" DEFAULT 'pending',
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "supplier_offers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"supplier_id" integer NOT NULL,
  	"external_key" varchar NOT NULL,
  	"category" varchar,
  	"product" varchar NOT NULL,
  	"product_key" varchar,
  	"designation" varchar,
  	"designation_key" varchar,
  	"size" varchar NOT NULL,
  	"diameter" varchar,
  	"diameter_key" varchar,
  	"wall" varchar,
  	"wall_key" varchar,
  	"thickness_key" varchar,
  	"length_key" varchar,
  	"product_identity_key" varchar,
  	"standard" varchar,
  	"standard_key" varchar,
  	"price" numeric,
  	"currency" "enum_supplier_offers_currency" DEFAULT 'RUB',
  	"unit" varchar,
  	"availability" "enum_supplier_offers_availability" NOT NULL,
  	"source_url" varchar,
  	"observed_at" timestamp(3) with time zone NOT NULL,
  	"raw" jsonb,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "logistics_benchmarks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"route_id" varchar NOT NULL,
  	"origin" varchar NOT NULL,
  	"destination" varchar NOT NULL,
  	"mode" "enum_logistics_benchmarks_mode" NOT NULL,
  	"date_from" timestamp(3) with time zone NOT NULL,
  	"date_to" timestamp(3) with time zone,
  	"average_price_rub" numeric NOT NULL,
  	"lower_price_rub" numeric,
  	"upper_price_rub" numeric,
  	"average_price_per_km" numeric,
  	"distance_km" numeric,
  	"loads_count" numeric,
  	"tonnage" numeric,
  	"car_type" varchar,
  	"with_nds" boolean DEFAULT false,
  	"source" varchar NOT NULL,
  	"evidence_level" "enum_logistics_benchmarks_evidence_level" NOT NULL,
  	"observed_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"products_id" integer,
  	"request_files_id" integer,
  	"requests_id" integer,
  	"deal_results_id" integer,
  	"supplier_sources_id" integer,
  	"supplier_offers_id" integer,
  	"logistics_benchmarks_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"company_name" varchar DEFAULT 'Мэджик Металл' NOT NULL,
  	"phone" varchar DEFAULT '+7 922 711-73-63' NOT NULL,
  	"email" varchar DEFAULT 'm1@magicmet.ru' NOT NULL,
  	"hero_eyebrow" varchar DEFAULT 'Поставка металла под требования проекта',
  	"hero_title" varchar DEFAULT 'Металл для сложных промышленных задач',
  	"hero_text" varchar DEFAULT 'Находим редкие и нестандартные позиции, сверяем ГОСТ, ТУ и документы, комплектуем и доставляем металл по России и СНГ.',
  	"yandex_metrika_id" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_origin_options" ADD CONSTRAINT "products_origin_options_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_technical_drawing_id_media_id_fk" FOREIGN KEY ("technical_drawing_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "requests_rels" ADD CONSTRAINT "requests_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "requests_rels" ADD CONSTRAINT "requests_rels_request_files_fk" FOREIGN KEY ("request_files_id") REFERENCES "public"."request_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "deal_results" ADD CONSTRAINT "deal_results_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "supplier_offers" ADD CONSTRAINT "supplier_offers_supplier_id_supplier_sources_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier_sources"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_request_files_fk" FOREIGN KEY ("request_files_id") REFERENCES "public"."request_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_requests_fk" FOREIGN KEY ("requests_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_deal_results_fk" FOREIGN KEY ("deal_results_id") REFERENCES "public"."deal_results"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_supplier_sources_fk" FOREIGN KEY ("supplier_sources_id") REFERENCES "public"."supplier_sources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_supplier_offers_fk" FOREIGN KEY ("supplier_offers_id") REFERENCES "public"."supplier_offers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_logistics_benchmarks_fk" FOREIGN KEY ("logistics_benchmarks_id") REFERENCES "public"."logistics_benchmarks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_role_idx" ON "media" USING btree ("role");
  CREATE INDEX "media_rights_idx" ON "media" USING btree ("rights");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE INDEX "products_origin_options_order_idx" ON "products_origin_options" USING btree ("order");
  CREATE INDEX "products_origin_options_parent_idx" ON "products_origin_options" USING btree ("parent_id");
  CREATE INDEX "products_title_idx" ON "products" USING btree ("title");
  CREATE UNIQUE INDEX "products_slug_idx" ON "products" USING btree ("slug");
  CREATE INDEX "products_group_idx" ON "products" USING btree ("group");
  CREATE INDEX "products_hero_image_idx" ON "products" USING btree ("hero_image_id");
  CREATE INDEX "products_technical_drawing_idx" ON "products" USING btree ("technical_drawing_id");
  CREATE INDEX "products_priority_idx" ON "products" USING btree ("priority");
  CREATE INDEX "products_active_idx" ON "products" USING btree ("active");
  CREATE INDEX "products_updated_at_idx" ON "products" USING btree ("updated_at");
  CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");
  CREATE INDEX "products_rels_order_idx" ON "products_rels" USING btree ("order");
  CREATE INDEX "products_rels_parent_idx" ON "products_rels" USING btree ("parent_id");
  CREATE INDEX "products_rels_path_idx" ON "products_rels" USING btree ("path");
  CREATE INDEX "products_rels_media_id_idx" ON "products_rels" USING btree ("media_id");
  CREATE INDEX "request_files_updated_at_idx" ON "request_files" USING btree ("updated_at");
  CREATE INDEX "request_files_created_at_idx" ON "request_files" USING btree ("created_at");
  CREATE UNIQUE INDEX "request_files_filename_idx" ON "request_files" USING btree ("filename");
  CREATE INDEX "requests_phone_idx" ON "requests" USING btree ("phone");
  CREATE INDEX "requests_context_idx" ON "requests" USING btree ("context");
  CREATE INDEX "requests_status_idx" ON "requests" USING btree ("status");
  CREATE INDEX "requests_source_idx" ON "requests" USING btree ("source");
  CREATE INDEX "requests_updated_at_idx" ON "requests" USING btree ("updated_at");
  CREATE INDEX "requests_created_at_idx" ON "requests" USING btree ("created_at");
  CREATE INDEX "requests_rels_order_idx" ON "requests_rels" USING btree ("order");
  CREATE INDEX "requests_rels_parent_idx" ON "requests_rels" USING btree ("parent_id");
  CREATE INDEX "requests_rels_path_idx" ON "requests_rels" USING btree ("path");
  CREATE INDEX "requests_rels_request_files_id_idx" ON "requests_rels" USING btree ("request_files_id");
  CREATE UNIQUE INDEX "deal_results_request_idx" ON "deal_results" USING btree ("request_id");
  CREATE INDEX "deal_results_result_idx" ON "deal_results" USING btree ("result");
  CREATE INDEX "deal_results_recorded_at_idx" ON "deal_results" USING btree ("recorded_at");
  CREATE INDEX "deal_results_updated_at_idx" ON "deal_results" USING btree ("updated_at");
  CREATE INDEX "deal_results_created_at_idx" ON "deal_results" USING btree ("created_at");
  CREATE INDEX "supplier_sources_name_idx" ON "supplier_sources" USING btree ("name");
  CREATE UNIQUE INDEX "supplier_sources_code_idx" ON "supplier_sources" USING btree ("code");
  CREATE INDEX "supplier_sources_city_idx" ON "supplier_sources" USING btree ("city");
  CREATE INDEX "supplier_sources_country_idx" ON "supplier_sources" USING btree ("country");
  CREATE INDEX "supplier_sources_source_type_idx" ON "supplier_sources" USING btree ("source_type");
  CREATE INDEX "supplier_sources_enabled_idx" ON "supplier_sources" USING btree ("enabled");
  CREATE INDEX "supplier_sources_last_checked_at_idx" ON "supplier_sources" USING btree ("last_checked_at");
  CREATE INDEX "supplier_sources_last_import_status_idx" ON "supplier_sources" USING btree ("last_import_status");
  CREATE INDEX "supplier_sources_updated_at_idx" ON "supplier_sources" USING btree ("updated_at");
  CREATE INDEX "supplier_sources_created_at_idx" ON "supplier_sources" USING btree ("created_at");
  CREATE INDEX "supplier_offers_supplier_idx" ON "supplier_offers" USING btree ("supplier_id");
  CREATE UNIQUE INDEX "supplier_offers_external_key_idx" ON "supplier_offers" USING btree ("external_key");
  CREATE INDEX "supplier_offers_category_idx" ON "supplier_offers" USING btree ("category");
  CREATE INDEX "supplier_offers_product_idx" ON "supplier_offers" USING btree ("product");
  CREATE INDEX "supplier_offers_product_key_idx" ON "supplier_offers" USING btree ("product_key");
  CREATE INDEX "supplier_offers_designation_idx" ON "supplier_offers" USING btree ("designation");
  CREATE INDEX "supplier_offers_designation_key_idx" ON "supplier_offers" USING btree ("designation_key");
  CREATE INDEX "supplier_offers_size_idx" ON "supplier_offers" USING btree ("size");
  CREATE INDEX "supplier_offers_diameter_idx" ON "supplier_offers" USING btree ("diameter");
  CREATE INDEX "supplier_offers_diameter_key_idx" ON "supplier_offers" USING btree ("diameter_key");
  CREATE INDEX "supplier_offers_wall_idx" ON "supplier_offers" USING btree ("wall");
  CREATE INDEX "supplier_offers_wall_key_idx" ON "supplier_offers" USING btree ("wall_key");
  CREATE INDEX "supplier_offers_thickness_key_idx" ON "supplier_offers" USING btree ("thickness_key");
  CREATE INDEX "supplier_offers_length_key_idx" ON "supplier_offers" USING btree ("length_key");
  CREATE INDEX "supplier_offers_product_identity_key_idx" ON "supplier_offers" USING btree ("product_identity_key");
  CREATE INDEX "supplier_offers_standard_idx" ON "supplier_offers" USING btree ("standard");
  CREATE INDEX "supplier_offers_standard_key_idx" ON "supplier_offers" USING btree ("standard_key");
  CREATE INDEX "supplier_offers_availability_idx" ON "supplier_offers" USING btree ("availability");
  CREATE INDEX "supplier_offers_observed_at_idx" ON "supplier_offers" USING btree ("observed_at");
  CREATE INDEX "supplier_offers_active_idx" ON "supplier_offers" USING btree ("active");
  CREATE INDEX "supplier_offers_updated_at_idx" ON "supplier_offers" USING btree ("updated_at");
  CREATE INDEX "supplier_offers_created_at_idx" ON "supplier_offers" USING btree ("created_at");
  CREATE INDEX "logistics_benchmarks_route_id_idx" ON "logistics_benchmarks" USING btree ("route_id");
  CREATE INDEX "logistics_benchmarks_origin_idx" ON "logistics_benchmarks" USING btree ("origin");
  CREATE INDEX "logistics_benchmarks_destination_idx" ON "logistics_benchmarks" USING btree ("destination");
  CREATE INDEX "logistics_benchmarks_date_from_idx" ON "logistics_benchmarks" USING btree ("date_from");
  CREATE INDEX "logistics_benchmarks_source_idx" ON "logistics_benchmarks" USING btree ("source");
  CREATE INDEX "logistics_benchmarks_observed_at_idx" ON "logistics_benchmarks" USING btree ("observed_at");
  CREATE INDEX "logistics_benchmarks_updated_at_idx" ON "logistics_benchmarks" USING btree ("updated_at");
  CREATE INDEX "logistics_benchmarks_created_at_idx" ON "logistics_benchmarks" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_products_id_idx" ON "payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_request_files_id_idx" ON "payload_locked_documents_rels" USING btree ("request_files_id");
  CREATE INDEX "payload_locked_documents_rels_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("requests_id");
  CREATE INDEX "payload_locked_documents_rels_deal_results_id_idx" ON "payload_locked_documents_rels" USING btree ("deal_results_id");
  CREATE INDEX "payload_locked_documents_rels_supplier_sources_id_idx" ON "payload_locked_documents_rels" USING btree ("supplier_sources_id");
  CREATE INDEX "payload_locked_documents_rels_supplier_offers_id_idx" ON "payload_locked_documents_rels" USING btree ("supplier_offers_id");
  CREATE INDEX "payload_locked_documents_rels_logistics_benchmarks_id_idx" ON "payload_locked_documents_rels" USING btree ("logistics_benchmarks_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "products_origin_options" CASCADE;
  DROP TABLE "products" CASCADE;
  DROP TABLE "products_rels" CASCADE;
  DROP TABLE "request_files" CASCADE;
  DROP TABLE "requests" CASCADE;
  DROP TABLE "requests_rels" CASCADE;
  DROP TABLE "deal_results" CASCADE;
  DROP TABLE "supplier_sources" CASCADE;
  DROP TABLE "supplier_offers" CASCADE;
  DROP TABLE "logistics_benchmarks" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TYPE "public"."enum_media_role";
  DROP TYPE "public"."enum_media_rights";
  DROP TYPE "public"."enum_products_origin_options";
  DROP TYPE "public"."enum_products_group";
  DROP TYPE "public"."enum_requests_product_direction";
  DROP TYPE "public"."enum_requests_origin_preference";
  DROP TYPE "public"."enum_requests_status";
  DROP TYPE "public"."enum_deal_results_result";
  DROP TYPE "public"."enum_deal_results_currency";
  DROP TYPE "public"."enum_supplier_sources_source_type";
  DROP TYPE "public"."enum_supplier_sources_last_import_status";
  DROP TYPE "public"."enum_supplier_offers_currency";
  DROP TYPE "public"."enum_supplier_offers_availability";
  DROP TYPE "public"."enum_logistics_benchmarks_mode";
  DROP TYPE "public"."enum_logistics_benchmarks_evidence_level";`)
}
