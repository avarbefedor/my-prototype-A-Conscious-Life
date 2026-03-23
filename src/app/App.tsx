import { RouterProvider } from 'react-router';
import { ThemeProvider } from 'next-themes';
import { router } from './routes';

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
