import { Metadata } from 'next';
import { ContractList } from '@/components/contract/ContractList';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contracts | MDF Contract Management',
  description: 'Manage MDF contracts and document processing',
};

export default function ContractsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Contract Management</h1>
            <p className="text-gray-600">View and manage your MDF contracts with allocation details.</p>
          </div>
          <Link
            href="/contracts/new"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create New Contract
          </Link>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <ContractList />
      </div>
    </div>
  );
}