This is a Next.js project bootstrapped with create-next-app.

Getting Started

First, run the development server:

npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev


Open http://localhost:3000 with your browser to see the result.

You can start editing the page by modifying app/page.tsx. The page auto-updates as you edit the file.

This project uses next/font to automatically optimize and load Geist, a new font family for Vercel.

Learn More

To learn more about Next.js, take a look at the following resources:

Next.js Documentation - learn about Next.js features and API.

Learn Next.js - an interactive Next.js tutorial.

You can check out the Next.js GitHub repository - your feedback and contributions are welcome!

Deploy on Vercel

The easiest way to deploy your Next.js app is to use the Vercel Platform from the creators of Next.js.

Check out our Next.js deployment documentation for more details.


Guarda el archivo (`Ctrl + S`).

---

### PASO 2: Confirmar la solución y subir

Ahora que el archivo está limpio, ve a tu terminal y ejecuta estos comandos uno por uno para cerrar el proceso:

1.  **Agrega el archivo corregido:**
    ```bash
    git add README.md
    ```

2.  **Cierra el conflicto (Commit del merge):**
    ```bash
    git commit -m "fix: resolviendo conflicto de readme mergeando historias"
    ```

3.  **Sube todo a la nube (GitHub):**
    ```bash
    git push origin main
    ```

---

### PASO 3: Poner la Etiqueta (Tag)

Una vez que termine de subir, asegura tu entrega con la etiqueta, como habíamos planeado:

```bash
git tag v0.3.0-entrega
git push origin v0.3.0-entrega