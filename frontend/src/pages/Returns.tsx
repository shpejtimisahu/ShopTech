function Returns() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-10 max-w-3xl" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Return Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

      <div className="space-y-6 text-gray-600 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Return Window</h2>
          <p>You may return most items within 14 days of delivery for a full refund, provided they are in their original condition and packaging.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Eligible Items</h2>
          <p>To be eligible for a return, items must be unused, undamaged, and in the original packaging with all accessories included. Some items, such as opened software, may not be eligible.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">3. How to Return</h2>
          <p>To initiate a return, contact our support team with your order number. We will provide instructions on how to send the item back.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Refunds</h2>
          <p>Once we receive and inspect the returned item, your refund will be processed to the original payment method within 5–7 business days through Stripe.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Defective Products</h2>
          <p>If you receive a defective or damaged product, please contact us within 48 hours of delivery. We will arrange a replacement or full refund at no extra cost.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Contact</h2>
          <p>For any return-related questions, reach out to support@shoptech.com.</p>
        </section>
      </div>
    </div>
  );
}

export default Returns;
