import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { setAccessToken } from '../utils/api';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { getErrorMessage } from '../utils/errors';

const Profile = () => {
  const { user, account, loadProfile } = useAuth();
  const [profile, setProfile] = useState({ fullName: user?.fullName || '', phone: user?.phone || '' });
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [pwdMsg, setPwdMsg] = useState(null);
  const [pwdErr, setPwdErr] = useState(null);
  const [pinForm, setPinForm] = useState({ currentPassword: '', pin: '', confirmPin: '' });
  const [pinMsg, setPinMsg] = useState(null);
  const [pinErr, setPinErr] = useState(null);

  useEffect(() => {
    setProfile({ fullName: user?.fullName || '', phone: user?.phone || '' });
  }, [user]);

  const updateProfile = async (e) => {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await api.patch('/profile', profile);
      await loadProfile();
      setMsg('Profile updated successfully');
    } catch (err) {
      setErr(getErrorMessage(err, 'Update failed'));
    }
  };

  const changePwd = async (e) => {
    e.preventDefault();
    setPwdMsg(null);
    setPwdErr(null);
    try {
      const { data } = await api.patch('/profile/password', pwd);
      if (data?.data?.accessToken) {
        setAccessToken(data.data.accessToken);
      }
      setPwd({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      setPwdMsg('Password changed successfully');
    } catch (err) {
      setPwdErr(getErrorMessage(err, 'Password change failed'));
    }
  };

  const changePin = async (e) => {
    e.preventDefault();
    setPinMsg(null);
    setPinErr(null);
    if (!pinForm.currentPassword) {
      setPinErr('Enter your account password to confirm.');
      return;
    }
    if (!/^\d{4}$/.test(pinForm.pin)) {
      setPinErr('Your PIN must be exactly 4 digits.');
      return;
    }
    if (pinForm.pin !== pinForm.confirmPin) {
      setPinErr('PINs do not match.');
      return;
    }
    try {
      await api.patch('/profile/pin', pinForm);
      await loadProfile();
      setPinForm({ currentPassword: '', pin: '', confirmPin: '' });
      setPinMsg('Transaction PIN updated successfully');
    } catch (err) {
      setPinErr(getErrorMessage(err, 'PIN change failed'));
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-charcoal sm:text-3xl">Profile & Security</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col gap-5">
          <h2 className="text-lg font-semibold text-charcoal">Personal Details</h2>
          <form onSubmit={updateProfile} className="flex flex-col gap-4">
            <Input
              label="Full name"
              name="fullName"
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
            />
            <Input
              label="Phone number"
              name="phone"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
            <Input label="Email" value={user?.email} disabled />
            <div className="flex flex-col gap-2 text-xs text-muted">
              <span>Customer ID: {user?.customerId}</span>
              <span>Account Number: {account?.accountNumber}</span>
              <span>Status: {account?.status}</span>
            </div>
            {msg && <p className="text-sm text-success">{msg}</p>}
            {err && <p className="text-sm text-danger">{err}</p>}
            <Button type="submit">Save changes</Button>
          </form>
        </Card>
        <Card className="flex flex-col gap-5">
          <h2 className="text-lg font-semibold text-charcoal">Change Password</h2>
          <form onSubmit={changePwd} className="flex flex-col gap-4">
            <Input
              label="Current password"
              type="password"
              name="currentPassword"
              value={pwd.currentPassword}
              onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
            />
            <Input
              label="New password"
              type="password"
              name="newPassword"
              value={pwd.newPassword}
              onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
            />
            <Input
              label="Confirm new password"
              type="password"
              name="confirmNewPassword"
              value={pwd.confirmNewPassword}
              onChange={(e) => setPwd({ ...pwd, confirmNewPassword: e.target.value })}
            />
            {pwdMsg && <p className="text-sm text-success">{pwdMsg}</p>}
            {pwdErr && <p className="text-sm text-danger">{pwdErr}</p>}
            <Button type="submit">Update password</Button>
          </form>
        </Card>
        <Card className="flex flex-col gap-5">
          <h2 className="text-lg font-semibold text-charcoal">Transaction PIN</h2>
          <p className="text-sm text-muted">
            {user?.hasPin
              ? 'Your 4-digit PIN is used to authorise transfers and withdrawals.'
              : 'Set a 4-digit PIN to authorise transfers and withdrawals.'}
          </p>
          <form onSubmit={changePin} className="flex flex-col gap-4">
            <Input
              label="Account password"
              type="password"
              name="currentPassword"
              placeholder="Confirm with your login password"
              value={pinForm.currentPassword}
              onChange={(e) => setPinForm({ ...pinForm, currentPassword: e.target.value })}
              required
            />
            <Input
              label={user?.hasPin ? 'New PIN' : 'New PIN (4 digits)'}
              type="password"
              name="pin"
              placeholder="4 digits"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={pinForm.pin}
              onChange={(e) => setPinForm({ ...pinForm, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
              required
            />
            <Input
              label="Confirm PIN"
              type="password"
              name="confirmPin"
              placeholder="4 digits"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={pinForm.confirmPin}
              onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
              required
            />
            {pinMsg && <p className="text-sm text-success">{pinMsg}</p>}
            {pinErr && <p className="text-sm text-danger">{pinErr}</p>}
            <Button type="submit">{user?.hasPin ? 'Change PIN' : 'Set PIN'}</Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
