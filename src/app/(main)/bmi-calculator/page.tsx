import BmiCalculatorForm from './bmi-calculator-form';

export default function BmiCalculatorPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">BMI Calculator</h1>
        <p className="text-muted-foreground">
          Calculate your Body Mass Index to assess your weight status.
        </p>
      </header>
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <BmiCalculatorForm />
        </div>
      </div>
    </div>
  );
}
