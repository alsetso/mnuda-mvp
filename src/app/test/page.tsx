export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-mnuda-dark-blue mb-4">
          MNUDA Test Page
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          If you can see this, the routing is working!
        </p>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-sm text-gray-500">
            Timestamp: {new Date().toISOString()}
          </p>
          <p className="text-sm text-gray-500">
            Environment: {process.env.NODE_ENV}
          </p>
        </div>
      </div>
    </div>
  );
}
