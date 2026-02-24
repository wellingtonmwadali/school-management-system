'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Eye, EyeOff, Loader2, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import schoolLogo from '../../../assets/ghs.jpg';

export default function LoginPage() {
  const [email, setEmail] = useState('principal@greenfield.ac.ke');
  const [password, setPassword] = useState('Admin1234');
  const [showPass, setShowPass] = useState(false);
  const { login, isLoading } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      toast({ title: 'Login Failed', description: message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <GraduationCap size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Green Field School</h1>
                <p className="text-sm text-slate-500">Management System</p>
              </div>
            </div>
          </div>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-slate-900 text-2xl font-bold">Welcome back</CardTitle>
              <CardDescription className="text-slate-500">Sign in to access your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your.email@school.ac.ke"
                    className="h-11 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="h-11 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 focus-visible:border-blue-500 pr-10"
                      required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-11 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg shadow-blue-500/30" disabled={isLoading}>
                  {isLoading ? <><Loader2 size={18} className="mr-2 animate-spin" /> Signing in...</> : 'Sign In'}
                </Button>
              </form>

              <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-600 font-semibold mb-2">Demo Credentials:</p>
                <div className="space-y-1.5 text-xs text-slate-500">
                  <p className="font-medium">👨‍💼 Principal: <span className="text-slate-700">principal@greenfield.ac.ke / Admin1234</span></p>
                  <p className="font-medium">💰 Finance: <span className="text-slate-700">finance@greenfield.ac.ke / Finance1234</span></p>
                  <p className="font-medium">👨‍🏫 Teacher: <span className="text-slate-700">peter@greenfield.ac.ke / Teacher1234</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 items-center justify-center p-8 relative overflow-hidden">
        {/* Gradient Circles Background */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 text-center max-w-lg">
          {/* School Logo */}
          <div className="mb-8 flex justify-center">
            <div className="relative w-32 h-32 rounded-3xl shadow-2xl overflow-hidden ring-4 ring-white/50">
              <Image 
                src={schoolLogo}
                alt="Green Field School" 
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold text-slate-800 mb-4 leading-tight">
            Green Field
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              School
            </span>
          </h1>

          {/* Description */}
         <p className="text-lg text-slate-600 mb-8 leading-relaxed">
  Empowering educators to focus on what matters most — 
  <span className="font-semibold text-slate-700"> teaching and nurturing students</span>.
  <br />
  Automate admin work, unlock insights, and create a seamless experience for everyone.
</p>

          {/* Play Button - Intro Video */}
          {/* <button className="group inline-flex items-center gap-3 px-6 py-3 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play size={20} className="text-white fill-white ml-1" />
            </div>
            <span className="text-slate-700 font-semibold">Watch Introduction</span>
          </button> */}

          {/* Feature Pills */}
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {['Student Management', 'Staff Portal', 'Finance Tracking', 'Attendance Tracking', 'Timetable Management','Exams Management','Medical Records', 'Library Management', 'Discipline Management','Counseling Management','Academic Reports'].map((feature) => (
              <div key={feature} className="px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full text-sm font-medium text-slate-700 shadow-sm">
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
