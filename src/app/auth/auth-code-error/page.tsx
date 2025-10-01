export default function AuthCodeError() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Authentication Error
            </h2>
            <p className="text-gray-600 mb-6">
              Sorry, we couldn&apos;t log you in. There was an error with the authentication process.
            </p>
            <a
              href="/auth/login"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Try Again
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}