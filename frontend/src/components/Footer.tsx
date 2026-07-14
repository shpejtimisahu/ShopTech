import { Link } from "react-router-dom";

const linkStyle = { fontSize: "0.875rem", color: "#9ca3af", textDecoration: "none" };
const headStyle = { fontWeight: 600, color: "white", marginBottom: "0.75rem", fontSize: "0.75rem", textTransform: "uppercase" as const, letterSpacing: "0.1em" };
const ulStyle = { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column" as const, gap: "0.6rem" };

function Footer() {
  return (
    <footer style={{ backgroundColor: "#111827", marginTop: "3rem", fontFamily: "'Outfit', sans-serif" }}>
      {/* Back to top bar */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        style={{ width: "100%", backgroundColor: "#1f2937", color: "#d1d5db", fontSize: "0.8rem", padding: "0.6rem 0", border: "none", cursor: "pointer" }}
      >
        ↑ Back to top
      </button>

      {/* Main footer - 3 columns: Support | ShopTech | Legal */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: "2rem" }}>

          {/* Support - LEFT */}
          <div style={{ flex: "1 1 160px" }}>
            <h4 style={headStyle}>Support</h4>
            <ul style={ulStyle}>
              <li><a href="mailto:support@shoptech.com" style={linkStyle} className="hover:!text-white transition-colors">Contact Us</a></li>
              <li><Link to="/returns" style={linkStyle} className="hover:!text-white transition-colors">Returns & Refunds</Link></li>
              <li><a href="mailto:support@shoptech.com" style={linkStyle} className="hover:!text-white transition-colors">support@shoptech.com</a></li>
            </ul>
          </div>

          {/* ShopTech - CENTER */}
          <div style={{ flex: "1 1 200px", textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="footBrand" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#818cf8"/>
                    <stop offset="100%" stopColor="#c084fc"/>
                  </linearGradient>
                </defs>
                <polygon points="16,2 28,9 28,23 16,30 4,23 4,9" fill="url(#footBrand)"/>
                <circle cx="16" cy="16" r="3" fill="white" fillOpacity="0.4"/>
              </svg>
              <span style={{ fontWeight: 700, fontSize: "1.15rem", color: "white" }}>
                Shop<span style={{ color: "#818cf8" }}>Tech</span>
              </span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "#9ca3af", lineHeight: 1.5, margin: 0 }}>
              Premium tech — laptops, gaming gear, phones, and accessories.
            </p>
          </div>

          {/* Legal - RIGHT */}
          <div style={{ flex: "1 1 160px", textAlign: "right" }}>
            <h4 style={headStyle}>Legal</h4>
            <ul style={ulStyle}>
              <li><Link to="/privacy" style={linkStyle} className="hover:!text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" style={linkStyle} className="hover:!text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/returns" style={linkStyle} className="hover:!text-white transition-colors">Return Policy</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid #1f2937" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0.9rem 1.5rem", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
          <span style={{ fontSize: "0.72rem", color: "#6b7280" }}>© {new Date().getFullYear()} ShopTech. All rights reserved.</span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <span style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#d1d5db", fontSize: "0.72rem", fontWeight: 500, padding: "0.2rem 0.5rem", borderRadius: "0.25rem" }}>VISA</span>
            <span style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#d1d5db", fontSize: "0.72rem", fontWeight: 500, padding: "0.2rem 0.5rem", borderRadius: "0.25rem" }}>Mastercard</span>
            <span style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#d1d5db", fontSize: "0.72rem", fontWeight: 500, padding: "0.2rem 0.5rem", borderRadius: "0.25rem" }}>Stripe</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
