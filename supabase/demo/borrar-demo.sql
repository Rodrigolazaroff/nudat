-- Borra los usuarios de demo (@demo.test). Perfiles, comidas e invitaciones caen en cascada.
-- Correr en el SQL editor de Supabase antes de usar la app con pacientes reales.
-- Las fotos que se hayan subido con esas cuentas quedan en Storage → fotos-comidas
-- (carpetas d0000000-…): borrarlas desde el dashboard.
delete from auth.users where email like '%@demo.test';
delete from privado.nutris_habilitadas where email like '%@demo.test';
