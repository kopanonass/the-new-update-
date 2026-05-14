export const authClient = {
  forgetPassword: {
    emailOtp: async ({ email }: { email: string }) => {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) return { error: data.error };
      return { data, error: null };
    }
  },
  resetPassword: async ({ email, otp, newPassword }: any) => {
    const response = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    });
    const data = await response.json();
    if (!response.ok) return { error: data.error };
    return { data, error: null };
  }
};

export async function sendPasswordResetOtp(email: string) {
  const { error } = await authClient.forgetPassword.emailOtp({ email });
  if (error) throw error;
}
