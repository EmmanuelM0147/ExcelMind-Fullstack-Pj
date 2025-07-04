import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { Activity } from 'lucide-react';

export function Home() {
  const { data: health, isLoading } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get('/health'),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Modern Fullstack App
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          A production-ready application built with React, NestJS, PostgreSQL,
          and Docker. Features authentication, type safety, and modern
          development practices.
        </p>
        
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
          <div className="flex items-center justify-center mb-4">
            <Activity className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Backend Health Check</h3>
          {isLoading ? (
            <p className="text-gray-600">Checking...</p>
          ) : health?.data ? (
            <div className="text-green-600">
              <p>✅ Backend is running</p>
              <p className="text-sm text-gray-500 mt-1">
                Status: {health.data.status}
              </p>
            </div>
          ) : (
            <p className="text-red-600">❌ Backend not connected</p>
          )}
        </div>
      </div>
    </div>
  );
}