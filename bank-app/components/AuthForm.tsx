'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from './ui/button';
import Link from 'next/link';

interface AuthFormProps {
  type: 'sign-in' | 'sign-up';
}

const AuthForm = ({ type }: AuthFormProps) => {
  const router = useRouter();
  const { login, register, loading } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    Name: '',
    Surname: '',
    TCKN: '',
    Email: '',
    Password: '',
    PhoneNumber: '',
    Address: '',
    RoleId: 1, // Default to Customer role
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (type === 'sign-in') {
        await login(formData.TCKN, formData.Password);
        router.push('/');
      } else {
        await register(formData);
        setSuccess('Hesap başarıyla oluşturuldu. Lütfen giriş yapın.');
        // Optionally redirect to sign-in page
        setTimeout(() => {
          router.push('/sign-in');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    }
  };

  return (
    <section className="auth-form">
      <header className="flex flex-col gap-5 md:gap-8">
        <Link href="/" className="cursor-pointer flex items-center gap-1">
          <img 
            src="/icons/logo.svg"
            width={34}
            height={34}
            alt="Agartha logo"
          />
          <h1 className="text-26 font-ibm-plex-serif font-bold text-black-1">Agartha</h1>
        </Link>

        <div className="flex flex-col gap-1 md:gap-3">
          <h1 className="text-24 lg:text-36 font-semibold text-gray-900">
            {type === 'sign-in' ? 'Giriş Yap' : 'Hesap Oluştur'}
          </h1>
          <p className="text-16 font-normal text-gray-600">
            {type === 'sign-in' 
              ? 'Hesabınıza erişmek için bilgilerinizi girin'
              : 'Başlamak için hesap bilgilerinizi girin'
            }
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {type === 'sign-up' && (
          <>
            <div className="flex gap-4">
                              <div className="form-item">
                  <label className="form-label">Ad</label>
                  <div className="flex w-full flex-col">
                    <input
                      type="text"
                      name="Name"
                      value={formData.Name}
                      onChange={handleInputChange}
                      placeholder="Adınızı girin"
                      className="input-class"
                      required
                    />
                  </div>
                </div>

                <div className="form-item">
                  <label className="form-label">Soyad</label>
                  <div className="flex w-full flex-col">
                    <input
                      type="text"
                      name="Surname"
                      value={formData.Surname}
                      onChange={handleInputChange}
                      placeholder="Soyadınızı girin"
                      className="input-class"
                      required
                    />
                  </div>
                </div>
            </div>

            <div className="form-item">
              <label className="form-label">E-posta</label>
              <div className="flex w-full flex-col">
                <input
                  type="email"
                  name="Email"
                  value={formData.Email}
                  onChange={handleInputChange}
                  placeholder="E-posta adresinizi girin"
                  className="input-class"
                  required
                />
              </div>
            </div>

            <div className="form-item">
              <label className="form-label">Telefon Numarası</label>
              <div className="flex w-full flex-col">
                <input
                  type="tel"
                  name="PhoneNumber"
                  value={formData.PhoneNumber}
                  onChange={handleInputChange}
                  placeholder="Telefon numaranızı girin"
                  className="input-class"
                  required
                />
              </div>
            </div>

            <div className="form-item">
              <label className="form-label">Adres</label>
              <div className="flex w-full flex-col">
                <input
                  type="text"
                  name="Address"
                  value={formData.Address}
                  onChange={handleInputChange}
                  placeholder="Adresinizi girin"
                  className="input-class"
                  required
                />
              </div>
            </div>
          </>
        )}

        <div className="form-item">
          <label className="form-label">TC Kimlik No</label>
          <div className="flex w-full flex-col">
            <input
              type="text"
              name="TCKN"
              value={formData.TCKN}
              onChange={handleInputChange}
              placeholder="TC Kimlik numaranızı girin"
              className="input-class"
              required
              maxLength={11}
              minLength={11}
            />
          </div>
        </div>

        <div className="form-item">
          <label className="form-label">Şifre</label>
          <div className="flex w-full flex-col">
            <input
              type="password"
              name="Password"
              value={formData.Password}
              onChange={handleInputChange}
              placeholder="Şifrenizi girin"
              className="input-class"
              required
              minLength={6}
            />
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-500 text-sm bg-green-50 p-3 rounded-md">
            {success}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <Button 
            type="submit" 
            disabled={loading}
            className="form-btn"
          >
            {loading ? 'İşleniyor...' : (type === 'sign-in' ? 'Giriş Yap' : 'Hesap Oluştur')}
          </Button>
        </div>
      </form>

      <footer className="flex justify-center gap-1">
        <p className="text-14 font-normal text-gray-600">
          {type === 'sign-in' 
            ? 'Henüz hesabınız yok mu?'
            : 'Zaten hesabınız var mı?'
          }
        </p>
        <Link 
          href={type === 'sign-in' ? '/sign-up' : '/sign-in'}
          className="form-link"
        >
          {type === 'sign-in' ? 'Hesap Oluştur' : 'Giriş Yap'}
        </Link>
      </footer>
    </section>
  );
};

export default AuthForm;
