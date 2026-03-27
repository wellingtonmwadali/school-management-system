'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  GraduationCap,
  Users,
  BookOpen,
  ClipboardCheck,
  DollarSign,
  BarChart3,
  Shield,
  Clock,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  Star,
  Menu,
  X,
  CalendarDays,
  Bell,
  FileText,
  Smartphone,
  Zap,
  TrendingUp,
  Lock,
  Globe,
  HeartHandshake,
  MessageSquare,
} from 'lucide-react';
import schoolLogo from '../../assets/ghs.jpg';

/* ───────────────────────── Hook: animate on scroll ───────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ───────────────────────── Reusable Section Wrapper ──────────────────────── */
function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const { ref, visible } = useInView();
  return (
    <section
      id={id}
      ref={ref}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </section>
  );
}

/* ───────────────────────── FAQ Accordion Item ────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="font-semibold text-slate-900 pr-4">{q}</span>
        <ChevronDown className={`shrink-0 h-5 w-5 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-slate-600 leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Counter animation ─────────────────────────────── */
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useInView();
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const duration = 1500;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [visible, target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

/* ════════════════════════════════════════════════════════════════════════════ */
/*                              LANDING PAGE                                  */
/* ════════════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const [mobileNav, setMobileNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      {/* ─────────────────── NAVBAR ─────────────────── */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md">
              <Image src={schoolLogo} alt="Green Field School" fill className="object-cover" />
            </div>
            <span className="text-lg font-bold text-slate-900">Green Field <span className="text-blue-600">SMS</span></span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-blue-600 transition-colors">FAQ</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/25"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2" onClick={() => setMobileNav(!mobileNav)}>
            {mobileNav ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileNav && (
          <div className="md:hidden bg-white border-t border-slate-100 px-6 pb-6 pt-2 space-y-4">
            <a href="#features" onClick={() => setMobileNav(false)} className="block text-slate-700 font-medium">Features</a>
            <a href="#how-it-works" onClick={() => setMobileNav(false)} className="block text-slate-700 font-medium">How It Works</a>
            <a href="#pricing" onClick={() => setMobileNav(false)} className="block text-slate-700 font-medium">Pricing</a>
            <a href="#faq" onClick={() => setMobileNav(false)} className="block text-slate-700 font-medium">FAQ</a>
            <div className="pt-2 flex flex-col gap-2">
              <Link href="/login" className="text-center py-2.5 rounded-lg border border-slate-300 font-medium text-slate-700">
                Sign In
              </Link>
              <Link href="/login" className="text-center py-2.5 rounded-lg bg-blue-600 text-white font-semibold shadow-md">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ─────────────────── HERO ─────────────────── */}
      <header className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/60 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-100/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left copy */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-6 border border-blue-100">
                <Zap className="h-3.5 w-3.5" /> Trusted by Schools Across Kenya
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-slate-900">
                Run Your Entire School{' '}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  From One System
                </span>
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-lg">
                Green Field School Management System replaces spreadsheets, paper registers, and scattered records 
                with a single, powerful platform — so your staff can focus on education, not admin.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-7 py-3.5 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5"
                >
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 px-7 py-3.5 text-base font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                  See Features
                </a>
              </div>

              {/* Quick trust */}
              <div className="mt-10 flex items-center gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> Starting from $500</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> One-time payment</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> Lifetime access</span>
              </div>
            </div>

            {/* Right — Dashboard mockup */}
            <div className="relative hidden lg:block">
              <div className="relative bg-white rounded-2xl shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
                {/* Fake browser bar */}
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 text-center">
                    <div className="inline-block px-4 py-1 bg-white rounded-md text-xs text-slate-400 border border-slate-200">
                      greenfield.school/dashboard
                    </div>
                  </div>
                </div>
                {/* Dashboard preview content */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">Welcome back</p>
                      <p className="font-bold text-slate-900">Principal Dashboard</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><Bell className="h-4 w-4 text-blue-600" /></div>
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><Users className="h-4 w-4 text-slate-600" /></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Students', value: '1,247', color: 'bg-blue-500', icon: Users },
                      { label: 'Attendance', value: '94.2%', color: 'bg-green-500', icon: ClipboardCheck },
                      { label: 'Collections', value: 'KES 2.4M', color: 'bg-purple-500', icon: DollarSign },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl bg-slate-50 p-3">
                        <div className={`w-7 h-7 rounded-lg ${s.color} flex items-center justify-center mb-2`}>
                          <s.icon className="h-3.5 w-3.5 text-white" />
                        </div>
                        <p className="text-lg font-bold text-slate-900">{s.value}</p>
                        <p className="text-xs text-slate-500">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Term 2 Exam Results</p>
                      <p className="text-xs text-slate-500 mt-0.5">Released 2 hours ago</p>
                    </div>
                    <div className="text-xs font-medium bg-white px-3 py-1.5 rounded-lg text-blue-600 shadow-sm">View Report</div>
                  </div>
                  {/* Chart bars */}
                  <div className="flex items-end gap-2 h-20">
                    {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 68].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-md bg-gradient-to-t from-blue-500 to-blue-400 opacity-80"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -left-6 top-1/3 bg-white rounded-xl shadow-lg border border-slate-100 px-4 py-3 flex items-center gap-3 animate-float">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Fee Collection</p>
                  <p className="text-sm font-bold text-green-600">+23% this term</p>
                </div>
              </div>
              <div className="absolute -right-4 bottom-20 bg-white rounded-xl shadow-lg border border-slate-100 px-4 py-3 flex items-center gap-3 animate-float-delayed">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Attendance</p>
                  <p className="text-sm font-bold text-blue-600">94.2% Today</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─────────────────── SOCIAL PROOF BAR ─────────────────── */}
      <Section className="py-12 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 1200, suffix: '+', label: 'Students Managed' },
              { value: 150, suffix: '+', label: 'Staff Members' },
              { value: 98, suffix: '%', label: 'Uptime Guaranteed' },
              { value: 60, suffix: '%', label: 'Admin Time Saved' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-extrabold text-slate-900">
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </p>
                <p className="text-sm text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ─────────────────── PROBLEM → SOLUTION ─────────────────── */}
      <Section className="py-20 lg:py-28" id="problem">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Problem */}
            <div>
              <span className="text-sm font-bold uppercase tracking-widest text-red-500">The Problem</span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                Schools Are Drowning in Paper &amp; Spreadsheets
              </h2>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Attendance on paper. Fees tracked in Excel. Exam results passed around on WhatsApp. 
                Report cards printed one by one. Sound familiar?
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Hours wasted on manual data entry every week',
                  'Fee defaulters slip through the cracks',
                  'No real-time visibility for principals or parents',
                  'Staff attendance is honor-system guesswork',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-slate-600">
                    <X className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Solution */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 lg:p-10 border border-blue-100">
              <span className="text-sm font-bold uppercase tracking-widest text-blue-600">The Solution</span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                One System That Runs Everything
              </h2>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Green Field SMS digitises every process — from admissions to fee collection to report cards — in a 
                platform your staff can actually use.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Attendance marked in seconds on any device',
                  'Fee tracking with automated reminders',
                  'Live dashboards for principals & administrators',
                  'Staff clock-in with full audit trail',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-slate-700">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* ─────────────────── FEATURES ─────────────────── */}
      <Section className="py-20 lg:py-28 bg-slate-50" id="features">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm font-bold uppercase tracking-widest text-blue-600">Everything You Need</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900">
              Built for How Schools Actually Work
            </h2>
            <p className="mt-4 text-slate-600">
              Not a generic tool stretched to fit education. This was designed for Kenyan schools from day one.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Users, title: 'Student Management', desc: 'Admissions, profiles, class allocation, promotions, and full academic history in one place.', color: 'bg-blue-100 text-blue-600' },
              { icon: ClipboardCheck, title: 'Attendance Tracking', desc: 'Mark student and staff attendance digitally. Get real-time reports and absentee alerts.', color: 'bg-green-100 text-green-600' },
              { icon: DollarSign, title: 'Fee Management', desc: 'Track payments, generate invoices, send reminders, and see fee balances at a glance.', color: 'bg-purple-100 text-purple-600' },
              { icon: BookOpen, title: 'Exam & Grading', desc: 'Schedule exams, enter marks, auto-calculate grades, and generate report cards.', color: 'bg-orange-100 text-orange-600' },
              { icon: CalendarDays, title: 'Timetable Builder', desc: 'Create and manage class timetables with conflict detection and teacher assignment.', color: 'bg-pink-100 text-pink-600' },
              { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Real-time insights on attendance, fees, performance — for every decision maker.', color: 'bg-cyan-100 text-cyan-600' },
              { icon: Bell, title: 'Notifications & Alerts', desc: 'Automated SMS and email alerts for fees, attendance, and school announcements.', color: 'bg-yellow-100 text-yellow-700' },
              { icon: Shield, title: 'Role-Based Access', desc: 'Principals, teachers, accountants, parents — everyone sees only what they should.', color: 'bg-red-100 text-red-600' },
              { icon: FileText, title: 'Leave & Requests', desc: 'Staff leave applications, approvals, and tracking — all paperless.', color: 'bg-indigo-100 text-indigo-600' },
            ].map((f) => (
              <div
                key={f.title}
                className="group bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ─────────────────── HOW IT WORKS ─────────────────── */}
      <Section className="py-20 lg:py-28" id="how-it-works">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm font-bold uppercase tracking-widest text-blue-600">Simple Process</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900">
              Up and Running in Days, Not Months
            </h2>
            <p className="mt-4 text-slate-600">
              We handle the heavy lifting. You just bring your school data.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Sign Up', desc: 'Create your school account in under 2 minutes. No credit card needed.', icon: Smartphone },
              { step: '02', title: 'Configure', desc: 'Set up classes, terms, fee structures, and user roles to match your school.', icon: Zap },
              { step: '03', title: 'Import Data', desc: 'Upload student records, staff details, and existing data from spreadsheets.', icon: FileText },
              { step: '04', title: 'Go Live', desc: 'Start managing your school digitally. Full support along the way.', icon: Globe },
            ].map((s, i) => (
              <div key={s.step} className="relative text-center">
                {i < 3 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-blue-200" />
                )}
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-600 text-white mb-6 shadow-lg shadow-blue-600/25">
                  <s.icon className="h-8 w-8" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white text-blue-600 text-xs font-bold flex items-center justify-center shadow border border-blue-100">
                    {s.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ─────────────────── TESTIMONIALS ─────────────────── */}
      <Section className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm font-bold uppercase tracking-widest text-blue-600">Testimonials</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900">
              What Schools Are Saying
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Dr. Sarah Wanjiku',
                role: 'Principal, Green Field High School',
                quote: 'We reduced our admin workload by 60% in the first term. Fee collection follow-ups that took days now happen automatically.',
                stars: 5,
              },
              {
                name: 'James Ochieng',
                role: 'Head Teacher, Nairobi Academy',
                quote: 'The attendance system alone saved us 10 hours per week. The dashboard gives me visibility I never had with paper records.',
                stars: 5,
              },
              {
                name: 'Mary Kamau',
                role: 'School Bursar',
                quote: 'Fee tracking used to be a nightmare. Now I can tell any parent their exact balance in seconds. The reports are beautiful.',
                stars: 5,
              },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-600 leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    {t.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ─────────────────── PRICING ─────────────────── */}
      <Section className="py-20 lg:py-28" id="pricing">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm font-bold uppercase tracking-widest text-blue-600">Pricing</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-slate-600">
              No hidden fees. No recurring subscriptions. One-time payment, lifetime access.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="rounded-2xl p-8 border-2 border-blue-600 bg-blue-600 text-white shadow-xl shadow-blue-600/20">
              <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold mb-4">
                Starting From
              </span>
              <h3 className="text-xl font-bold text-white">Starter</h3>
              <p className="mt-1 text-sm text-blue-100">Everything you need to run your school digitally</p>
              <div className="mt-6 mb-6">
                <span className="text-4xl font-extrabold text-white">$500</span>
                <span className="text-sm text-blue-200"> /one-time</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Student management', 'Attendance tracking', 'Fee management', 'Exam & grading', 'Timetable builder', 'Role-based access', 'Email support', 'Free setup & migration'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-blue-50">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-200" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="block text-center py-3 rounded-xl font-semibold transition-all bg-white text-blue-600 hover:bg-blue-50"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Risk reducer */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-1.5"><Lock className="h-4 w-4" /> Secure payments</span>
              <span className="flex items-center gap-1.5"><HeartHandshake className="h-4 w-4" /> 30-day money-back guarantee</span>
              <span className="flex items-center gap-1.5"><MessageSquare className="h-4 w-4" /> Free setup &amp; migration support</span>
            </div>
          </div>
        </div>
      </Section>

      {/* ─────────────────── FAQ ─────────────────── */}
      <Section className="py-20 lg:py-28 bg-slate-50" id="faq">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-sm font-bold uppercase tracking-widest text-blue-600">FAQ</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            <FaqItem
              q="How long does it take to set up?"
              a="Most schools are up and running within 1-3 days. We help you import existing data from spreadsheets and configure the system to match your school's structure."
            />
            <FaqItem
              q="Do we need to install any software?"
              a="No. Green Field SMS is fully cloud-based. It works on any device with a browser — computers, tablets, and smartphones. No installation required."
            />
            <FaqItem
              q="Is our data safe?"
              a="Absolutely. We use industry-standard encryption, regular backups, and role-based access controls. Your data is stored securely and only accessible to authorised users."
            />
            <FaqItem
              q="Can parents access the system?"
              a="Yes. Parents get a dedicated portal to view their child's attendance, grades, fee balance, and school announcements. They can also communicate with teachers."
            />
            <FaqItem
              q="What if we need help after launch?"
              a="Every plan includes support. Professional and Enterprise plans get priority support with dedicated channels. We also provide training for your staff."
            />
            <FaqItem
              q="Can we migrate from our current system?"
              a="Yes. We offer free migration support. Whether you're using spreadsheets, another system, or paper records — we'll help you transition smoothly."
            />
          </div>
        </div>
      </Section>

      {/* ─────────────────── FINAL CTA ─────────────────── */}
      <Section className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl px-8 py-16 md:px-16 shadow-2xl shadow-blue-600/20">
            <GraduationCap className="h-12 w-12 text-blue-200 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Stop Running Your School on Spreadsheets.
              <br />
              <span className="text-blue-200">Start Running It on a System.</span>
            </h2>
            <p className="mt-4 text-blue-100 max-w-xl mx-auto">
              Join schools that have already transformed their operations. 
              Set up takes minutes — the impact lasts for years.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold text-blue-700 bg-white rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:-translate-y-0.5"
              >
                Get Started — From $500 <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-all"
              >
                View Pricing
              </a>
            </div>
          </div>
        </div>
      </Section>

      {/* ─────────────────── FOOTER ─────────────────── */}
      <footer className="bg-slate-900 text-slate-400 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 pb-10 border-b border-slate-800">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-3 mb-4">
                <div className="relative w-9 h-9 rounded-lg overflow-hidden">
                  <Image src={schoolLogo} alt="Green Field School" fill className="object-cover" />
                </div>
                <span className="text-lg font-bold text-white">Green Field <span className="text-blue-400">SMS</span></span>
              </Link>
              <p className="text-sm leading-relaxed">
                Comprehensive school management system built for Kenyan schools. 
                From attendance to fees to grades — all in one place.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Modules</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="hover:text-white transition-colors cursor-default">Student Management</span></li>
                <li><span className="hover:text-white transition-colors cursor-default">Attendance</span></li>
                <li><span className="hover:text-white transition-colors cursor-default">Fee Management</span></li>
                <li><span className="hover:text-white transition-colors cursor-default">Exams &amp; Grading</span></li>
                <li><span className="hover:text-white transition-colors cursor-default">Timetable</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>info@greenfield.ac.ke</li>
                <li>+254 700 000 000</li>
                <li>Nairobi, Kenya</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 text-sm">
            <p>&copy; {new Date().getFullYear()} Green Field School. All rights reserved.</p>
            <div className="flex gap-6 mt-4 sm:mt-0">
              <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
              <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
