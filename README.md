# Financial Dashboard

A modern financial management application built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Runtime**: Bun
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed on your system

### Installation

1. Clone the repository
2. Install dependencies:

```bash
bun install
```

3. Copy environment variables:

```bash
cp .env.example .env
```

4. Run the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
mrkrabs/
├── app/                    # Next.js App Router pages and layouts
├── components/            # Reusable UI components
│   ├── ui/                # shadcn components
│   └── layout/            # Layout components
├── lib/                   # Utilities and helpers
├── types/                 # TypeScript type definitions
└── public/                # Static assets
```

## Architecture & Coding Standards

**Important**: Before making any code changes, please read [`ARCHITECTURE.md`](./ARCHITECTURE.md). This file contains:

- TypeScript conventions and strict typing requirements
- Interface and type management patterns
- Overall and detailed architecture documentation
- Coding guidelines for AI agents and developers

This file serves as the single source of truth for all architectural decisions and coding standards.

## Available Scripts

- `bun dev` - Start development server
- `bun build` - Build for production
- `bun start` - Start production server

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Bun Documentation](https://bun.sh/docs)
