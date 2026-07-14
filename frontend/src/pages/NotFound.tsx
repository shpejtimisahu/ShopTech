import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="text-center">
        <div className="relative inline-block mb-6">
          <h1 className="text-8xl font-extrabold"
            style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            404
          </h1>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
