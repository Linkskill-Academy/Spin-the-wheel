import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface FormState {
  vision12m: string;
  monthlyIncomeTarget: string;
  businessRevenueTarget: string;
  profitTarget: string;
  savingsTarget: string;
  assetTarget: string;
  homeTarget: string;
  impactTarget: string;
  healthGoal: string;
  familyGoal: string;
}

const initial: FormState = {
  vision12m: '',
  monthlyIncomeTarget: '',
  businessRevenueTarget: '',
  profitTarget: '',
  savingsTarget: '',
  assetTarget: '',
  homeTarget: '',
  impactTarget: '',
  healthGoal: '',
  familyGoal: '',
};

const founderSteps: { key: keyof FormState; question: string; placeholder: string; numeric?: boolean }[] = [
  { key: 'vision12m', question: 'What is your 12-month vision?', placeholder: 'In 12 months, I will have built...' },
  { key: 'monthlyIncomeTarget', question: "What is your monthly income target?", placeholder: 'e.g. 150000', numeric: true },
  { key: 'businessRevenueTarget', question: 'What is your business revenue target?', placeholder: 'e.g. 800000', numeric: true },
  { key: 'profitTarget', question: 'What is your monthly profit target?', placeholder: 'e.g. 300000', numeric: true },
  { key: 'savingsTarget', question: 'What is your monthly savings target?', placeholder: 'e.g. 50000', numeric: true },
  { key: 'assetTarget', question: 'What is your asset target?', placeholder: 'e.g. 2000000', numeric: true },
  { key: 'homeTarget', question: 'What is your home / property target?', placeholder: 'e.g. 12500000', numeric: true },
  { key: 'impactTarget', question: 'What impact do you want to create?', placeholder: 'e.g. Train 1,000 students' },
  { key: 'healthGoal', question: 'What is your health goal?', placeholder: 'e.g. Daily 30-minute workout' },
  { key: 'familyGoal', question: 'What is your family / lifestyle goal?', placeholder: 'e.g. One uninterrupted family dinner daily' },
];

const studentSteps: { key: keyof FormState; question: string; placeholder: string; numeric?: boolean }[] = [
  { key: 'vision12m', question: 'What is your 12-month career vision?', placeholder: 'In 12 months, I will be...' },
  { key: 'monthlyIncomeTarget', question: 'What monthly income are you aiming for once placed?', placeholder: 'e.g. 25000', numeric: true },
  { key: 'businessRevenueTarget', question: 'What skill or portfolio milestone matters most?', placeholder: 'e.g. Complete 3 real projects' },
  { key: 'profitTarget', question: 'How many job applications do you want to send this month?', placeholder: 'e.g. 40', numeric: true },
  { key: 'savingsTarget', question: 'How many hours a week will you study?', placeholder: 'e.g. 15', numeric: true },
  { key: 'assetTarget', question: 'What certification or qualification are you working toward?', placeholder: 'e.g. A specific certificate' },
  { key: 'homeTarget', question: 'Any bigger financial goal for this year?', placeholder: 'e.g. Save for a laptop' },
  { key: 'impactTarget', question: 'What impact do you want your career to create?', placeholder: 'e.g. Support my family' },
  { key: 'healthGoal', question: 'What is your health goal?', placeholder: 'e.g. Sleep 7 hours a night' },
  { key: 'familyGoal', question: 'What is your family / lifestyle goal?', placeholder: 'e.g. Call home every day' },
];

export default function Onboarding() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);

  const steps = user?.accountMode === 'student' ? studentSteps : founderSteps;
  const current = steps[step];
  const isLast = step === steps.length - 1;

  function updateField(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function finish() {
    setSaving(true);
    try {
      await api.post('/onboarding', {
        vision12m: form.vision12m,
        monthlyIncomeTarget: Number(form.monthlyIncomeTarget) || 0,
        businessRevenueTarget: Number(form.businessRevenueTarget) || 0,
        profitTarget: Number(form.profitTarget) || 0,
        savingsTarget: Number(form.savingsTarget) || 0,
        assetTarget: Number(form.assetTarget) || 0,
        homeTarget: Number(form.homeTarget) || 0,
        impactTarget: form.impactTarget,
        healthGoal: form.healthGoal,
        familyGoal: form.familyGoal,
      });
      await refreshUser();
      navigate('/');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-softbg">
      <div className="w-full max-w-lg">
        <div className="flex gap-1.5 mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-line'}`} />
          ))}
        </div>

        <div className="card">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
            Step {step + 1} of {steps.length}
          </p>
          <h2 className="text-xl font-extrabold text-ink mb-4">{current.question}</h2>
          {current.numeric ? (
            <input
              type="number"
              className="input-field"
              placeholder={current.placeholder}
              value={form[current.key]}
              onChange={(e) => updateField(current.key, e.target.value)}
              autoFocus
            />
          ) : (
            <textarea
              className="input-field min-h-[100px]"
              placeholder={current.placeholder}
              value={form[current.key]}
              onChange={(e) => updateField(current.key, e.target.value)}
              autoFocus
            />
          )}

          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button className="btn-secondary flex items-center gap-2" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft size={16} /> Back
              </button>
            )}
            {!isLast ? (
              <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={() => setStep((s) => s + 1)}>
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button disabled={saving} className="btn-primary flex-1" onClick={finish}>
                {saving ? 'Building your plan...' : 'Create My Plan'}
              </button>
            )}
          </div>
        </div>
        <p className="text-center text-sm text-muted mt-6">
          We'll turn this into your 12-month → 90-day → 30-day → weekly → today plan.
        </p>
      </div>
    </div>
  );
}
