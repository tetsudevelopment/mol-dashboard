This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Docker

La imagen de producción corre un servidor Next.js `standalone` en el puerto
`3011`, con probe de liveness en `GET /api/health`.

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://backmolapi.vepay.com.co \
  -t moltech-dashboard:latest .

docker run -d -p 3011:3011 moltech-dashboard:latest
```

`NEXT_PUBLIC_API_URL` se incrusta en el bundle durante el build: cambiarla
exige reconstruir la imagen, no basta con reiniciar el contenedor.

Guía completa de despliegue (Compose, Kubernetes, proxy inverso, troubleshooting):
[`docs/deployment.md`](docs/deployment.md).
