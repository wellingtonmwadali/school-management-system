import mongoose, { Schema, Document } from 'mongoose';

export interface IParent extends Document {
  schoolId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  
  idNumber: string;
  occupation?: string;
  workplace?: string;
  
  residentialAddress: string;
  postalAddress?: string;
  
  // Children
  children: mongoose.Types.ObjectId[]; // Student IDs
  
  // Relationship
  relationship: 'father' | 'mother' | 'guardian' | 'other';
  relationshipDetails?: string;
  
  // Emergency contact
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  
  // Status
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const ParentSchema = new Schema<IParent>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'SchoolConfig', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    alternatePhone: String,
    
    idNumber: { type: String, required: true },
    occupation: String,
    workplace: String,
    
    residentialAddress: { type: String, required: true },
    postalAddress: String,
    
    children: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
    
    relationship: { 
      type: String, 
      enum: ['father', 'mother', 'guardian', 'other'], 
      required: true 
    },
    relationshipDetails: String,
    
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },
    
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ParentSchema.index({ schoolId: 1, email: 1 }, { unique: true });
ParentSchema.index({ schoolId: 1, idNumber: 1 }, { unique: true });
ParentSchema.index({ children: 1 });

export default mongoose.models.Parent || mongoose.model<IParent>('Parent', ParentSchema);
