import { Github, Twitter, BarChart3, TrendingUp, PieChart, FileText, Grid3x3 } from "lucide-react";
import { Button } from "./ui/button";
import { Link, useLocation } from "react-router-dom";

export const Header = () => {
    const location = useLocation();

    const navItems = [
        { label: "Données", path: "/data", icon: Grid3x3, color: "from-primary to-accent" },
        { label: "Barres", path: "/charts", icon: BarChart3, color: "from-blue-500 to-cyan-500" },
        { label: "Tendances", path: "/trends", icon: TrendingUp, color: "from-pink-500 to-rose-500" },
        { label: "Distribution", path: "/distribution", icon: PieChart, color: "from-orange-500 to-amber-500" },
        { label: "Rapports", path: "/reports", icon: FileText, color: "from-primary to-accent" },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="container px-4">
                <div className="flex h-16 items-center justify-between gap-8">
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg overflow-hidden p-0.5">
                            <img src="/ai-logo.png" alt="Logo" className="w-full h-full object-cover rounded-md" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                            DataSense AI
                        </span>
                    </div>

                    <nav className="flex items-center gap-3 flex-1 justify-center">
                        {navItems.map((item) => {
                            const IconComponent = item.icon;
                            const isActiveRoute = isActive(item.path);
                            
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                                        isActiveRoute
                                            ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                                            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                    }`}
                                >
                                    <IconComponent className="h-4 w-4" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary transition-colors">
                            <Github className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary transition-colors">
                            <Twitter className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
};
