# Scripts SQL

Orden recomendado:

```bash
mysql -u root -p < sql/01_schema.sql
mysql -u root -p < sql/02_seed_locations.sql
mysql -u root -p < sql/03_seed_extensions.sql
mysql -u root -p < sql/04_seed_admin.sql
```

También puedes importar todo junto:

```bash
mysql -u root -p < sql/00_full_install.sql
```

## Datos cargados

- Extensiones importadas: 166
- Ubicaciones activas importadas: 122
- Ubicaciones pendientes importadas: 2
- Usuario de aplicación creado: `admin`
- Contraseña inicial: `B1Admin`

Las ubicaciones se poblaron con el campo `maps_url`; no se usan coordenadas en el seed.
