import { useNavigate } from "react-router-dom";

function PaymentSuccess() {
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
      <p className="text-gray-500 mb-8">Your order has been placed successfully. Pay in cash when it arrives.</p>
      <div className="flex flex-col gap-3">
        <button
          onClick={() => navigate("/orders")}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          View My Orders
        </button>
        <button
          onClick={() => navigate("/")}
          className="w-full bg-white border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}

export default PaymentSuccess;
