'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Lock, Edit2, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileForm, setProfileForm] = useState<any>({});

  // Fetch profile data based on user role
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      if (user?.profileId && user?.profileModel) {
        const endpoint = user.profileModel === 'Staff' ? `/staff` : `/students`;
        const res = await api.get(endpoint);
        const allProfiles = res.data.data;
        // Find the profile that matches the user's profileId
        return allProfiles?.find((p: any) => p._id === user.profileId) || null;
      }
      return null;
    },
  });

  useEffect(() => {
    if (profile) {
      setProfileForm(profile);
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = user?.profileModel === 'Staff' ? `/staff/${profile._id}` : `/students/${profile._id}`;
      return api.put(endpoint, data);
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Profile updated successfully' });
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.message || 'Failed to update profile', 
        variant: 'destructive' 
      });
    },
  });

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({ title: 'Error', description: 'Password must be at least 8 characters', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      toast({ title: 'Success', description: 'Password changed successfully' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to change password', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileForm);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">Manage your account and personal information</p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="details">Personal Details</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input value={user?.firstName || ''} disabled />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input value={user?.lastName || ''} disabled />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled />
              </div>
              <div>
                <Label>Role</Label>
                <Input value={user?.role?.replace(/_/g, ' ') || ''} disabled className="capitalize" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    {isEditing ? 'Edit your personal details' : 'View your personal details'}
                  </CardDescription>
                </div>
                <Button
                  variant={isEditing ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                >
                  {isEditing ? 'Cancel' : <><Edit2 size={16} className="mr-2" /> Edit</>}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>First Name</Label>
                      <Input
                        value={profileForm.firstName || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <Input
                        value={profileForm.lastName || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={profileForm.phone || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        value={profileForm.email || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  {user?.profileModel === 'Staff' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Department</Label>
                          <Input
                            value={profileForm.department || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                            disabled={!isEditing}
                          />
                        </div>
                        <div>
                          <Label>Designation</Label>
                          <Input
                            value={profileForm.designation || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Subjects</Label>
                        <Input
                          value={profileForm.subjects?.join(', ') || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, subjects: e.target.value.split(', ') })}
                          disabled={!isEditing}
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <Label>Residential Address</Label>
                    <Textarea
                      rows={2}
                      value={profileForm.residentialAddress || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, residentialAddress: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>

                  {profileForm.emergencyContact && (
                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-3">Emergency Contact</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Name</Label>
                          <Input
                            value={profileForm.emergencyContact?.name || ''}
                            onChange={(e) => setProfileForm({
                              ...profileForm,
                              emergencyContact: { ...profileForm.emergencyContact, name: e.target.value }
                            })}
                            disabled={!isEditing}
                          />
                        </div>
                        <div>
                          <Label>Relationship</Label>
                          <Input
                            value={profileForm.emergencyContact?.relationship || ''}
                            onChange={(e) => setProfileForm({
                              ...profileForm,
                              emergencyContact: { ...profileForm.emergencyContact, relationship: e.target.value }
                            })}
                            disabled={!isEditing}
                          />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input
                            value={profileForm.emergencyContact?.phone || ''}
                            onChange={(e) => setProfileForm({
                              ...profileForm,
                              emergencyContact: { ...profileForm.emergencyContact, phone: e.target.value }
                            })}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {isEditing && (
                    <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                      ) : (
                        <><Save size={16} className="mr-2" /> Save Changes</>
                      )}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Current Password</Label>
                <Input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                />
              </div>
              <div>
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />
              </div>
              <Button onClick={handlePasswordChange} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Change Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
