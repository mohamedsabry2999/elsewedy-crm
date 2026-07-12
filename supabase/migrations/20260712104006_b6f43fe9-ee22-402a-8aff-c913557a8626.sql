
-- Fix roles for the 12 demo users
WITH demo(uid, full_name, role, dept) AS (VALUES
  ('f40de04e-5115-47ec-9b9b-3693a5023ac6'::uuid,'Admin User','super_admin'::app_role,'IT'),
  ('63ac625e-943c-4d21-99d2-7a7634500694','Management User','top_management','Management'),
  ('71b077ac-a133-462c-8f0b-03bb0b6cf705','Sales Manager','sales_manager','Sales'),
  ('66cfd901-9fc9-4d15-b0b4-534c96fe04cc','Maha Elsayed','sales_person','Sales'),
  ('0a885f33-3834-4b0b-9179-063a321cd6a4','Fatma Zahra','sales_person','Sales'),
  ('87119030-4176-4164-bb75-461764686a6e','Youssef Mohamed','sales_person','Sales'),
  ('53344541-ec2f-424d-b8e5-033d03741ce6','Marketing Manager','marketing_manager','Marketing'),
  ('0030382e-dbbd-43de-ad08-3ac4b3e4dae7','Pricing User','pricing_team','Pricing'),
  ('7d3ca1ee-bdfa-4828-8a18-0db96347d88e','Production User','production_planning','Production'),
  ('f59c70a1-21fe-423d-88a8-7f7935d117db','Quality User','quality_control','QC'),
  ('98ae4655-730d-4499-8af7-aedda894ac80','Finance User','finance','Finance'),
  ('bffa98f4-3ba1-4b6d-8428-d5270e4da55f','Customer Service User','customer_service','CS')
)
, del AS (
  DELETE FROM public.user_roles ur USING demo d WHERE ur.user_id = d.uid RETURNING 1
)
INSERT INTO public.user_roles (user_id, role)
SELECT uid, role FROM demo
ON CONFLICT (user_id, role) DO NOTHING;

UPDATE public.profiles p SET full_name = d.full_name, department = d.dept
FROM (VALUES
  ('f40de04e-5115-47ec-9b9b-3693a5023ac6'::uuid,'Admin User','IT'),
  ('63ac625e-943c-4d21-99d2-7a7634500694','Management User','Management'),
  ('71b077ac-a133-462c-8f0b-03bb0b6cf705','Sales Manager','Sales'),
  ('66cfd901-9fc9-4d15-b0b4-534c96fe04cc','Maha Elsayed','Sales'),
  ('0a885f33-3834-4b0b-9179-063a321cd6a4','Fatma Zahra','Sales'),
  ('87119030-4176-4164-bb75-461764686a6e','Youssef Mohamed','Sales'),
  ('53344541-ec2f-424d-b8e5-033d03741ce6','Marketing Manager','Marketing'),
  ('0030382e-dbbd-43de-ad08-3ac4b3e4dae7','Pricing User','Pricing'),
  ('7d3ca1ee-bdfa-4828-8a18-0db96347d88e','Production User','Production'),
  ('f59c70a1-21fe-423d-88a8-7f7935d117db','Quality User','QC'),
  ('98ae4655-730d-4499-8af7-aedda894ac80','Finance User','Finance'),
  ('bffa98f4-3ba1-4b6d-8428-d5270e4da55f','Customer Service User','CS')
) AS d(id, full_name, dept)
WHERE p.id = d.id;
