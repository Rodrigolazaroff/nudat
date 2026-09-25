-- Borra los usuarios de demo (@demo.test). Perfiles y comidas caen en cascada.
-- Correr en el SQL editor de Supabase antes de usar la app con gente real.
-- Las fotos que se hayan subido con esas cuentas quedan en Storage → fotos-comidas
-- (carpetas d0000000-…): borrarlas desde el dashboard.
delete from auth.users where email like '%@demo.test';
