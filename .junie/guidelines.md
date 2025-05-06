# Promptly Frontend Development Guidelines

This document provides essential information for developers working on the Promptly frontend project.

## Build and Configuration

### Environment Setup

1. **Environment Variables**:
   - Copy `.env.local` to create your own `.env` file
   - Required variables:
     - `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
     - `NEXT_PUBLIC_SITE_URL`: Site URL (http://localhost:3000 for local development)
     - Web Push Notification Keys (for notification functionality)

2. **Development Server**:
   ```bash
   npm run dev
   ```
   This starts the development server at http://localhost:3000

3. **Production Build**:
   ```bash
   npm run build
   npm run start
   ```

### Docker Deployment

The project includes Docker configuration for deployment:

```bash
# Build the Docker image
docker build -t promptly-frontend .

# Run the container
docker run -p 3000:3000 promptly-frontend
```

The Dockerfile is configured for deployment on Fly.io with multi-stage builds to optimize image size.

## Testing

### Testing Framework

The project uses Jest and React Testing Library for testing React components.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (useful during development)
npm run test:watch
```

### Test Structure

- Tests are located in the `src/__tests__` directory
- Component tests are in `src/__tests__/components`
- Tests follow the naming convention `*.test.tsx` or `*.test.ts`

### Writing Tests

1. **Component Tests**:
   ```typescript
   import { render, screen } from '@testing-library/react';
   import YourComponent from '@/components/your-component';

   describe('YourComponent', () => {
     it('renders correctly', () => {
       render(<YourComponent />);
       expect(screen.getByText('Expected Text')).toBeInTheDocument();
     });
   });
   ```

2. **Testing with User Interactions**:
   ```typescript
   import { render, screen, fireEvent } from '@testing-library/react';
   import YourComponent from '@/components/your-component';

   describe('YourComponent', () => {
     it('handles user interaction', () => {
       render(<YourComponent />);
       fireEvent.click(screen.getByRole('button', { name: /click me/i }));
       expect(screen.getByText('Clicked')).toBeInTheDocument();
     });
   });
   ```

3. **Mocking Next.js Router and Navigation**:
   - The test setup already includes mocks for Next.js router and navigation
   - These mocks are defined in `jest.setup.js`

### Adding New Tests

1. Create a new test file in the appropriate directory
2. Import the component and testing utilities
3. Write test cases using the `describe` and `it` functions
4. Run the tests to verify they pass

## Development Information

### Project Structure

- `src/app`: Next.js App Router pages and layouts
- `src/components`: React components organized by feature
- `src/lib`: Utility functions and shared code
- `src/hooks`: Custom React hooks
- `src/contexts`: React context providers
- `src/types`: TypeScript type definitions
- `src/utils`: Utility functions
- `src/messages`: Internationalization message files

### UI Components

The project uses [shadcn/ui](https://ui.shadcn.com/) components, which are located in `src/components/ui`. These components are built on top of Radix UI and styled with Tailwind CSS.

### Internationalization

The project uses `next-intl` for internationalization:

- Message files are in `src/messages/{locale}.json`
- Configuration is in `next-intl.config.js` and `src/i18n.ts`
- The `<LanguageSwitcher />` component allows users to change the language

### Supabase Integration

The project uses Supabase for authentication and backend services:

- Supabase client is configured in `src/lib/supabase`
- Authentication components are in `src/components/auth`
- Database migrations are in the `migrations` and `supabase-migrations` directories

### Code Style

- The project uses ESLint with Next.js and TypeScript configurations
- Follow the existing code style in the project
- Use TypeScript for type safety
- Use React hooks for state management
- Use Tailwind CSS for styling

### Performance Considerations

- Use Next.js features like Image optimization and Server Components
- Minimize client-side JavaScript by using Server Components where possible
- Use proper code splitting and lazy loading for large components
- Optimize images and assets for web delivery