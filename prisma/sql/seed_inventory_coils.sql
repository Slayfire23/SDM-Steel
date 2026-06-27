WITH current_inventory AS (
  SELECT COALESCE(MAX("ID"), 1000)::integer AS max_id
  FROM "Inventory"
),
new_coils AS (
  SELECT
    current_inventory.max_id + coil_number AS id,
    coil_number,
    (ARRAY['BH', 'HSLA', 'SS 50', 'SS 55', 'CS-B', 'CS-A'])[((coil_number - 1) % 6) + 1] AS grade,
    (ARRAY[36.000, 40.250, 42.500, 48.000, 50.125, 54.000, 60.000, 62.375, 72.000, 84.000])[(coil_number % 10) + 1] AS width,
    8500 + (coil_number * 437 % 26500) AS weight,
    (ARRAY['Available', 'Available', 'Available', 'Reserved', 'Hold'])[((coil_number - 1) % 5) + 1] AS status,
    (ARRAY['Aisle A', 'Aisle B', 'Aisle C', 'Bay 1', 'Bay 2', 'Dock', 'Slitter Queue'])[((coil_number - 1) % 7) + 1] AS location,
    (ARRAY[0.012, 0.015, 0.018, 0.021, 0.024, 0.030, 0.036, 0.048, 0.060, 0.075])[(coil_number % 10) + 1] AS gauge,
    (ARRAY['Cleveland Steel', 'Great Lakes Metals', 'Midwest Coil', 'Ohio Flat Roll', 'Riverbend Steel', 'Summit Metals'])[((coil_number - 1) % 6) + 1] AS supplier,
    (ARRAY[45.0, 48.5, 50.0, 52.5, 55.0, 58.0, 60.5, 62.0])[(coil_number % 8) + 1] AS rockwell,
    (ARRAY['HDG', 'GNL', 'CR', 'HRPO'])[((coil_number - 1) % 4) + 1] AS finish
  FROM generate_series(1, 100) AS coil_number
  CROSS JOIN current_inventory
)
INSERT INTO "Inventory" (
  "ID",
  "Coil Number",
  "Grade",
  "Width",
  "Weight",
  "Status",
  "Location",
  "Gauge",
  "Supplier",
  "Rockwell",
  "Finish",
  "Reserved Customer"
)
SELECT
  id,
  'COIL-' || id,
  grade,
  width,
  weight,
  status,
  location,
  gauge,
  supplier,
  rockwell,
  finish,
  CASE
    WHEN status = 'Reserved' THEN (
      SELECT "Customer Number" || ' - ' || COALESCE("Customer Name", '')
      FROM "Customers"
      ORDER BY "Customer Number"
      OFFSET ((coil_number - 1) % GREATEST((SELECT COUNT(*) FROM "Customers"), 1))
      LIMIT 1
    )
    ELSE NULL
  END
FROM new_coils
WHERE NOT EXISTS (
  SELECT 1
  FROM "Inventory"
  WHERE "Coil Number" = 'COIL-' || new_coils.id
);
