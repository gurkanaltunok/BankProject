'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const UnauthorizedPage = () => {
  const router = useRouter();
  const { user } = useAuth();

  const handleGoBack = () => {
    router.back();
  };

  useEffect(() => {
    // 5 saniye sonra ana sayfaya yönlendir
    const timer = setTimeout(() => {
      router.push('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            onClick={handleGoBack}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri
          </Button>
        </div>
        
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
            <svg
              className="h-10 w-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Yetki Hatası
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-8">
            Bu sayfaya erişim yetkiniz bulunmamaktadır.
          </p>

          {/* User Info */}
          {user && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Kullanıcı Bilgileri
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Ad:</span> {user.name} {user.surname}</p>
                <p><span className="font-medium">Email:</span> {user.email}</p>
                <p><span className="font-medium">Rol:</span> {user.roleId === 1 ? 'Normal Kullanıcı' : 'Admin'}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-4">
            <button
              onClick={() => router.push('/')}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Ana Sayfaya Dön
            </button>

            <button
              onClick={() => router.back()}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Geri Git
            </button>
          </div>

          {/* Auto Redirect Info */}
          <div className="mt-8 text-sm text-gray-500">
            <p>5 saniye sonra otomatik olarak ana sayfaya yönlendirileceksiniz...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
