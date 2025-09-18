import PersonalTrainerForm from "./personal-trainer-form";

export default function PersonalTrainerPage() {
  return (
    <div className="space-y-6">
       <header>
        <h1 className="text-3xl font-bold tracking-tight">AI Personal Trainer</h1>
        <p className="text-muted-foreground">
          Get personalized fitness recommendations powered by AI.
        </p>
      </header>
      <PersonalTrainerForm />
    </div>
  );
}
