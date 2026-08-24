import {
  ShieldCheck,
  Database,
  Lock,
  Eye,
  Trash2,
  Mail,
  Globe,
  Server,
} from "lucide-react";
import { Link } from "react-router-dom";

const EFFECTIVE_DATE = "July 1, 2026";
const CONTACT_EMAIL = "privacy@dakuta.dev";

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-[#FF5733]/10 flex items-center justify-center shrink-0">
          <Icon size={15} className="text-[#FF5733]" />
        </div>
        <h2 className="text-[17px] font-black text-[#1A1714] dark:text-[#F0EDE8] tracking-tight">
          {title}
        </h2>
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
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#FF5733] shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-2xl bg-[#FF5733]/8 border border-[#FF5733]/15 text-[13px] text-[#FF5733] font-semibold leading-relaxed">
      {children}
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#22C55E]/10 flex items-center justify-center">
            <ShieldCheck size={20} className="text-[#22C55E]" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B5B0A8]">
            Legal Document
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-[#1A1714] dark:text-[#F0EDE8] tracking-tight leading-none mb-4">
          Privacy Policy
        </h1>
        <p className="text-[14px] text-[#7A756E] dark:text-[#8A867F] font-medium">
          Effective date:{" "}
          <strong className="text-[#1A1714] dark:text-[#F0EDE8]">
            {EFFECTIVE_DATE}
          </strong>
          {" · "}
          Applies to Kolo Sets web application
        </p>
      </div>

      {/* Quick summary card */}
      <div className="mb-10 p-6 rounded-3xl bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29]">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B5B0A8] mb-3">
          TL;DR — Short version
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              icon: "🚫",
              text: "We do not sell or share your personal data with third parties for advertising.",
            },
            {
              icon: "🔒",
              text: "Your flashcard collections are stored in Google Firebase — encrypted in transit and at rest.",
            },
            {
              icon: "🗑️",
              text: "You can export or permanently delete all your data at any time from the app.",
            },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-xl shrink-0">{item.icon}</span>
              <p className="text-[12px] text-[#5A5650] dark:text-[#9A9590] font-medium leading-snug">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full h-px bg-[#E0DBD3] dark:bg-[#2E2C29] mb-10" />

      {/* 1. Who we are */}
      <Section title="1. Who We Are" icon={Globe}>
        <P>
          Kolo Sets ("Kolo", "we", "us", or "our") is a web application for
          learning the Norwegian language using flashcards, spaced-repetition,
          and quiz modes. It is developed and operated by{" "}
          <strong className="text-[#1A1714] dark:text-[#F0EDE8]">
            Dakuta Studio
          </strong>
          , trading as{" "}
          <strong className="text-[#1A1714] dark:text-[#F0EDE8]">Dakuta</strong>
          .
        </P>
        <P>
          This Privacy Policy describes how we collect, use, and protect
          information about you when you use the Kolo Sets web application at{" "}
          <span className="font-mono text-[#FF5733]">kolo.dakuta.dev</span> and
          any related services.
        </P>
      </Section>

      {/* 2. What we collect */}
      <Section title="2. What Data We Collect" icon={Database}>
        <P>We collect the minimum data necessary to provide the service:</P>

        <div className="space-y-4">
          <div>
            <p className="font-black text-[#1A1714] dark:text-[#F0EDE8] mb-1.5 text-[13px]">
              Account Information
            </p>
            <UL
              items={[
                "Email address — used for account creation and login only.",
                "Display name — optional, used to personalize the interface.",
                "Profile photo URL — optional, if you choose to set one.",
                "Password — stored as a secure hash by Firebase Authentication (we never have access to plaintext passwords).",
              ]}
            />
          </div>
          <div>
            <p className="font-black text-[#1A1714] dark:text-[#F0EDE8] mb-1.5 text-[13px]">
              Learning Data
            </p>
            <UL
              items={[
                "Flashcard collections and cards you create (Norwegian word, translation, example sentence).",
                "Study history: number of sessions, cards reviewed per day, time spent.",
                "SRS data per card: ease factor, repetition count, next review date.",
                "Quiz results: questions answered, correct answers, quiz duration.",
                "Streak count and last study date.",
                "Achievements unlocked.",
              ]}
            />
          </div>
          <div>
            <p className="font-black text-[#1A1714] dark:text-[#F0EDE8] mb-1.5 text-[13px]">
              Technical Data (via Firebase)
            </p>
            <UL
              items={[
                "Firebase Authentication automatically records your IP address and device information as part of its security model. We do not access or process this data directly.",
                "Standard browser session data required for Firebase to function.",
              ]}
            />
          </div>
          <div>
            <p className="font-black text-[#1A1714] dark:text-[#F0EDE8] mb-1.5 text-[13px]">
              Feedback Data
            </p>
            <UL
              items={[
                "If you submit feedback via the Support form: the message text, subject, your email (optional), and feedback type are sent to our private Telegram channel. This data is not stored in a database — it goes directly to the development team.",
              ]}
            />
          </div>
        </div>

        <Highlight>
          We do <strong>not</strong> collect: precise location, device sensors,
          contacts, cookies for tracking, advertising identifiers, or any
          biometric data.
        </Highlight>
      </Section>

      {/* 3. How we use it */}
      <Section title="3. How We Use Your Data" icon={Eye}>
        <P>
          We use your data solely to provide and improve the Kolo Sets service:
        </P>
        <UL
          items={[
            "Authenticate your identity and protect your account.",
            "Sync your flashcard collections across devices.",
            "Power the spaced-repetition algorithm (SM-2) so it correctly schedules your next review.",
            "Display your learning statistics, streak, and achievements.",
            "Deliver feedback from the support form to the development team.",
            "Improve the app based on aggregated, anonymized usage patterns (no individual tracking).",
          ]}
        />
        <P>
          We do{" "}
          <strong className="text-[#1A1714] dark:text-[#F0EDE8]">not</strong>{" "}
          use your data for advertising, profiling, or sell it to any third
          party.
        </P>
      </Section>

      {/* 4. Data storage */}
      <Section title="4. Data Storage & Security" icon={Server}>
        <P>
          All user data is stored in{" "}
          <strong className="text-[#1A1714] dark:text-[#F0EDE8]">
            Google Firebase
          </strong>{" "}
          (Firestore database + Firebase Authentication), which provides:
        </P>
        <UL
          items={[
            "Encryption in transit via TLS/HTTPS.",
            "Encryption at rest for all stored data.",
            "SOC 2, ISO 27001, and GDPR compliance from Google Cloud.",
            "Automatic backups.",
          ]}
        />
        <P>
          Firebase data is hosted in the{" "}
          <strong className="text-[#1A1714] dark:text-[#F0EDE8]">
            European Union (eur3 region)
          </strong>{" "}
          to comply with GDPR data residency requirements.
        </P>
        <P>
          Additionally, some data (collections) is cached in your browser's{" "}
          <span className="font-mono text-[13px]">localStorage</span> for
          offline access and performance. This data never leaves your device
          unless you choose to sync.
        </P>
      </Section>

      {/* 5. Third parties */}
      <Section title="5. Third-Party Services" icon={Lock}>
        <P>
          We use the following third-party services. Each has its own privacy
          policy:
        </P>
        <div className="space-y-3">
          {[
            {
              name: "Google Firebase",
              purpose:
                "Authentication and database (Firestore). Your email, name, and all learning data is stored here.",
              link: "firebase.google.com/support/privacy",
            },
            {
              name: "Telegram",
              purpose:
                "Receiving support feedback messages via the feedback form. Only messages you explicitly send through the Support page are transmitted.",
              link: "telegram.org/privacy",
            },
          ].map((item) => (
            <div
              key={item.name}
              className="p-4 rounded-2xl bg-[#EDEAE4] dark:bg-[#242220]"
            >
              <p className="font-black text-[#1A1714] dark:text-[#F0EDE8] text-[13px] mb-1">
                {item.name}
              </p>
              <p className="text-[12px] mb-1.5">{item.purpose}</p>
              <p className="text-[11px] font-mono text-[#B5B0A8]">
                {item.link}
              </p>
            </div>
          ))}
        </div>
        <P>
          We do not use Google Analytics, Meta Pixel, or any other
          advertising/tracking technology.
        </P>
      </Section>

      {/* 6. Your rights */}
      <Section title="6. Your Rights (GDPR)" icon={ShieldCheck}>
        <P>
          If you are located in the European Economic Area (EEA), you have the
          following rights under the General Data Protection Regulation (GDPR):
        </P>
        <UL
          items={[
            "Right to Access — you can view all your data directly in the app.",
            "Right to Portability — export all your flashcard collections as JSON from Settings → Data Management.",
            'Right to Erasure ("right to be forgotten") — delete your account and all associated data permanently from Settings → Data Management → Delete Account. This is irreversible.',
            "Right to Rectification — update your display name and photo from your Profile page.",
            "Right to Object — contact us if you object to any specific processing.",
            "Right to Restrict Processing — contact us and we will cease processing while your request is reviewed.",
          ]}
        />
        <P>
          To exercise any of these rights, use the in-app tools or contact us at{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-[#FF5733] hover:underline font-mono"
          >
            {CONTACT_EMAIL}
          </a>
          . We will respond within 30 days.
        </P>
      </Section>

      {/* 7. Data retention */}
      <Section title="7. Data Retention" icon={Trash2}>
        <UL
          items={[
            "Your account and all learning data is retained for as long as your account is active.",
            "If you delete your account, all data (profile, collections, study history, achievements) is permanently deleted from Firebase within 30 days.",
            "Support feedback messages sent via Telegram are stored only in our private Telegram channel and are not linked to your account.",
            "Local browser data (localStorage cache) is controlled by you — clear your browser cache at any time.",
          ]}
        />
      </Section>

      {/* 8. Children */}
      <Section title="8. Children's Privacy" icon={ShieldCheck}>
        <P>
          Kolo Sets is not directed at children under the age of 13. We do not
          knowingly collect personal information from children under 13. If we
          discover that a child under 13 has provided us with personal data, we
          will promptly delete it. If you believe your child has provided us
          with their data, please contact us at{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-[#FF5733] hover:underline font-mono"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </P>
      </Section>

      {/* 9. Changes */}
      <Section title="9. Changes to This Policy" icon={Mail}>
        <P>
          We may update this Privacy Policy from time to time. When we do, we
          will update the effective date at the top of this page and, if changes
          are material, notify active users via an in-app notice.
        </P>
        <P>
          Continued use of Kolo Sets after changes take effect constitutes your
          acceptance of the updated policy.
        </P>
      </Section>

      {/* 10. Contact */}
      <Section title="10. Contact Us" icon={Mail}>
        <P>If you have questions about this Privacy Policy or your data:</P>
        <div className="p-4 rounded-2xl bg-[#EDEAE4] dark:bg-[#242220]">
          <p className="text-[13px] mt-1">
            Email us at{" "}
            <a href="mailto:support@dakuta.dev" className="text-[#FF5733] hover:underline">
              support@dakuta.dev
            </a>{" "}
            to reach us directly.
          </p>
        </div>
      </Section>

      {/* Divider + related */}
      <div className="w-full h-px bg-[#E0DBD3] dark:bg-[#2E2C29] mt-12 mb-8" />
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          to="/terms"
          className="flex-1 p-4 rounded-2xl border border-[#E0DBD3] dark:border-[#2E2C29] bg-white dark:bg-[#1A1917] hover:border-[#FF5733] transition-colors group"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#B5B0A8] mb-1">
            Also read
          </p>
          <p className="font-black text-[14px] text-[#1A1714] dark:text-[#F0EDE8] group-hover:text-[#FF5733] transition-colors">
            Terms of Service →
          </p>
        </Link>
        <a
          href="mailto:support@dakuta.dev"
          className="flex-1 p-4 rounded-2xl border border-[#E0DBD3] dark:border-[#2E2C29] bg-white dark:bg-[#1A1917] hover:border-[#FF5733] transition-colors group"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#B5B0A8] mb-1">
            Questions?
          </p>
          <p className="font-black text-[14px] text-[#1A1714] dark:text-[#F0EDE8] group-hover:text-[#FF5733] transition-colors">
            Contact Support →
          </p>
        </a>
      </div>
    </div>
  );
}
