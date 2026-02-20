import { Response } from 'express';
import { Request, LeaveBalance, ApproverSetting } from '../models/Request';
import Staff from '../models/Staff';
import Student from '../models/Student';
import Parent from '../models/Parent';
import User from '../models/User';
import { AuthRequest } from '../types';
import { sendEmail } from '../services/emailService';

// Create a new request
export const createRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      requestType,
      requestFor,
      subjectId,
      title,
      description,
      startDate,
      endDate,
      leaveType,
      medicalReason,
      symptoms,
      priority,
      substituteTeacher,
    } = req.body;

    const schoolId = req.user?.schoolId;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Get user profile
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    let requestedByModel = 'Staff';
    let requestedByName = `${currentUser.firstName} ${currentUser.lastName}`;
    
    if (userRole === 'parent') {
      requestedByModel = 'Parent';
      const parent = await Parent.findOne({ userId, schoolId });
      if (parent) {
        requestedByName = `${parent.firstName} ${parent.lastName}`;
      }
    }

    // Get subject details
    let subjectModel = 'Staff';
    let subjectName = '';
    
    if (requestFor === 'student') {
      subjectModel = 'Student';
      const student = await Student.findById(subjectId);
      if (!student) {
        res.status(404).json({ success: false, message: 'Student not found' });
        return;
      }
      subjectName = `${student.firstName} ${student.lastName}`;
    } else {
      const staff = await Staff.findOne({ userId, schoolId });
      if (!staff) {
        res.status(404).json({ success: false, message: 'Staff profile not found' });
        return;
      }
      subjectModel = 'Staff';
      subjectName = `${staff.firstName} ${staff.lastName}`;
    }

    // Find approver
    const approverSetting = await ApproverSetting.findOne({
      schoolId,
      subjectId,
      $or: [{ requestType }, { requestType: 'all' }],
      isActive: true,
    });

    let approverId = approverSetting?.approverId;
    let approverName = approverSetting?.approverName || 'Principal';

    // Default to principal if no approver set
    if (!approverId) {
      const principal = await User.findOne({ 
        schoolId, 
        role: { $in: ['principal', 'super_admin'] } 
      });
      if (principal) {
        approverId = principal._id;
        approverName = `${principal.firstName} ${principal.lastName}`;
      }
    }

    // Calculate total days for leave
    let totalDays = 0;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }

    // Create request
    const request = await Request.create({
      schoolId,
      requestType,
      requestFor,
      requestedBy: userId,
      requestedByModel,
      requestedByName,
      subjectId,
      subjectModel,
      subjectName,
      title,
      description,
      startDate,
      endDate,
      totalDays,
      leaveType,
      medicalReason,
      symptoms,
      priority: priority || 'medium',
      approverId,
      approverName,
      substituteTeacher,
    });

    // Send email notification to approver
    try {
      const approver = await User.findById(approverId);
      if (approver && approver.email) {
        await sendEmail({
          to: approver.email,
          subject: `New ${requestType} request from ${requestedByName}`,
          html: `
            <h2>New Request Pending Approval</h2>
            <p><strong>Type:</strong> ${requestType}</p>
            <p><strong>From:</strong> ${requestedByName}</p>
            <p><strong>For:</strong> ${subjectName}</p>
            <p><strong>Title:</strong> ${title}</p>
            <p><strong>Description:</strong> ${description}</p>
            ${startDate ? `<p><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</p>` : ''}
            ${endDate ? `<p><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString()}</p>` : ''}
            <p>Please log in to review and approve/reject this request.</p>
          `,
        });
      }
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
    }

    res.status(201).json({
      success: true,
      data: request,
      message: 'Request submitted successfully',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get requests (filtered by role and permissions)
export const getRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, type, view } = req.query;
    const schoolId = req.user?.schoolId;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const query: any = { schoolId };

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filter by type
    if (type && type !== 'all') {
      query.requestType = type;
    }

    // Role-based filtering
    const isAdmin = ['principal', 'super_admin', 'deputy_principal'].includes(userRole || '');
    
    if (!isAdmin) {
      // Non-admins only see their own requests or requests they need to approve
      query.$or = [
        { requestedBy: userId },
        { subjectId: userId },
        { approverId: userId },
      ];
    }

    // History vs pending
    if (view === 'pending') {
      query.status = 'pending';
    } else if (view === 'history') {
      query.status = { $in: ['approved', 'rejected', 'cancelled'] };
    }

    const requests = await Request.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: requests });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get my requests only
export const getMyRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const schoolId = req.user?.schoolId;
    const userId = req.user?.id;

    const query: any = {
      schoolId,
      requestedBy: userId,
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    const requests = await Request.find(query).sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve or reject request
export const reviewRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, reviewComments } = req.body;
    const userId = req.user?.id;

    const request = await Request.findById(id);
    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    // Check if user is the approver
    if (request.approverId.toString() !== userId) {
      res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to review this request' 
      });
      return;
    }

    // Update request
    request.status = status;
    request.reviewedAt = new Date();
    request.reviewComments = reviewComments;
    await request.save();

    // Update leave balance if it's a leave request and approved
    if (status === 'approved' && request.requestType === 'leave' && request.leaveType) {
      const academicYear = new Date().getFullYear().toString();
      const leaveBalance = await LeaveBalance.findOne({
        schoolId: request.schoolId,
        staffId: request.subjectId,
        academicYear,
      });

      if (leaveBalance && request.totalDays) {
        const leaveTypeKey = request.leaveType as keyof typeof leaveBalance;
        if (leaveBalance[leaveTypeKey]) {
          (leaveBalance[leaveTypeKey] as any).used += request.totalDays;
          (leaveBalance[leaveTypeKey] as any).remaining -= request.totalDays;
          await leaveBalance.save();
        }
      }
    }

    // Send email notification to requester
    try {
      const requester = await User.findById(request.requestedBy);
      if (requester && requester.email) {
        const reviewer = await User.findById(req.user?.id);
        const reviewerName = reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : 'Administrator';

        await sendEmail({
          to: requester.email,
          subject: `Request ${status}: ${request.title}`,
          html: `
            <h2>Request ${status === 'approved' ? 'Approved' : 'Rejected'}</h2>
            <p><strong>Title:</strong> ${request.title}</p>
            <p><strong>Type:</strong> ${request.requestType}</p>
            <p><strong>Status:</strong> ${status}</p>
            ${reviewComments ? `<p><strong>Comments:</strong> ${reviewComments}</p>` : ''}
            <p><strong>Reviewed by:</strong> ${reviewerName}</p>
          `,
        });
      }
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
    }

    res.json({ 
      success: true, 
      data: request,
      message: `Request ${status} successfully` 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get leave balance
export const getLeaveBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schoolId = req.user?.schoolId;
    const userId = req.user?.id;
    const academicYear = new Date().getFullYear().toString();

    // Find staff
    const staff = await Staff.findOne({ userId, schoolId });
    if (!staff) {
      res.status(404).json({ success: false, message: 'Staff profile not found' });
      return;
    }

    // Get or create leave balance
    let balance = await LeaveBalance.findOne({
      schoolId,
      staffId: staff._id,
      academicYear,
    });

    if (!balance) {
      balance = await LeaveBalance.create({
        schoolId,
        staffId: staff._id,
        academicYear,
      });
    }

    res.json({ success: true, data: balance });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Manage approver settings
export const getApproverSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schoolId = req.user?.schoolId;

    const settings = await ApproverSetting.find({ schoolId, isActive: true });

    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const setApprover = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subjectId, subjectModel, requestType, approverId } = req.body;
    const schoolId = req.user?.schoolId;

    // Get names
    let subjectName = '';
    if (subjectModel === 'Staff') {
      const staff = await Staff.findById(subjectId);
      subjectName = staff ? `${staff.firstName} ${staff.lastName}` : '';
    } else {
      const student = await Student.findById(subjectId);
      subjectName = student ? `${student.firstName} ${student.lastName}` : '';
    }

    const approver = await User.findById(approverId);
    const approverName = approver ? `${approver.firstName} ${approver.lastName}` : '';

    // Deactivate existing settings
    await ApproverSetting.updateMany(
      { schoolId, subjectId, requestType },
      { isActive: false }
    );

    // Create new setting
    const setting = await ApproverSetting.create({
      schoolId,
      subjectId,
      subjectModel,
      subjectName,
      requestType,
      approverId,
      approverName,
    });

    res.status(201).json({ success: true, data: setting });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
