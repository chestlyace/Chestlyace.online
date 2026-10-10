-- The creatives Services page's starting wording (design.md §14.24), carried over from
-- the old graphic-design.html and photography.html (content-schema.md §6): the service
-- cards and the FAQ. Everything is editable in the admin (Creatives → Services / FAQ).
-- Each insert only runs while its table is empty, so a re-run or an edited site is
-- left alone.
INSERT INTO "creative_services" ("title", "description", "icon", "group_name", "items", "order_index")
SELECT * FROM (VALUES
  ('Brand identity', 'Logos, identity directions, brand graphics and visual consistency for growing businesses and creators.', 'Edit', 'design', ARRAY['Logo and identity support', 'Creative direction across channels'], 1),
  ('Social media and print', 'Social media graphics, posters, flyers, promo banners, launch visuals and event collateral.', 'Image', 'design', ARRAY['Social media graphics', 'Poster, flyer and event announcement design'], 2),
  ('Interface and presentation', 'Interface mockups, presentation slides and support graphics for websites and digital products.', 'Paper', 'design', ARRAY['Presentation and pitch-deck visual support'], 3),
  ('Event photography', 'Coverage for conferences, launches, community events and special programs with consistent visual storytelling.', 'Camera', 'photography', ARRAY['Conferences, communities and launches', 'Photo selection and delivery'], 1),
  ('Portraits', 'Portraits for individuals, teams, creators and personal brands who need expressive and clean imagery.', 'Heart', 'photography', ARRAY['Portrait photography for professionals and personal brands'], 2),
  ('Brand and campaign photos', 'Photo assets for websites, social channels, announcements, recaps and promotional campaigns.', 'Star', 'photography', ARRAY['Creative photography for storytelling and campaigns', 'Visual support for recaps and promotion'], 3)
) AS seed("title", "description", "icon", "group_name", "items", "order_index")
WHERE NOT EXISTS (SELECT 1 FROM "creative_services");
--> statement-breakpoint
INSERT INTO "creative_faqs" ("question", "answer", "group_name", "order_index")
SELECT * FROM (VALUES
  ('Do you design for both print and digital use?', 'Yes. I can prepare assets for digital campaigns and designs intended for print output.', 'design', 1),
  ('Can you create social media graphics for a campaign?', 'Yes. I design campaign-ready graphics tailored for announcements, promotions and audience engagement.', 'design', 2),
  ('Do you work with businesses and personal brands?', 'Yes. I work with both organizations and individuals who need a stronger visual presence.', 'design', 3),
  ('Do you cover events and community programs?', 'Yes. Event coverage is one of the key photography services I provide.', 'photography', 1),
  ('Can the photos be used for websites and social media?', 'Yes. Deliverables can support websites, recaps, social posts and campaign materials.', 'photography', 2),
  ('Do you also support visual storytelling for brands?', 'Yes. I combine photography with design and digital presentation to help brands communicate clearly.', 'photography', 3)
) AS seed("question", "answer", "group_name", "order_index")
WHERE NOT EXISTS (SELECT 1 FROM "creative_faqs");
