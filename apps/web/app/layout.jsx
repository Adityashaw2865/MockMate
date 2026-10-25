import '@fontsource-variable/syne';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/600.css';
import './globals.css';
export const metadata = { title: 'MockMate', description: 'Real-time mock interview platform' };
export default function RootLayout({ children }) {
    return (<html lang="en"><body>{children}</body></html>);
}
