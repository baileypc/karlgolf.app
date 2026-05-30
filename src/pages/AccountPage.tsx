import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import IconNav from '@/components/IconNav';
import { authAPI } from '@/lib/api';

export default function AccountPage() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['account'],
    queryFn: () => authAPI.getAccount(),
    staleTime: 0,
  });

  useEffect(() => {
    if (data?.account) {
      setEmail(data.account.email ?? '');
    }
  }, [data]);

  const handleEmailSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }

    const normalizedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      toast.error('Enter a valid email address');
      return;
    }

    setIsSavingEmail(true);
    try {
      await authAPI.updateEmail(normalizedEmail);
      await queryClient.invalidateQueries({ queryKey: ['account'] });
      await queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast.success('Email updated. Your existing rounds and stats stay with your account.');
    } catch (error: any) {
      toast.error(error.message || 'Could not update email');
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsSavingPassword(true);
    try {
      await authAPI.updatePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated');
    } catch (error: any) {
      toast.error(error.message || 'Could not update password');
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <IconNav />
        <div className="min-h-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '28rem', width: '100%', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-primary)' }}>Loading account...</p>
          </div>
        </div>
      </>
    );
  }

  if (isError || !data?.account) {
    return (
      <>
        <IconNav />
        <div className="min-h-screen" style={{ padding: '1rem', paddingBottom: '100px', maxWidth: '900px', margin: '0 auto' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 'var(--font-2xl)', marginBottom: '0.75rem' }}>Account</h1>
            <p style={{ color: 'var(--text-primary)' }}>Could not load your account settings.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <IconNav />
      <div className="min-h-screen" style={{ padding: '0.25rem', paddingTop: '16px', paddingBottom: '100px', maxWidth: '900px', margin: '0 auto' }}>
        <div className="container">
          <div style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid var(--border-primary)', textAlign: 'center' }}>
            <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: 'bold', color: 'var(--text-primary)' }}>Account</h1>
          </div>

          <div className="card" style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 'bold', marginBottom: '1rem' }}>Profile</h2>
            <form onSubmit={handleEmailSave}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', minHeight: '48px', marginBottom: '0.75rem', padding: '0.75rem 1rem', backgroundColor: 'transparent', border: '2px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)' }}
              />

              <p style={{ color: 'var(--text-primary)', opacity: 0.75, fontSize: '0.9rem', marginTop: 0, marginBottom: '1rem' }}>
                This changes the email used for your account. No confirmation field is required.
              </p>

              <button className="btn btn-primary" type="submit" disabled={isSavingEmail} style={{ width: '100%' }}>
                {isSavingEmail ? 'Saving...' : 'Save Email'}
              </button>
            </form>
          </div>

          <div className="card" style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 'bold', marginBottom: '1rem' }}>Password</h2>
            <form onSubmit={handlePasswordSave}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{ width: '100%', minHeight: '48px', marginBottom: '1rem', padding: '0.75rem 1rem', backgroundColor: 'transparent', border: '2px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)' }}
              />

              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ width: '100%', minHeight: '48px', marginBottom: '1rem', padding: '0.75rem 1rem', backgroundColor: 'transparent', border: '2px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)' }}
              />

              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: '100%', minHeight: '48px', marginBottom: '1rem', padding: '0.75rem 1rem', backgroundColor: 'transparent', border: '2px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)' }}
              />

              <button className="btn btn-primary" type="submit" disabled={isSavingPassword} style={{ width: '100%' }}>
                {isSavingPassword ? 'Saving...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}