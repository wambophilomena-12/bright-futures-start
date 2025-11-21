-- Approve the 3 pending hotels
UPDATE hotels 
SET approval_status = 'approved', 
    approved_at = NOW(),
    is_hidden = false
WHERE id IN (
  'c0699ba5-fdfd-44c4-98f1-7d029f36df63',
  'f5645c61-f1ca-4ef7-9f6f-f1fda515f364',
  'f9454bed-9bfe-4b2c-a154-dc71e5191842'
);

-- Approve the 1 pending campsite
UPDATE adventure_places 
SET approval_status = 'approved', 
    approved_at = NOW(),
    is_hidden = false
WHERE id = '82d10247-6fd3-4af3-91aa-045c971bdacd';