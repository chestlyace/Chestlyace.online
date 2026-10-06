-- Same updated_at trigger as every other table (see 0001).
CREATE TRIGGER certifications_set_updated_at BEFORE UPDATE ON "certifications" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
