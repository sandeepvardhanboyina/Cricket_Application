'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/authSlice';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';

export function LogoutButton({
  className,
  iconClassName,
  label = 'Logout',
  onClick,
}: {
  className?: string;
  iconClassName?: string;
  label?: string;
  onClick?: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Successfully logged out');
    router.push('/login');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          onClick?.();
          setConfirmOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick?.();
            setConfirmOpen(true);
          }
        }}
        aria-label="Logout"
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-gray-800 hover:text-white text-gray-400',
          className
        )}
      >
        <LogOut className={cn('h-4 w-4', iconClassName)} />
        {label}
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        destructive
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          handleLogout();
        }}
      />
    </>
  );
}
