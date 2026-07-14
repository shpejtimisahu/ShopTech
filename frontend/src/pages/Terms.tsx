function Terms() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-10 max-w-3xl" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

      <div className="space-y-6 text-gray-600 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h2>
          <p>By accessing and using ShopTech, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Account Responsibilities</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Please notify us immediately of any unauthorized use.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Orders & Pricing</h2>
          <p>All prices are listed in USD. We reserve the right to modify prices and product availability at any time. Orders are subject to stock availability at the time of purchase.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Payment</h2>
          <p>Payments are processed through Stripe. By placing an order, you confirm that the payment information you provide is accurate and that you are authorized to use the payment method.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Order Cancellation</h2>
          <p>You may cancel an order while it is still in "pending" status. Once an order has been confirmed or shipped, cancellation may not be possible.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Limitation of Liability</h2>
          <p>ShopTech is provided "as is". We are not liable for any indirect or consequential damages arising from the use of our platform.</p>
        </section>
      </div>
    </div>
  );
}

export default Terms;
