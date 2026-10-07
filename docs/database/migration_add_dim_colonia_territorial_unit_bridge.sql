-- Valorius — Puente dim_colonia → geo.territorial_unit
-- Fecha: 2026-10-07
-- Fuente de asignación: VALORIUS_MAPEO_COLONIAS_DB_A_CATALOGO_v34.xlsx
-- Regla: solo MAPEADO + 3 DUPLICADO_DB con correspondencia territorial documentada.
-- No poblar PENDIENTE_CRITERIO_HUMANO ni SIN_CORRESPONDENCIA.

ALTER TABLE core.dim_colonia
  ADD COLUMN IF NOT EXISTS territorial_unit_id text NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'core.dim_colonia'::regclass
      AND conname = 'dim_colonia_territorial_unit_id_fkey'
  ) THEN
    ALTER TABLE core.dim_colonia
      ADD CONSTRAINT dim_colonia_territorial_unit_id_fkey
      FOREIGN KEY (territorial_unit_id)
      REFERENCES geo.territorial_unit(unit_id);
  END IF;
END $$;

WITH mapping(colonia_id, territorial_unit_id) AS (
  VALUES
('03a56fd8-869d-45d4-87af-1f7701de6d9d'::uuid, '0801-COL-0867'),
('03cdd3c4-c6be-4587-9be5-7a4ac1646c97'::uuid, '0801-COL-0412'),
('07a854a6-d2ec-49e9-baa9-6bd619a084cf'::uuid, '0801-COL-0535'),
('0d9bd461-048a-47a7-b911-76d078a483b3'::uuid, '0801-COL-0819'),
('139f64f2-9aea-4569-8685-9e3908b4b510'::uuid, '0801-COL-0347'),
('15b66103-b48a-4db7-9af4-8b9a306c0eae'::uuid, '0801-COL-0421'),
('1cfdd243-e0b8-4d4a-b1d6-3422cccfcaee'::uuid, '0801-COL-0651'),
('222cb97c-a8fa-499e-84b1-20f47173b5ac'::uuid, '0801-COL-0435'),
('263baa00-b743-4463-9121-736d9eaf71b3'::uuid, '0801-COL-0137'),
('26b39044-dbf9-447e-9800-24db42d6c925'::uuid, '0801-COL-0511'),
('27878c1a-d6ac-4fc2-9311-615d6ebc3a85'::uuid, '0801-COL-0356'),
('2a5d91e2-0e7c-45a3-95d0-4973bc5e60ba'::uuid, '0801-COL-0944'),
('35329660-57ab-4064-a993-ae336f4ce953'::uuid, '0801-COL-0005'),
('39f720ef-9ae0-45b8-a957-dff17d72a342'::uuid, '0801-COL-0522'),
('3d833f7b-b16e-4291-a85f-59bf14522db3'::uuid, '0801-COL-0984'),
('3f66273c-d1f8-457a-ac8d-3b55156e8fee'::uuid, '0801-COL-0535'),
('45941eb1-a10f-41bc-8b25-e99e3ccff2ca'::uuid, '0801-COL-0125'),
('4a0b3d80-ac2c-4dd0-b4ee-4b2269615476'::uuid, '0801-COL-0012'),
('502124a9-0475-4fa6-a7d0-ae66f02904df'::uuid, '0801-COL-0330'),
('550e8400-e29b-41d4-a716-446655440102'::uuid, '0801-COL-0347'),
('55a6c893-366c-460f-a604-807d2dec6918'::uuid, '0801-COL-0804'),
('5b95d927-33eb-4911-8d6e-fa1ff9a92a2a'::uuid, '0801-COL-0912'),
('6597b383-8a3b-4cc3-84fc-8dfe3e68e46b'::uuid, '0801-COL-0789'),
('6645058b-a151-43a3-a60a-d1d8c7578904'::uuid, '0801-COL-0342'),
('6a229a2a-2a68-4c0d-bdfc-741dcc4868b9'::uuid, '0801-COL-0189'),
('71691f41-b943-4667-9e98-d7536017e851'::uuid, '0801-COL-0363'),
('78b62261-5f6b-478f-b01e-ed9f6dd3d615'::uuid, '0801-COL-0523'),
('79391513-102b-448a-b700-a12ca910a496'::uuid, '0801-COL-0504'),
('7b004ab4-f132-423a-89e9-d113fa64437b'::uuid, '0801-COL-0338'),
('7f1c2f36-c48c-418a-920f-0099a58d0eb9'::uuid, '0801-COL-0090'),
('922d1434-fd41-40be-a02b-a978fd726a28'::uuid, '0801-COL-0787'),
('97d60977-984a-4d6d-9ee9-2102a81a1a31'::uuid, '0801-COL-0381'),
('9b071b0a-0168-4815-9660-904b2c0895fa'::uuid, '0801-COL-0524'),
('9c088128-e9c7-4650-9819-355a96ec73c0'::uuid, '0801-COL-0652'),
('a080aa61-312c-4a74-9e6a-ff1b01693146'::uuid, '0801-COL-0340'),
('a1fc0388-df20-4cff-852a-22710f03e1d1'::uuid, '0801-COL-0353'),
('a39dc3fd-9ee5-4dcd-a7a3-61efb982ea9a'::uuid, '0801-COL-0363'),
('a8b9b40c-ba3d-4a8c-b923-16dda2642fb7'::uuid, '0801-COL-0310'),
('afdbe25c-521d-4a86-bd9a-a713ff6b9b24'::uuid, '0801-COL-0181'),
('b0cfe9c1-f0ae-4eab-b5a6-9d150290af75'::uuid, '0801-COL-0340'),
('b23ef418-801e-46da-94f2-2197c2db6b7d'::uuid, '0801-COL-0887'),
('b7e6697c-5428-4f75-839c-f3e8af348c48'::uuid, '0801-COL-0338'),
('bee65c4a-ee10-4455-91e5-132a4e11562d'::uuid, '0801-COL-0020'),
('c9ccb615-ef79-4288-b906-eb0ae1918d0e'::uuid, '0801-COL-0378'),
('c9d8f4a5-f7b4-40db-b4b5-4989b9da5fe5'::uuid, '0801-COL-0412'),
('cb70a20f-0a32-4e41-a21e-7e57bc82860e'::uuid, '0801-COL-0922'),
('cfe797a2-6f9b-48a9-bae8-b09ac70d5dcd'::uuid, '0801-COL-0674'),
('da436b68-3079-490a-85d6-2765b2f17aab'::uuid, '0801-COL-0238'),
('dac928cd-2c01-4189-8e81-3716ffff7f13'::uuid, '0801-COL-0187'),
('e0616537-3e6d-4f6c-a23e-6b3598330aa1'::uuid, '0801-COL-0526'),
('e4904de9-5e7b-4298-8ad0-104a59d0eef0'::uuid, '0801-COL-1007'),
('e706c143-c001-4d4f-9fa6-f9ba69d1403a'::uuid, '0801-COL-0305'),
('ea58f4c5-ec7c-4099-8acc-3da67d0e5608'::uuid, '0801-COL-0090'),
('ef980633-e160-4093-9097-365b5f4b9e8b'::uuid, '0801-COL-0032'),
('f559092a-f3b1-44bc-a959-d0d6a2566274'::uuid, '0801-COL-0637'),
('f823baed-53e1-47c1-8a1a-11d0b0bc5630'::uuid, '0801-COL-0145'),
('fbf3f32a-f93e-4f23-8b28-e72f0e62c1d3'::uuid, '0801-COL-0627')
)
UPDATE core.dim_colonia dc
SET territorial_unit_id = m.territorial_unit_id
FROM mapping m
WHERE dc.colonia_id = m.colonia_id
  AND (dc.territorial_unit_id IS DISTINCT FROM m.territorial_unit_id);
