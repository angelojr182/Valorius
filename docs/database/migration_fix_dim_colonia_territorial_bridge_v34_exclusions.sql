-- Corrección posterior a la carga inicial.
-- Elimina cualquier puente que no esté respaldado por MAPEADO o
-- DUPLICADO_DB documentado en v34.

UPDATE core.dim_colonia
SET territorial_unit_id = NULL
WHERE colonia_id IN (
  '02275c04-16ba-4fff-b585-ec9af2a7079d'::uuid,
  '481c65cc-5ee2-47d0-81f5-453fb336e3f1'::uuid,
  '4c267595-52d1-43e0-a02a-4d2662112817'::uuid,
  '550e8400-e29b-41d4-a716-446655440101'::uuid,
  '550e8400-e29b-41d4-a716-446655440103'::uuid,
  '5b27b3f2-4d49-4506-98ab-dafa510f2c0f'::uuid,
  '79655783-394b-4698-8eee-7ea7eb5d9df8'::uuid,
  '7ab6ffe6-4527-4894-a318-1d768302f077'::uuid,
  '81cca9bb-6149-49af-b037-424a435de7d2'::uuid,
  'b71b6c29-c6ab-4ba0-b5d7-dfc6f9962bca'::uuid,
  'c3497a22-1df6-4978-b7fb-f107cf0f4c68'::uuid,
  'd6ecee08-1b8b-4027-a031-9c7190ec45c0'::uuid,
  'dd115f37-282d-4ede-a1b8-cf28b41d3929'::uuid,
  'e6c49f5c-a9d6-46bd-8e7a-12d789bffc64'::uuid,
  'ea7327d8-e9ae-4bdd-9617-8e96f9712d84'::uuid,
  'f210cd30-a852-450a-8b06-725acd467a2f'::uuid,
  'f3808652-2f25-4266-9aae-6fe41a0643fe'::uuid,
  'fe46531d-5762-462b-94a6-f7a5910840be'::uuid
);
