# Language Learning App

A modern web application for language learning that provides interactive translation exercises with AI-powered feedback.

## Features

- Translation exercises between any pair of languages
- Support for multiple acceptable translations
- Real-time AI evaluation of translations
- Feedback on overall translation quality and specific grammatical concepts
- Modern, responsive UI with Tailwind CSS

## Prerequisites

- Node.js 18+ and npm
- OpenAI API key

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd language-learning-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
- Copy `.env.example` to `.env`
- Add your OpenAI API key to the `.env` file

4. Initialize the database:
```bash
npx prisma generate
npx prisma db push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Project Structure

- `/src/app` - Next.js application files
- `/src/components` - React components
- `/src/lib` - Utility functions and services
- `/prisma` - Database schema and migrations

## Adding Content

To add new sentences and translations:

1. Use the Prisma Studio to manage database content:
```bash
npx prisma studio
```

2. Add languages, grammatical concepts, and sentences through the UI

## Environment Variables

- `DATABASE_URL`: SQLite database URL
- `OPENAI_API_KEY`: Your OpenAI API key

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT