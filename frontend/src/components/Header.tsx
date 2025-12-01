import { Sparkles, Github, Twitter } from "lucide-react";
import { Button } from "./ui/button";

export const Header = () => {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg overflow-hidden p-0.5">
                        <img src="/ai-logo.png" alt="Logo" className="w-full h-full object-cover rounded-md" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                        DataSense AI
                    </span>
                </div>

                <nav className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary transition-colors">
                        <Github className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary transition-colors">
                        <Twitter className="h-5 w-5" />
                    </Button>
                </nav>
            </div>
        </header>
    );
};
