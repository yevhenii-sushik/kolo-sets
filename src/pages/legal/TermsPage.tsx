import { Scale, UserCheck, AlertTriangle, Repeat, ShieldOff, Pencil, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const EFFECTIVE_DATE = 'July 1, 2026';
const CONTACT_EMAIL = 'legal@dakuta.dev';

function Section({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center shrink-0">
          <Icon size={15} className="text-[#3B82F6]" />
        </div>
        <h2 className="text-[17px] font-black text-[#1A1714] dark:text-[#F0EDE8] tracking-tight">{title}</h2>
      </div>
      <div className="ml-11 space-y-3 text-[14px] text-[#5A5650] dark:text-[#9A9590] leading-relaxed font-medium">
        {children}
      </div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

function UL({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#3B82F6] shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-2xl bg-[#F59E0B]/8 border border-[#F59E0B]/20 text-[13px] text-[#D97706] font-semibold leading-relaxed flex gap-3">
      <AlertTriangle size={15} className="shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

export default function TermsPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#3B82F6]/10 flex items-center justify-center">
            <Scale size={20} className="text-[#3B82F6]" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B5B0A8]">
            Legal Document
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-[#1A1714] dark:text-[#F0EDE8] tracking-tight leading-none mb-4">
          Terms of Service
        </h1>
        <p className="text-[14px] text-[#7A756E] dark:text-[#8A867F] font-medium">
          Effective date: <strong className="text-[#1A1714] dark:text-[#F0EDE8]">{EFFECTIVE_DATE}</strong>
          {' · '}
          Applies to Kolo Sets web application
        </p>
      </div>

      {/* Intro */}
      <div className="mb-10 p-6 rounded-3xl bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29]">
        <p className="text-[14px] text-[#5A5650] dark:text-[#9A9590] leading-relaxed font-medium">
          These Terms of Service ("Terms") govern your access to and use of the Kolo Sets web application
          ("Service") provided by <strong className="text-[#1A1714] dark:text-[#F0EDE8]">Euphoria Software / Dakuta</strong>.
          By creating an account or using the Service, you agree to be bound by these Terms. If you do not agree,
          please do not use the Service.
        </p>
      </div>

      <div className="w-full h-px bg-[#E0DBD3] dark:bg-[#2E2C29] mb-10" />

      {/* 1. The service */}
      <Section title="1. Description of Service" icon={UserCheck}>
        <P>
          Kolo Sets is a free, browser-based application for learning languages — primarily Norwegian — through
          flashcards with spaced-repetition (SM-2 algorithm), quiz modes, daily puzzles, and progress tracking.
        </P>
        <P>
          The Service is provided free of charge. We reserve the right to introduce optional premium features
          in the future with advance notice to existing users.
        </P>
      </Section>

      {/* 2. Eligibility */}
      <Section title="2. Eligibility & Account" icon={UserCheck}>
        <P>By using Kolo Sets, you confirm that:</P>
        <UL items={[
          'You are at least 13 years old (or the age of digital consent in your jurisdiction, whichever is higher).',
          'You provide accurate and complete information when creating your account.',
          'You are responsible for maintaining the confidentiality of your account credentials.',
          'You are responsible for all activity that occurs under your account.',
          'You will notify us immediately of any unauthorized use of your account.',
        ]} />
        <P>
          One account per person. You may not create accounts for others without their explicit consent.
        </P>
      </Section>

      {/* 3. Acceptable use */}
      <Section title="3. Acceptable Use" icon={ShieldOff}>
        <P>You agree to use the Service only for lawful purposes. You must not:</P>
        <UL items={[
          'Attempt to gain unauthorized access to any part of the Service or its infrastructure.',
          'Use the Service to distribute spam, malware, or illegal content.',
          'Reverse engineer, decompile, or otherwise attempt to extract the source code of the application.',
          'Use automated scripts or bots to access the Service in a way that could damage or overload our servers.',
          'Impersonate another person or entity.',
          'Upload content that violates any applicable law or third-party rights.',
        ]} />
        <Warning>
          Violation of these terms may result in immediate account suspension without notice.
        </Warning>
      </Section>

      {/* 4. User content */}
      <Section title="4. Your Content" icon={Pencil}>
        <P>
          You retain full ownership of the flashcard collections and content you create in Kolo Sets.
        </P>
        <UL items={[
          'By using the Service, you grant us a limited, non-exclusive license to store, display, and sync your content solely to provide the Service to you.',
          'We do not claim ownership of your data.',
          'You may export or delete your content at any time.',
          'You are responsible for ensuring that any content you create does not infringe third-party copyrights or other rights.',
        ]} />
      </Section>

      {/* 5. Availability */}
      <Section title="5. Service Availability & Disclaimer" icon={AlertTriangle}>
        <P>
          The Service is provided <strong className="text-[#1A1714] dark:text-[#F0EDE8]">"as is"</strong> and{' '}
          <strong className="text-[#1A1714] dark:text-[#F0EDE8]">"as available"</strong> without warranties of any kind,
          express or implied.
        </P>
        <UL items={[
          'We do not guarantee that the Service will be available at all times or free from errors.',
          'We are not liable for any data loss resulting from technical failures. We strongly recommend using the export feature regularly.',
          'We do not guarantee that the Service will meet your specific learning requirements or produce particular language learning results.',
          'Response times may vary. We aim to respond to support requests within 24–48 hours but cannot guarantee this.',
        ]} />
        <P>
          To the maximum extent permitted by applicable law, Euphoria Software / Dakuta shall not be liable for
          any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.
        </P>
      </Section>

      {/* 6. Termination */}
      <Section title="6. Account Termination" icon={ShieldOff}>
        <P>
          <strong className="text-[#1A1714] dark:text-[#F0EDE8]">By you:</strong> You may delete your account at any time
          from Settings → Data Management → Delete Account. This permanently deletes all your data.
        </P>
        <P>
          <strong className="text-[#1A1714] dark:text-[#F0EDE8]">By us:</strong> We reserve the right to suspend or
          terminate accounts that violate these Terms, engage in fraudulent activity, or cause harm to the Service or
          other users. We will make reasonable efforts to notify you before taking action, unless immediate action is
          required to protect security.
        </P>
      </Section>

      {/* 7. Intellectual property */}
      <Section title="7. Intellectual Property" icon={Scale}>
        <P>
          All content of Kolo Sets itself — including the application code, design, logos, branding, and curated
          word sets ("Kolo Sets" collections) — is the property of Euphoria Software / Dakuta and is protected by
          copyright and other applicable laws.
        </P>
        <P>
          You may not copy, reproduce, distribute, or create derivative works of the application without explicit
          written permission from Euphoria Software.
        </P>
      </Section>

      {/* 8. Changes */}
      <Section title="8. Changes to These Terms" icon={Repeat}>
        <P>
          We may update these Terms from time to time. When we do, we will update the effective date and, for
          material changes, notify users via an in-app notification.
        </P>
        <P>
          Your continued use of the Service after the updated Terms take effect constitutes your acceptance of the
          new Terms. If you do not agree to the new Terms, you should stop using the Service and delete your account.
        </P>
      </Section>

      {/* 9. Governing law */}
      <Section title="9. Governing Law" icon={Scale}>
        <P>
          These Terms are governed by and construed in accordance with the laws of <strong className="text-[#1A1714] dark:text-[#F0EDE8]">Norway</strong>,
          without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of the
          Service shall be subject to the exclusive jurisdiction of the courts of Norway.
        </P>
        <P>
          If you are located in the European Union, you also benefit from any mandatory consumer protection provisions
          of the laws of your country of residence.
        </P>
      </Section>

      {/* 10. Contact */}
      <Section title="10. Contact" icon={Mail}>
        <P>For legal inquiries or questions about these Terms:</P>
        <div className="p-4 rounded-2xl bg-[#EDEAE4] dark:bg-[#242220]">
          <p className="font-black text-[#1A1714] dark:text-[#F0EDE8] text-[13px] mb-1">Euphoria Software / Dakuta</p>
          <p className="text-[13px]">
            Email:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#3B82F6] hover:underline font-mono">{CONTACT_EMAIL}</a>
          </p>
          <p className="text-[13px] mt-1">
            General support:{' '}
            <Link to="/support" className="text-[#3B82F6] hover:underline">Support form</Link>
          </p>
        </div>
      </Section>

      {/* Divider + related */}
      <div className="w-full h-px bg-[#E0DBD3] dark:bg-[#2E2C29] mt-12 mb-8" />
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          to="/privacy"
          className="flex-1 p-4 rounded-2xl border border-[#E0DBD3] dark:border-[#2E2C29] bg-white dark:bg-[#1A1917] hover:border-[#3B82F6] transition-colors group"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#B5B0A8] mb-1">Also read</p>
          <p className="font-black text-[14px] text-[#1A1714] dark:text-[#F0EDE8] group-hover:text-[#3B82F6] transition-colors">
            Privacy Policy →
          </p>
        </Link>
        <Link
          to="/support"
          className="flex-1 p-4 rounded-2xl border border-[#E0DBD3] dark:border-[#2E2C29] bg-white dark:bg-[#1A1917] hover:border-[#3B82F6] transition-colors group"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#B5B0A8] mb-1">Questions?</p>
          <p className="font-black text-[14px] text-[#1A1714] dark:text-[#F0EDE8] group-hover:text-[#3B82F6] transition-colors">
            Contact Support →
          </p>
        </Link>
      </div>
    </div>
  );
}
