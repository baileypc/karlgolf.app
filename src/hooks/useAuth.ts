// Karl's GIR - Authentication Hook
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '@/lib/api';
import { storage } from '@/lib/storage';
import toast from 'react-hot-toast';

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => storage.getLoginState());
  const queryClient = useQueryClient();

  // Check login state from server
  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'check'],
    queryFn: authAPI.checkLogin,
    staleTime: 0, // Always refetch when invalidated
    retry: false, // Don't retry auth checks
    refetchOnWindowFocus: false,
    gcTime: Infinity, // Keep data in cache forever
  });

  // Sync with server response
  useEffect(() => {
    console.log('🔍 useAuth - Server response:', data);
    if (data?.isLoggedIn !== undefined) {
      console.log('🔍 useAuth - Setting isLoggedIn to:', data.isLoggedIn);
      setIsLoggedIn(data.isLoggedIn);
      storage.setLoginState(data.isLoggedIn);
    }
  }, [data]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authAPI.login(email, password),
    onSuccess: async () => {
      setIsLoggedIn(true);
      storage.setLoginState(true);
      // Invalidate and refetch auth check to sync with server
      await queryClient.invalidateQueries({ queryKey: ['auth'] });
      await queryClient.refetchQueries({ queryKey: ['auth', 'check'] });
      toast.success('Login successful!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Login failed');
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authAPI.register(email, password),
    onSuccess: async () => {
      setIsLoggedIn(true);
      storage.setLoginState(true);
      // Invalidate and refetch auth check to sync with server
      await queryClient.invalidateQueries({ queryKey: ['auth'] });
      await queryClient.refetchQueries({ queryKey: ['auth', 'check'] });
      toast.success('Account created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Registration failed');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      setIsLoggedIn(false);
      storage.setLoginState(false);
      storage.clearCurrentRound();
      storage.clearLiveRound();
      queryClient.clear();
      toast.success('Logged out successfully');
    },
    onError: () => {
      // Even if API call fails, clear local state
      setIsLoggedIn(false);
      storage.setLoginState(false);
      storage.clearCurrentRound();
      storage.clearLiveRound();
      queryClient.clear();
      // Don't show error toast - logout should always succeed locally
    },
  });

  return {
    isLoggedIn,
    isLoading,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
  };
}
