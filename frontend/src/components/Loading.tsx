export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div className="inline-block animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600"
      style={{ width: size, height: size }} />
  );
}

export function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col animate-pulse">
      <div className="bg-gray-100 h-52" />
      <div className="p-4 flex flex-col gap-2">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="h-6 bg-gray-100 rounded w-1/3 mt-2" />
        <div className="h-9 bg-gray-100 rounded-xl w-full mt-2" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
      {Array.from({ length: count }).map((_, i) => <ProductSkeleton key={i} />)}
    </div>
  );
}
