import { z } from 'zod';

const secureUrl = (message = 'Invalid URL', maxLength = 2048) =>
  z.string()
    .max(maxLength, `URL exceeds maximum length of ${maxLength} characters`)
    .url(message)
    .refine(
      (val) => val.startsWith('http://') || val.startsWith('https://'),
      { message: 'URL must start with http:// or https://' }
    );

// ─── Helpers ────────────────────────────────────────────────

/**
 * Validate data against a Zod schema.
 * Returns { success, data, error } where error is a human-readable string.
 */
export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data, error: null };
  }
  const messages = result.error.issues.map(
    (i) => `${i.path.join('.')}: ${i.message}`
  );
  return { success: false, data: null, error: messages.join('; ') };
}

// ─── Auth / Profile Onboarding Base ───────────────────────────

const baseProfileFields = {
  role: z.enum(['STUDENT', 'FACULTY'], {
    errorMap: () => ({ message: 'Role must be STUDENT or FACULTY' }),
  }),
  departmentId: z.string().uuid('Invalid department ID'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional().nullable(),
  rollNo: z.string().optional(),
  year: z.union([z.string(), z.number()]).optional(),
  section: z.string().optional(),
  semester: z.union([z.string(), z.number()]).optional(),
  employeeId: z.string().optional(),
  designation: z.string().optional(),
};

const refineProfile = (schema) => schema
  .refine(
    (data) => {
      if (data.role === 'STUDENT') {
        return !!data.rollNo && !!data.year && !!data.section;
      }
      return true;
    },
    { message: 'Roll No, Year, and Section are required for students', path: ['rollNo'] }
  )
  .refine(
    (data) => {
      if (data.role === 'FACULTY') {
        return !!data.employeeId;
      }
      return true;
    },
    { message: 'Employee ID is required for faculty', path: ['employeeId'] }
  );

export const onboardingSchema = refineProfile(z.object(baseProfileFields));

export const signupSchema = refineProfile(
  z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    // Allow client-created Supabase UID to be passed to avoid duplicate auth accounts
    firebaseUid: z.string().optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    ...baseProfileFields
  })
);

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
});

// ─── Event Schemas ──────────────────────────────────────────

const eventTypes = ['ACTIVITY', 'CAMP', 'WORKSHOP', 'RALLY', 'AWARENESS'];
const eventStatuses = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'];

export const createEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(5000).optional().nullable(),
  date: z.string().min(1, 'Date is required'),
  endDate: z.string().optional().nullable(),
  location: z.string().max(500).optional().nullable(),
  type: z.enum(eventTypes).optional().default('ACTIVITY'),
});

export const updateEventSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  date: z.string().optional(),
  endDate: z.string().optional().nullable(),
  location: z.string().max(500).optional().nullable(),
  type: z.enum(eventTypes).optional(),
  status: z.enum(eventStatuses).optional(),
});

// ─── Issue Schemas ──────────────────────────────────────────

export const createIssueSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
});

export const updateIssueSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
});

// ─── Certificate Schemas ────────────────────────────────────

export const createCertificateSchema = z.object({
  title: z.string().min(2, 'Title is required').max(200),
  description: z.string().max(2000).optional().nullable(),
  fileUrl: secureUrl('Invalid file URL'),
});

// ─── Chat / Message Schemas ─────────────────────────────────

export const sendMessageSchema = z.object({
  receiverId: z.string().uuid('Invalid receiver ID'),
  content: z.string().min(1, 'Message cannot be empty').max(5000),
});

export const publicMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000),
});

const flexUrlOrData = (message = 'Invalid URL', maxLength = 500000) =>
  z.string()
    .max(maxLength, `Image data exceeds maximum size limit`)
    .refine(
      (val) => !val || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image/'),
      { message: 'URL must start with http://, https://, or be a valid uploaded image' }
    );

// ─── Profile Schemas ────────────────────────────────────────

export const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  avatarUrl: flexUrlOrData('Invalid avatar URL', 500000).optional().nullable().or(z.literal('')),
  myBharatId: z.string().max(100).optional().nullable(),
  myBharatCertUrl: flexUrlOrData('Invalid certificate URL', 500000).optional().nullable().or(z.literal('')),
});

// ─── Department Schemas ─────────────────────────────────────

export const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Name is required').max(200),
  code: z.string().min(1, 'Code is required').max(20),
});

// ─── User Management Schemas ────────────────────────────────

export const updateUserSchema = z.object({
  approvalStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  isBlocked: z.boolean().optional(),
  departmentId: z.string().uuid().optional(),
  mentorId: z.string().optional(),
  isCoordinator: z.boolean().optional(),
  facultyDepartmentId: z.string().uuid().optional(),
});

// ─── Attendance Schema ──────────────────────────────────────

export const markAttendanceSchema = z.object({
  attendances: z.array(
    z.object({
      studentId: z.string().uuid('Invalid student ID'),
      present: z.boolean(),
    })
  ).min(1, 'At least one attendance record is required'),
});

// ─── Photo Schema ───────────────────────────────────────────

export const eventPhotoSchema = z.object({
  url: flexUrlOrData('Invalid photo URL or image data', 500000),
  caption: z.string().max(500).optional().nullable(),
});

// ─── Finance Schema ─────────────────────────────────────────

export const createFinanceSchema = z.object({
  title: z.string().min(2, 'Title is required').max(200),
  amount: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num) || !isFinite(num)) throw new Error('Invalid amount');
    return num;
  }).pipe(z.number().positive('Amount must be positive').max(99_999_999, 'Amount exceeds maximum')),
  type: z.enum(['INCOME', 'EXPENSE', 'BUDGET'], { errorMap: () => ({ message: 'Type must be INCOME, EXPENSE, or BUDGET' }) }),
  category: z.string().min(1, 'Category is required').max(100),
  description: z.string().max(2000).optional().nullable(),
  receiptUrl: secureUrl('Invalid receipt URL', 2048).optional().nullable(),
  departmentId: z.string().optional().nullable(),
});

// ─── Documentation Schema ───────────────────────────────────

export const createDocumentationSchema = z.object({
  title: z.string().min(2, 'Title is required').max(200),
  category: z.enum(['REPORT', 'CIRCULAR', 'GUIDELINE', 'ARCHIVE'], {
    errorMap: () => ({ message: 'Category must be REPORT, CIRCULAR, GUIDELINE, or ARCHIVE' }),
  }),
  description: z.string().max(2000).optional().nullable(),
  fileUrl: secureUrl('Invalid file URL', 2048),
});

// ─── Points Schema ──────────────────────────────────────────

export const awardPointsSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  points: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    if (isNaN(num)) throw new Error('Invalid points value');
    return num;
  }).pipe(z.number().int().positive('Points must be positive').max(1000, 'Maximum 1000 points per award')),
  reason: z.string().min(3, 'Reason must be at least 3 characters').max(500),
});

// ─── Warning Schema ─────────────────────────────────────────

export const issueWarningSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  reason: z.string().min(3, 'Reason must be at least 3 characters').max(1000),
  proofUrl: secureUrl('Invalid proof URL', 2048).optional().nullable(),
});

// ─── Testimonial Schema ──────────────────────────────────────

export const testimonialSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  role: z.string().min(2, 'Role is required').max(100),
  dept: z.string().min(2, 'Department is required').max(100),
  quote: z.string().min(10, 'Quote must be at least 10 characters').max(2000),
  avatar: z.string().min(1, 'Avatar or initials are required').max(500),
  isVisible: z.boolean().optional(),
  sortOrder: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === undefined) return 0;
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    return isNaN(num) ? 0 : num;
  }),
});

// ─── Backward Compatibility Aliases ─────────────────────────

export {
  createCertificateSchema as certificateSchema,
  sendMessageSchema as chatMessageSchema,
  createDocumentationSchema as documentationSchema,
  createFinanceSchema as financeRecordSchema,
  createIssueSchema as issueSchema,
  issueWarningSchema as warningSchema,
};
