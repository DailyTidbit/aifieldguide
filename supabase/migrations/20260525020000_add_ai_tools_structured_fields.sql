ALTER TABLE ai_tools
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS model_type text,
  ADD COLUMN IF NOT EXISTS access_method text,
  ADD COLUMN IF NOT EXISTS pricing_breakdown text,
  ADD COLUMN IF NOT EXISTS commercial_use_policy text,
  ADD COLUMN IF NOT EXISTS training_data text,
  ADD COLUMN IF NOT EXISTS workflow_notes text,
  ADD COLUMN IF NOT EXISTS limitations text,
  ADD COLUMN IF NOT EXISTS use_cases_list text[];

-- Seed Adobe Firefly
UPDATE ai_tools SET
  tagline             = 'Commercial-safe generative AI built into Adobe Creative Cloud',
  model_type          = 'Diffusion-based generative AI tuned for artistic and photographic outputs',
  access_method       = 'Web app at firefly.adobe.com; embedded in Photoshop (Generative Fill), Illustrator, and Adobe Express. Requires an Adobe account. Full feature access requires a Creative Cloud subscription.',
  pricing_breakdown   = 'Free — limited credits with a free Adobe ID, outputs may be watermarked.' || chr(10) ||
                        'Standard — $9.99/month (2,000 generative credits).' || chr(10) ||
                        'Pro — $29.99/month (7,000 credits).' || chr(10) ||
                        'Premium — $199.99/month (50,000 credits).' || chr(10) ||
                        'Also bundled in Creative Cloud plans (Photoshop, Illustrator) with included monthly credit allotments; additional credits purchasable.',
  commercial_use_policy = 'All outputs are commercially safe. Firefly is trained exclusively on licensed Adobe Stock and public domain content, so generated images are cleared for commercial use under Adobe''s standard terms.',
  training_data       = 'Licensed Adobe Stock images and public domain content only. No unlicensed or scraped third-party web imagery.',
  workflow_notes      = 'In Photoshop, select a region and use Generative Fill to describe what to add or replace. In Adobe Express, apply AI text effects to typography. In Illustrator, generate vectors from text prompts. Generative credits are consumed per output; unused monthly credits do not roll over.',
  limitations         = 'Credit-based system means heavy users deplete monthly allowances quickly. Some features are only available inside specific Creative Cloud apps. Free-tier outputs can be watermarked. Video and vector expansion features are still rolling out.',
  use_cases_list      = ARRAY[
    'Generate marketing and advertising creatives',
    'Extend or retouch photos with Generative Fill in Photoshop',
    'Create AI-driven text and typographic effects in Adobe Express',
    'Rapid concept prototyping and moodboard generation',
    'Generate product images and background textures for commercial use'
  ]
WHERE id = '7c80eac5-0804-4fea-946f-c72c427a0902';

-- Seed Midjourney
UPDATE ai_tools SET
  tagline             = 'High-aesthetic AI image generation built for creative professionals',
  model_type          = 'Proprietary generative AI image model with iterative upscaling, style control, and video animation',
  access_method       = 'Via Discord bot (/imagine command) in the Midjourney server or your own server; full web app at midjourney.com. Requires a paid subscription — no free trial available.',
  pricing_breakdown   = 'Basic — $10/month (200 fast GPU hours, no Relax Mode).' || chr(10) ||
                        'Standard — $30/month (15 fast GPU hours/month, unlimited Relax Mode images).' || chr(10) ||
                        'Pro — $60/month (30 fast GPU hours, Stealth Mode, unlimited Relax video).' || chr(10) ||
                        'Mega — $120/month (60 fast GPU hours, max concurrent jobs, Stealth Mode).',
  commercial_use_policy = 'Subscribers below $1M annual revenue may use outputs commercially. Businesses above $1M annual revenue must use Pro or Mega plans. Stealth Mode (Pro/Mega) is required for client work that must remain private.',
  training_data       = 'Trained on large internet image datasets. Midjourney has not published a detailed data provenance report. Training data practices are subject to ongoing legal scrutiny.',
  workflow_notes      = 'Use /imagine [prompt] to generate 4 image options. Upscale (U1–U4) or create variations (V1–V4) from any result. Key parameters: --ar (aspect ratio), --v (model version), --style, --sref (style reference image). Image prompts blend a reference photo with your text. Fast Mode burns GPU hours; Relax Mode is unlimited but slower.',
  limitations         = 'No free tier — a paid subscription is required from day one. Stealth Mode (for private commercial work) only on Pro ($60/mo) and Mega ($120/mo). Discord-based workflow is less intuitive for users new to the platform. Limited fine-grained control over exact compositions compared to inpainting tools like Photoshop.',
  use_cases_list      = ARRAY[
    'Concept art for games, films, and animation',
    'Marketing and social media visuals',
    'Product and logo concept exploration',
    'Book, editorial, and album cover illustration',
    'Moodboards and style frames for creative direction'
  ]
WHERE id = '4c336189-315f-4e1d-9e98-7c31157444ca';
