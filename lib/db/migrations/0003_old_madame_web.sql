CREATE TABLE "dashboard_grid_items" (
	"item_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"layout_id" uuid NOT NULL,
	"item_key" varchar(255) NOT NULL,
	"x" integer NOT NULL,
	"y" integer NOT NULL,
	"w" integer NOT NULL,
	"h" integer NOT NULL,
	"static" boolean DEFAULT false NOT NULL,
	"item_type" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard_layouts" (
	"layout_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dashboard_grid_items" ADD CONSTRAINT "dashboard_grid_items_layout_id_dashboard_layouts_layout_id_fk" FOREIGN KEY ("layout_id") REFERENCES "public"."dashboard_layouts"("layout_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_layouts" ADD CONSTRAINT "dashboard_layouts_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dashboard_grid_items_layout_id_idx" ON "dashboard_grid_items" USING btree ("layout_id");--> statement-breakpoint
CREATE INDEX "dashboard_layouts_user_id_idx" ON "dashboard_layouts" USING btree ("user_id");