-- Keep updated_at current on every UPDATE, including edits made outside the app.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER faqs_set_updated_at BEFORE UPDATE ON "faqs" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER journey_set_updated_at BEFORE UPDATE ON "journey" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER profile_set_updated_at BEFORE UPDATE ON "profile" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER projects_set_updated_at BEFORE UPDATE ON "projects" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER services_set_updated_at BEFORE UPDATE ON "services" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER skills_set_updated_at BEFORE UPDATE ON "skills" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER socials_set_updated_at BEFORE UPDATE ON "socials" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER volunteering_set_updated_at BEFORE UPDATE ON "volunteering" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
