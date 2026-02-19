import { Response } from 'express';
import { FeeInvoice, FeePayment, Discount } from '../models/Fee';
import Student from '../models/Student';
import SchoolConfig from '../models/SchoolConfig';
import { AuthRequest } from '../types';

const generateInvoiceNumber = async (schoolId: string): Promise<string> => {
  const count = await FeeInvoice.countDocuments({ schoolId });
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
};

const generatePaymentNumber = async (schoolId: string): Promise<string> => {
  const count = await FeePayment.countDocuments({ schoolId });
  return `PAY-${String(count + 1).padStart(6, '0')}`;
};

export const generateClassInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  const { class: cls, academicYear, term } = req.body;
  const schoolId = req.user?.schoolId;

  const config = await SchoolConfig.findById(schoolId);
  const students = await Student.find({ schoolId, currentClass: cls, status: 'active' });

  const classItems = config?.feeItems.filter(
    fi => fi.classes.includes(cls) && fi.terms.includes(Number(term))
  ) || [];

  let created = 0;
  for (const student of students) {
    const existing = await FeeInvoice.findOne({ schoolId, studentId: student._id, academicYear, term });
    if (existing) continue;

    const discounts = await Discount.find({
      schoolId,
      studentId: student._id,
      academicYear,
      isActive: true,
      $or: [{ terms: { $in: [Number(term)] } }, { terms: [] }],
    });

    const items = classItems.map(fi => {
      let discount = 0;
      discounts.forEach(d => {
        if (d.applyToItems.length === 0 || d.applyToItems.includes(fi.name)) {
          discount += d.discountType === 'percentage' ? (fi.amount * d.value) / 100 : d.value;
        }
      });
      const net = Math.max(0, fi.amount - discount);
      return { name: fi.name, amount: fi.amount, discount, penalty: 0, net };
    });

    const subtotal = items.reduce((s, i) => s + i.amount, 0);
    const totalDiscount = items.reduce((s, i) => s + i.discount, 0);
    const totalAmount = items.reduce((s, i) => s + i.net, 0);
    const invoiceNumber = await generateInvoiceNumber(schoolId || '');

    await FeeInvoice.create({
      schoolId,
      invoiceNumber,
      studentId: student._id,
      academicYear,
      term: Number(term),
      items,
      subtotal,
      totalDiscount,
      totalPenalty: 0,
      totalAmount,
      amountPaid: 0,
      balance: totalAmount,
      status: 'unpaid',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    created++;
  }

  res.json({ success: true, message: `Generated ${created} invoices` });
};

export const getInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  const { studentId, status, academicYear, term, page = 1, limit = 20 } = req.query;
  const query: Record<string, unknown> = { schoolId: req.user?.schoolId };

  if (studentId) query.studentId = studentId;
  if (status) query.status = status;
  if (academicYear) query.academicYear = academicYear;
  if (term) query.term = Number(term);

  const total = await FeeInvoice.countDocuments(query);
  const invoices = await FeeInvoice.find(query)
    .populate('studentId', 'firstName lastName admissionNumber currentClass')
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.json({ success: true, data: invoices, total });
};

export const recordPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  const { invoiceId, amount, method, reference, notes, paidDate } = req.body;
  const schoolId = req.user?.schoolId;

  const invoice = await FeeInvoice.findOne({ _id: invoiceId, schoolId });
  if (!invoice) { res.status(404).json({ success: false, message: 'Invoice not found' }); return; }

  const paymentNumber = await generatePaymentNumber(schoolId || '');

  await FeePayment.create({
    schoolId,
    invoiceId,
    studentId: invoice.studentId,
    paymentNumber,
    amount,
    method,
    reference,
    paidDate: paidDate || new Date(),
    receivedBy: req.user?.id,
    notes,
  });

  const newAmountPaid = invoice.amountPaid + Number(amount);
  const newBalance = invoice.totalAmount - newAmountPaid;
  const newStatus = newBalance <= 0 ? 'paid' : 'partial';

  await FeeInvoice.findByIdAndUpdate(invoiceId, {
    amountPaid: newAmountPaid,
    balance: Math.max(0, newBalance),
    status: newStatus,
  });

  res.json({ success: true, message: 'Payment recorded', paymentNumber });
};

export const getFeeStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const { academicYear, term } = req.query;
  const schoolId = req.user?.schoolId;
  const mongoose = require('mongoose');

  const matchStage: Record<string, unknown> = { schoolId: new mongoose.Types.ObjectId(schoolId) };
  if (academicYear) matchStage.academicYear = academicYear;
  if (term) matchStage.term = Number(term);

  const [stats, byClass, dailyPayments] = await Promise.all([
    FeeInvoice.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalExpected: { $sum: '$totalAmount' },
          totalCollected: { $sum: '$amountPaid' },
          totalOutstanding: { $sum: '$balance' },
          paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
          partial: { $sum: { $cond: [{ $eq: ['$status', 'partial'] }, 1, 0] } },
          unpaid: { $sum: { $cond: [{ $eq: ['$status', 'unpaid'] }, 1, 0] } },
          total: { $sum: 1 },
        },
      },
    ]),
    FeeInvoice.aggregate([
      { $match: matchStage },
      { $lookup: { from: 'students', localField: 'studentId', foreignField: '_id', as: 'student' } },
      { $unwind: '$student' },
      {
        $group: {
          _id: '$student.currentClass',
          expected: { $sum: '$totalAmount' },
          collected: { $sum: '$amountPaid' },
          outstanding: { $sum: '$balance' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    FeePayment.aggregate([
      { $match: { schoolId: new mongoose.Types.ObjectId(schoolId) } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidDate' } },
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 30 },
    ]),
  ]);

  res.json({ success: true, data: { stats: stats[0] || {}, byClass, dailyPayments } });
};

export const getStudentFeeHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  const { studentId } = req.params;
  
  const invoices = await FeeInvoice.find({ schoolId: req.user?.schoolId, studentId }).sort({ createdAt: -1 });
  const payments = await FeePayment.find({ schoolId: req.user?.schoolId, studentId }).sort({ paidDate: -1 });

  res.json({ success: true, data: { invoices, payments } });
};
