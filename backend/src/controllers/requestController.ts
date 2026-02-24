import { Response } from 'express';
import { Request, LeaveBalance, ApproverSetting, RequestTypeConfig } from '../models/Request';
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

    // Check leave balance if it's a leave request
    if (requestType === 'leave' && leaveType && totalDays > 0) {
      const academicYear = new Date().getFullYear().toString();
      const leaveBalance = await LeaveBalance.findOne({
        schoolId,
        staffId: subjectId,
        academicYear,
      });

      if (leaveBalance) {
        const balanceKey = leaveType as keyof typeof leaveBalance;
        const balance = leaveBalance[balanceKey] as any;
        
        if (balance && balance.remaining < totalDays) {
          res.status(400).json({ 
            success: false, 
            message: `Insufficient ${leaveType} leave balance. Available: ${balance.remaining} days, Requested: ${totalDays} days` 
          });
          return;
        }
      }
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

    // Can't review already reviewed/cancelled requests
    if (request.status !== 'pending') {
      res.status(400).json({ 
        success: false, 
        message: `Cannot review a request that is already ${request.status}` 
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

// Withdraw/cancel own request
export const withdrawRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const request = await Request.findById(id);
    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    // Check if user is the requester
    if (request.requestedBy.toString() !== userId) {
      res.status(403).json({ 
        success: false, 
        message: 'You can only withdraw your own requests' 
      });
      return;
    }

    // Can only withdraw pending requests
    if (request.status !== 'pending') {
      res.status(400).json({ 
        success: false, 
        message: `Cannot withdraw a request that is already ${request.status}` 
      });
      return;
    }

    // Update request status to cancelled
    request.status = 'cancelled';
    await request.save();

    // Send email notification to approver
    try {
      const approver = await User.findById(request.approverId);
      if (approver && approver.email) {
        await sendEmail({
          to: approver.email,
          subject: `Request withdrawn: ${request.title}`,
          html: `
            <h2>Request Withdrawn</h2>
            <p><strong>Title:</strong> ${request.title}</p>
            <p><strong>Type:</strong> ${request.requestType}</p>
            <p><strong>Requested by:</strong> ${request.requestedByName}</p>
            <p>This request has been withdrawn by the requester.</p>
          `,
        });
      }
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
    }

    res.json({ 
      success: true, 
      data: request,
      message: 'Request withdrawn successfully' 
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

// Get my approver (for current user)
export const getMyApprover = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schoolId = req.user?.schoolId;
    const userId = req.user?.id;
    const { requestType } = req.query;

    // Find staff profile
    const staff = await Staff.findOne({ userId, schoolId });
    if (!staff) {
      res.status(404).json({ success: false, message: 'Staff profile not found' });
      return;
    }

    // Find approver setting for this staff member
    const approverSetting = await ApproverSetting.findOne({
      schoolId,
      subjectId: staff._id,
      $or: [
        { requestType: requestType || 'all' },
        { requestType: 'all' }
      ],
      isActive: true,
    }).sort({ createdAt: -1 }); // Get most recent if multiple

    if (approverSetting) {
      const approver = await User.findById(approverSetting.approverId);
      res.json({ 
        success: true, 
        data: {
          approverId: approverSetting.approverId,
          approverName: approverSetting.approverName,
          approverEmail: approver?.email,
          requestType: approverSetting.requestType,
        }
      });
    } else {
      // Default to principal
      const principal = await User.findOne({ 
        schoolId, 
        role: { $in: ['principal', 'super_admin'] } 
      });
      
      if (principal) {
        res.json({ 
          success: true, 
          data: {
            approverId: principal._id,
            approverName: `${principal.firstName} ${principal.lastName}`,
            approverEmail: principal.email,
            requestType: 'all',
            isDefault: true,
          }
        });
      } else {
        res.status(404).json({ success: false, message: 'No approver found' });
      }
    }
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

// ========== REQUEST TYPE CONFIGURATION ==========

// Get all request type configurations
export const getRequestTypeConfigs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schoolId = req.user?.schoolId;
    const { category, isActive } = req.query;

    const query: any = { schoolId };
    
    if (category) {
      query.category = category;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const configs = await RequestTypeConfig.find(query).sort({ category: 1, name: 1 });

    res.json({ success: true, data: configs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single request type configuration
export const getRequestTypeConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const config = await RequestTypeConfig.findById(id);

    if (!config) {
      res.status(404).json({ success: false, message: 'Configuration not found' });
      return;
    }

    res.json({ success: true, data: config });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create request type configuration
export const createRequestTypeConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schoolId = req.user?.schoolId;
    const configData = { ...req.body, schoolId };

    // Check if code already exists for this school
    const existing = await RequestTypeConfig.findOne({
      schoolId,
      code: configData.code,
    });

    if (existing) {
      res.status(400).json({ 
        success: false, 
        message: `A request type with code '${configData.code}' already exists` 
      });
      return;
    }

    const config = await RequestTypeConfig.create(configData);

    res.status(201).json({ 
      success: true, 
      data: config,
      message: 'Request type configuration created successfully' 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update request type configuration
export const updateRequestTypeConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const config = await RequestTypeConfig.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!config) {
      res.status(404).json({ success: false, message: 'Configuration not found' });
      return;
    }

    res.json({ 
      success: true, 
      data: config,
      message: 'Request type configuration updated successfully' 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete request type configuration
export const deleteRequestTypeConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const config = await RequestTypeConfig.findByIdAndDelete(id);

    if (!config) {
      res.status(404).json({ success: false, message: 'Configuration not found' });
      return;
    }

    res.json({ 
      success: true, 
      message: 'Request type configuration deleted successfully' 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Check eligibility for a request type
export const checkRequestEligibility = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { configId } = req.params;
    const userId = req.user?.id;
    const schoolId = req.user?.schoolId;
    const userRole = req.user?.role;

    const config = await RequestTypeConfig.findById(configId);
    
    if (!config) {
      res.status(404).json({ success: false, message: 'Configuration not found' });
      return;
    }

    const errors: string[] = [];

    // Check role eligibility
    if (config.eligibleRoles.length > 0 && !config.eligibleRoles.includes(userRole || '')) {
      errors.push(`Your role (${userRole}) is not eligible for this request type`);
    }

    // Check service duration (if staff)
    if (config.minimumServiceMonths > 0) {
      const staff = await Staff.findOne({ userId, schoolId });
      
      if (staff && staff.employmentDate) {
        const monthsOfService = Math.floor(
          (new Date().getTime() - new Date(staff.employmentDate).getTime()) / 
          (1000 * 60 * 60 * 24 * 30)
        );
        
        if (monthsOfService < config.minimumServiceMonths) {
          errors.push(
            `Minimum service requirement: ${config.minimumServiceMonths} months. ` +
            `You have: ${monthsOfService} months`
          );
        }
      }
    }

    // Check probation completion (assuming standard 6-month probation period)
    if (config.requiresProbationCompletion) {
      const staff = await Staff.findOne({ userId, schoolId });
      
      if (staff && staff.employmentDate) {
        // Calculate probation end date (6 months from employment date)
        const probationEndDate = new Date(staff.employmentDate);
        probationEndDate.setMonth(probationEndDate.getMonth() + 6);
        
        const isProbationComplete = new Date() > probationEndDate;
        
        if (!isProbationComplete) {
          errors.push(
            `Probation must be completed. Probation ends on: ` +
            `${probationEndDate.toLocaleDateString()}`
          );
        }
      }
    }

    const isEligible = errors.length === 0;

    res.json({ 
      success: true, 
      data: {
        isEligible,
        config: {
          code: config.code,
          name: config.name,
          category: config.category,
        },
        errors: isEligible ? [] : errors,
        requirements: {
          eligibleRoles: config.eligibleRoles,
          minimumServiceMonths: config.minimumServiceMonths,
          requiresProbationCompletion: config.requiresProbationCompletion,
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
