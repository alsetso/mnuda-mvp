export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">
          MNUDA - Minnesota Realtors Platform
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Welcome to the Minnesota Realtors Platform
        </p>
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
          <p className="text-sm text-gray-500 mb-2">
            Status: Application is running
          </p>
          <p className="text-sm text-gray-500 mb-2">
            Time: {new Date().toISOString()}
          </p>
          <p className="text-sm text-gray-500">
            Environment: {process.env.NODE_ENV}
          </p>
        </div>
        <div className="mt-8 space-x-4">
          <a 
            href="/test" 
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Test Page
          </a>
          <a 
            href="/api/health" 
            className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Health Check
          </a>
        </div>
      </div>
    </div>
  );
}