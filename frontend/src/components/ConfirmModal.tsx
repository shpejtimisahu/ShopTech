interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[90] p-4"
      style={{ fontFamily: "'Outfit', sans-serif" }}
      onClick={onCancel}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-[popIn_0.2s_ease-out]"
        onClick={e => e.stopPropagation()}>
        <div className={`w-12 h-12 rounded-2xl ${danger ? "bg-red-100" : "bg-indigo-100"} flex items-center justify-center text-2xl mb-4 mx-auto`}>
          {danger ? "⚠️" : "❓"}
        </div>
        <h3 className="text-lg font-bold text-gray-900 text-center mb-1">{title}</h3>
        <p className="text-sm text-gray-500 text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors">
            {cancelText}
          </button>
          <button onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-white font-semibold transition-colors ${
              danger ? "bg-red-500 hover:bg-red-600" : "bg-indigo-600 hover:bg-indigo-700"
            }`}>
            {confirmText}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes popIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default ConfirmModal;
