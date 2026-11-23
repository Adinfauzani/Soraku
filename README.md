# Soraku Anime Streaming Ecosystem

Soraku is a modern, scalable, premium anime streaming ecosystem built with a clean monorepo architecture.

## 🏗️ Monorepo Structure
```
soraku/
├── apps/
│   ├── mobile/         # Kotlin/Android with Jetpack Compose
│   ├── api/            # NestJS Backend API
│   ├── admin/          # Next.js Admin Dashboard
│   └── landing/        # Marketing Website
├── packages/
│   ├── shared-types/   # Shared DTOs, interfaces, enums
│   ├── branding/       # Logo, fonts, colors, tokens
│   ├── config/         # ESLint, Prettier, TSConfig
│   ├── ui-web/         # Shared web UI components
│   └── docs/           # Internal documentation
├── infra/
│   ├── docker/         # Docker configurations
│   ├── nginx/          # Nginx configurations
│   └── scripts/        # Deployment and utility scripts
└── .github/
    └── workflows/      # GitHub Actions CI/CD
```

## 🚀 Tech Stack

### Mobile Frontend
- Kotlin
- Jetpack Compose
- Retrofit
- OkHttp
- Coil
- Firebase
- Media3 / ExoPlayer

### Backend API
- NestJS 10.x
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- Cloudflare R2
- Cloudflare CDN
- JWT Auth

### Admin Panel
- Next.js 15
- React 18
- Tailwind CSS
- TanStack Query

## 🛠️ Getting Started

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test

# Lint code
pnpm lint

# Build all apps
pnpm build
```

## 📦 Deployment

### Backend API (Docker/VPS)
```bash
cd apps/api
docker build -t soraku-api .
docker run -p 3000:3000 soraku-api
```

### Admin Panel & Landing (Vercel)
```bash
# Admin panel
cd apps/admin
vercel

# Landing website
cd apps/landing
vercel
```

### Mobile App
Follow Android build instructions for APK releases.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential.

## 🙏 Acknowledgments

- Inspired by Netflix Mobile, Crunchyroll, Miruro, AniList, and HiAnime
- Built with ❤️ by Rynex Studio
- Powered by the Soraku Community