import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendApprovalEmail(user) {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: 'ERP Portal <noreply@erp.com>',
      to: [user.email],
      subject: 'Account Approved! 🎉',
      html: `<p>Hello ${user.name},</p><p>Your volunteer ERP account has been approved by your department officer. You can now log in and access all features.</p>`
    });
  } catch (err) {
    console.error('Failed to send approval email via Resend:', err);
  }
}

export async function sendWarningNoticeEmail(user, reason, warningCount) {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: 'ERP System <alerts@erp.com>',
      to: [user.email],
      subject: 'Official Warning Notice Issued ⚠️',
      html: `<p>Hello ${user.name},</p><p>An official warning notice has been issued for: <strong>${reason}</strong>.</p><p>Total Warning Count: ${warningCount}</p>`
    });
  } catch (err) {
    console.error('Failed to send warning email via Resend:', err);
  }
}
