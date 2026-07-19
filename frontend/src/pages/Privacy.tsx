function Privacy() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-10 max-w-3xl" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

      <div className="space-y-6 text-gray-600 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Information We Collect</h2>
          <p>When you create an account at ShopTech, we collect your username, email address, and an encrypted version of your password. When you place an order, we store the products you purchased and the order details.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">2. How We Use Your Information</h2>
          <p>We use your information to process orders, manage your account, provide product recommendations, and improve our services. We never sell your personal data to third parties.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Password Security</h2>
          <p>Your password is never stored as plain text. We use bcrypt encryption with automatic salting, which means even our team cannot see your actual password.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Payment Information</h2>
          <p>All orders are paid via Cash on Delivery. No card or online payment details are collected or stored on our servers — payment happens in person when your order is delivered.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Cookies & Sessions</h2>
          <p>We use authentication tokens (JWT) stored in your browser to keep you logged in. These are used solely for maintaining your session and are not shared with third parties.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at support@shoptech.com.</p>
        </section>
      </div>
    </div>
  );
}

export default Privacy;
