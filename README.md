# Sonora

Plataforma de botones de audio alojados permanentemente en Vercel Blob. Las pistas, colores, títulos y orden se conservan para todos los dispositivos.

## Publicar en GitHub y Vercel

1. Crea un repositorio privado en GitHub y sube el contenido de esta carpeta.
2. En Vercel, importa ese repositorio.
3. En el proyecto de Vercel crea un **Blob Store** (Storage → Blob) y conéctalo al proyecto. Vercel añadirá `BLOB_READ_WRITE_TOKEN` automáticamente.
4. En **Settings → Environment Variables**, añade:
   - `SONORA_ADMIN_PASSWORD`: la contraseña con la que editarás desde cualquier dispositivo.
   - `SONORA_AUTH_SECRET`: una frase larga y aleatoria distinta.
5. Haz redeploy. Abre la URL publicada, pulsa **Editar**, inicia sesión y sube tus pistas.

No subas el archivo `.env.local` ni contraseñas al repositorio.
