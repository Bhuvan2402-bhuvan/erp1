import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const senderEmail = process.env.GMAIL_USER || process.env.EMAIL_FROM || 'noreply@vvitu-erp.edu.in';

export async function sendAccountCreatedEmail(user) {
  console.log(`[EMAIL DISPATCH] Sending Account Creation Confirmation to Gmail: ${user.email}`);
  if (resend) {
    try {
      await resend.emails.send({
        from: `VVITU NSS ERP <${senderEmail}>`,
        to: [user.email],
        subject: 'Welcome to VVITU NSS ERP - Account Registration Received 🎓',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
            <h2 style="color: #0f172a; border-bottom: 2px solid #0d9488; padding-bottom: 10px;">Welcome to VVITU NSS ERP!</h2>
            <p>Dear <strong>${user.name}</strong>,</p>
            <p>Thank you for registering on the <strong>VVITU NSS Volunteer ERP Portal</strong>.</p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0; font-size: 14px; color: #475569;"><strong>Email:</strong> ${user.email}</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #475569;"><strong>Role:</strong> ${user.role}</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #eab308;"><strong>Status:</strong> Pending Faculty Approval</p>
            </div>
            <p>Your account registration has been submitted and is awaiting approval by your branch Faculty Coordinator.</p>
            <p>You will receive another email confirmation as soon as your account is approved.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #94a3b8;">VVITU NSS Student Activity & Resource Management System</p>
          </div>
        `
      });
    } catch (err) {
      console.error('Failed to send account creation email via Resend:', err);
    }
  } else {
    console.log(`[EMAIL SIMULATION - GMAIL] Confirmation email queued for ${user.email} (Pending Faculty Approval)`);
  }
}

export async function sendApprovalEmail(user) {
  console.log(`[EMAIL DISPATCH] Sending Account Approval Notification to Gmail: ${user.email}`);
  if (resend) {
    try {
      await resend.emails.send({
        from: `VVITU NSS ERP <${senderEmail}>`,
        to: [user.email],
        subject: 'Account Approved! 🎉 Welcome to VVITU NSS Portal',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
            <h2 style="color: #0d9488; border-bottom: 2px solid #0d9488; padding-bottom: 10px;">Account Approved! 🎉</h2>
            <p>Hello <strong>${user.name}</strong>,</p>
            <p>Great news! Your volunteer ERP account has been approved by your department Faculty Officer.</p>
            <p>You can now log in to access event registrations, attendance tracking, digital certificates, and community features.</p>
            <div style="margin: 25px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Log In to ERP Portal &rarr;</a>
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #94a3b8;">VVITU NSS Student Activity & Resource Management System</p>
          </div>
        `
      });
    } catch (err) {
      console.error('Failed to send approval email via Resend:', err);
    }
  } else {
    console.log(`[EMAIL SIMULATION - GMAIL] Approval confirmation email delivered to ${user.email}`);
  }
}

export async function sendWarningNoticeEmail(user, reason, warningCount) {
  console.log(`[EMAIL DISPATCH] Sending Warning Notice to Gmail: ${user.email}`);
  if (resend) {
    try {
      await resend.emails.send({
        from: `VVITU NSS ERP <${senderEmail}>`,
        to: [user.email],
        subject: 'Official Warning Notice Issued ⚠️',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fee2e2; rounded: 12px; background-color: #fff5f5;">
            <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">Official Warning Notice</h2>
            <p>Hello <strong>${user.name}</strong>,</p>
            <p>An official warning notice has been issued for your profile due to: <strong>${reason}</strong>.</p>
            <p><strong>Total Warning Count:</strong> ${warningCount}</p>
            <p style="font-size: 13px; color: #7f1d1d;">Please contact your branch coordinator if you have questions regarding this log.</p>
          </div>
        `
      });
    } catch (err) {
      console.error('Failed to send warning email via Resend:', err);
    }
  } else {
    console.log(`[EMAIL SIMULATION - GMAIL] Warning notice email sent to ${user.email}`);
  }
}

