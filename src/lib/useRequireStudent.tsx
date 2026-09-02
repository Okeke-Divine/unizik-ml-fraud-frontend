"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function useRequireStudent() {
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('unizik_user');
      if (!raw) {
        router.push('/login');
        return;
      }
      const user = JSON.parse(raw);
      if (user?.role === 'ADMIN') {
        // redirect administrators away from student pages
        router.replace('/admin/dashboard');
      }
    } catch (e) {
      router.push('/login');
    }
  }, [router]);
}
