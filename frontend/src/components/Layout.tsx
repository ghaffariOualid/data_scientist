import { Header } from "./Header";
import { Footer } from "./Footer";

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    return (
        <div className="flex min-h-screen flex-col bg-background relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{
                backgroundImage: `radial-gradient(#4f46e5 1px, transparent 1px)`,
                backgroundSize: '24px 24px'
            }}></div>

            {/* Ambient Glow */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />

            <Header />
            <main className="flex-1 pt-16 animate-fade-in z-10 relative">
                {children}
            </main>
            <Footer />
        </div>
    );
};
