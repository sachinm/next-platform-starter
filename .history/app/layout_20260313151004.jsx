import '../styles/globals.css';
import { Footer } from '../components/footer';
import { Header } from '../components/header';
import AuthProvider from '../components/AuthProvider';

export const metadata = {
    title: {
        template: '%s | Ad Astra',
        default: 'Ad Astra - Astrology & AI'
    }
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/favicon.svg" sizes="any" />
            </head>
            <body className="antialiased text-white bg-blue-900">
                <div className="min-h-screen relative overflow-x-hidden">
                    {/* Fixed Galaxy Background */}
                    <div
                        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
                        style={{
                            backgroundImage: `url('https://images.pexels.com/photos/1169754/pexels-photo-1169754.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop')`,
                        }}
                    >
                        <div className="absolute inset-0 bg-black/40"></div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10">
                        <AuthProvider>
                            <div className="flex flex-col min-h-screen px-6 bg-noise sm:px-12">
                                <div className="flex flex-col w-full max-w-5xl mx-auto grow">
                                    <Header />
                                    <main className="grow">{children}</main>
                                    <Footer />
                                </div>
                            </div>
                        </AuthProvider>
                    </div>
                </div>
            </body>
        </html>
    );
}
