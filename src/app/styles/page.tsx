import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Style Catalog | MDF Contract Management',
  description: 'Manage style definitions and validation rules',
};

export default function StylesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Style Catalog</h1>
        <p className="text-gray-600">Manage style definitions, validation rules, and matching algorithms.</p>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h2 className="mt-4 text-lg font-medium text-gray-900">No styles defined yet</h2>
          <p className="mt-2 text-sm text-gray-500">Create your first style definition to begin contract processing.</p>
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Style
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}