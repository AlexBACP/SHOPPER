'use client';

import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Mail, Lock, User, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import Link from 'next/link';

const schema = z
  .object({
    name: z.string().min(2, 'Mínimo 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
      });
      const { accessToken, refreshToken } = res.data;
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const user = { id: payload.sub, email: payload.email, role: payload.role, name: data.name };

      setAuth(user, accessToken, refreshToken);
      toast.success('¡Cuenta creada exitosamente!');
      router.push('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al crear la cuenta');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
            <ShoppingBag className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Crear cuenta</h1>
          <p className="text-zinc-500 text-sm mt-1">Únete a Shopper hoy</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="bg-[#111] border border-[#222] rounded-2xl p-8 shadow-2xl"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

            <div className="relative">
              <User className="absolute left-3 top-9 w-4 h-4 text-zinc-500 pointer-events-none" />
              <Input
                label="Nombre completo"
                placeholder="Juan García"
                error={errors.name?.message}
                className="pl-10"
                {...register('name')}
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-9 w-4 h-4 text-zinc-500 pointer-events-none" />
              <Input
                label="Email"
                type="email"
                placeholder="tu@email.com"
                error={errors.email?.message}
                className="pl-10"
                {...register('email')}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-9 w-4 h-4 text-zinc-500 pointer-events-none" />
              <Input
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                className="pl-10"
                {...register('password')}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-9 w-4 h-4 text-zinc-500 pointer-events-none" />
              <Input
                label="Confirmar contraseña"
                type="password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                className="pl-10"
                {...register('confirmPassword')}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              loading={isSubmitting}
              className="w-full mt-2"
            >
              Crear cuenta
            </Button>

          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#222]" />
            <span className="text-zinc-600 text-xs">o</span>
            <div className="flex-1 h-px bg-[#222]" />
          </div>

          <p className="text-center text-sm text-zinc-500">
            ¿Ya tienes cuenta?{' '}
            <Link
              href="/auth/login"
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Inicia sesión
            </Link>
          </p>
        </motion.div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          © 2026 Shopper. Todos los derechos reservados.
        </p>
      </motion.div>
    </div>
  );
}