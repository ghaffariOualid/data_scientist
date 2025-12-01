export const Footer = () => {
    return (
        <footer className="border-t border-white/10 bg-background/60 backdrop-blur-xl py-6 mt-auto">
            <div className="container flex flex-col items-center justify-between gap-4 md:flex-row px-4 text-sm text-muted-foreground">
                <p>© 2024 DataSense AI. Tous droits réservés.</p>
                <div className="flex gap-6">
                    <a href="#" className="hover:text-primary transition-colors">Confidentialité</a>
                    <a href="#" className="hover:text-primary transition-colors">Conditions</a>
                    <a href="#" className="hover:text-primary transition-colors">Aide</a>
                </div>
            </div>
        </footer>
    );
};
