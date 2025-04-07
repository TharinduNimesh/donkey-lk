export function Footer() {
  return (
    <footer className="mt-20 mx-4 mb-4">
      <div className="max-w-7xl mx-auto rounded-2xl bg-background/80 backdrop-blur-lg shadow-lg px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">donkey.lk</h3>
            <p className="text-sm text-foreground/60">
              Empowering Sri Lankan content creators to maximize their earnings through strategic partnerships and community growth.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-sm text-foreground/60">
              <li><a href="#features" className="hover:text-foreground">Features</a></li>
              <li><a href="#creators" className="hover:text-foreground">For Creators</a></li>
              <li><a href="#brands" className="hover:text-foreground">For Brands</a></li>
              <li><a href="/blog" className="hover:text-foreground">Blog</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="font-semibold">Resources</h4>
            <ul className="space-y-2 text-sm text-foreground/60">
              <li><a href="/help" className="hover:text-foreground">Help Center</a></li>
              <li><a href="/community" className="hover:text-foreground">Community Guidelines</a></li>
              <li><a href="/terms" className="hover:text-foreground">Terms of Service</a></li>
              <li><a href="/privacy" className="hover:text-foreground">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-4">
            <h4 className="font-semibold">Connect With Us</h4>
            <ul className="space-y-2 text-sm text-foreground/60">
              <li><a href="https://facebook.com/donkeylk" className="hover:text-foreground">Facebook</a></li>
              <li><a href="https://twitter.com/donkeylk" className="hover:text-foreground">Twitter</a></li>
              <li><a href="https://instagram.com/donkeylk" className="hover:text-foreground">Instagram</a></li>
              <li><a href="mailto:hello@donkey.lk" className="hover:text-foreground">hello@donkey.lk</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-foreground/60">
              © 2025 donkey.lk - All rights reserved
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-foreground/60">Made with ♥ in Sri Lanka</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}