import mongoose, { Schema, Document } from 'mongoose';
import { FeeStatus, PaymentMethod } from '../types';

export interface IFeeInvoice extends Document {
  schoolId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  studentId: mongoose.Types.ObjectId;
  academicYear: string;
  term: number;
  
  items: {
    name: string;
    amount: number;
    discount: number;
    penalty: number;
    net: number;
  }[];
  
  subtotal: number;
  totalDiscount: number;
  totalPenalty: number;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: FeeStatus;
  
  dueDate: Date;
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeePayment extends Document {
  schoolId: mongoose.Types.ObjectId;
  invoiceId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  paymentNumber: string;
  
  amount: number;
  method: PaymentMethod;
  reference?: string;
  mpesaReceiptNumber?: string;
  bankSlipNumber?: string;
  
  paidDate: Date;
  receivedBy: mongoose.Types.ObjectId;
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface IDiscount extends Document {
  schoolId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  type: string;
  name: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  applyToItems: string[];
  academicYear: string;
  terms: number[];
  isActive: boolean;
  approvedBy: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeeInvoiceSchema = new Schema<IFeeInvoice>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'SchoolConfig', required: true },
    invoiceNumber: { type: String, required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    academicYear: { type: String, required: true },
    term: { type: Number, required: true },
    
    items: [{
      name: String, amount: Number, discount: Number, penalty: Number, net: Number,
    }],
    
    subtotal: { type: Number, required: true },
    totalDiscount: { type: Number, default: 0 },
    totalPenalty: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    balance: { type: Number, required: true },
    status: { type: String, enum: ['paid', 'partial', 'unpaid', 'overdue', 'waived'], default: 'unpaid' },
    
    dueDate: { type: Date, required: true },
    notes: String,
  },
  { timestamps: true }
);

const FeePaymentSchema = new Schema<IFeePayment>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'SchoolConfig', required: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'FeeInvoice', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    paymentNumber: { type: String, required: true },
    
    amount: { type: Number, required: true },
    method: { type: String, enum: ['cash', 'mpesa', 'bank_transfer', 'cheque', 'card'], required: true },
    reference: String,
    mpesaReceiptNumber: String,
    bankSlipNumber: String,
    
    paidDate: { type: Date, required: true },
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: String,
  },
  { timestamps: true }
);

const DiscountSchema = new Schema<IDiscount>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'SchoolConfig', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    type: String,
    name: String,
    discountType: { type: String, enum: ['percentage', 'fixed'] },
    value: Number,
    applyToItems: [String],
    academicYear: String,
    terms: [Number],
    isActive: { type: Boolean, default: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: String,
  },
  { timestamps: true }
);

// Indexes for FeeInvoice
FeeInvoiceSchema.index({ schoolId: 1, invoiceNumber: 1 }, { unique: true });
FeeInvoiceSchema.index({ schoolId: 1, studentId: 1, academicYear: 1, term: 1 });
FeeInvoiceSchema.index({ schoolId: 1, status: 1 });
FeeInvoiceSchema.index({ dueDate: 1 });
FeeInvoiceSchema.index({ schoolId: 1, academicYear: 1, term: 1 });

// Indexes for FeePayment
FeePaymentSchema.index({ schoolId: 1, paymentNumber: 1 }, { unique: true });
FeePaymentSchema.index({ invoiceId: 1 });
FeePaymentSchema.index({ studentId: 1 });
FeePaymentSchema.index({ schoolId: 1, paidDate: 1 });
FeePaymentSchema.index({ schoolId: 1, method: 1 });

// Indexes for Discount
DiscountSchema.index({ schoolId: 1, studentId: 1 });
DiscountSchema.index({ schoolId: 1, isActive: 1 });
DiscountSchema.index({ schoolId: 1, academicYear: 1 });

export const FeeInvoice = mongoose.model<IFeeInvoice>('FeeInvoice', FeeInvoiceSchema);
export const FeePayment = mongoose.model<IFeePayment>('FeePayment', FeePaymentSchema);
export const Discount = mongoose.model<IDiscount>('Discount', DiscountSchema);
