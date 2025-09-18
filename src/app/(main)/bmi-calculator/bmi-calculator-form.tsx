'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

const formSchema = z.object({
  height: z.coerce
    .number({ invalid_type_error: 'Please enter a valid number.' })
    .positive({ message: 'Height must be positive.' }),
  weight: z.coerce
    .number({ invalid_type_error: 'Please enter a valid number.' })
    .positive({ message: 'Weight must be positive.' }),
  unit: z.enum(['metric', 'imperial']).default('metric'),
});

type BmiResult = {
  value: number;
  category: string;
  color: string;
};

export default function BmiCalculatorForm() {
  const [bmiResult, setBmiResult] = useState<BmiResult | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unit: 'metric',
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = (data) => {
    const { height, weight, unit } = data;
    let bmi;
    if (unit === 'metric') {
      // height in cm, weight in kg
      bmi = weight / (height / 100) ** 2;
    } else {
      // height in inches, weight in lbs
      bmi = (weight / height ** 2) * 703;
    }

    let category = '';
    let color = '';

    if (bmi < 18.5) {
      category = 'Underweight';
      color = 'text-blue-500';
    } else if (bmi >= 18.5 && bmi < 24.9) {
      category = 'Normal weight';
      color = 'text-green-500';
    } else if (bmi >= 25 && bmi < 29.9) {
      category = 'Overweight';
      color = 'text-yellow-500';
    } else {
      category = 'Obesity';
      color = 'text-red-500';
    }

    setBmiResult({ value: bmi, category, color });
  };

  const unit = form.watch('unit');

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Enter Your Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={field.value === 'metric' ? 'default' : 'outline'}
                      onClick={() => {
                        field.onChange('metric');
                        setBmiResult(null);
                        form.reset({ ...form.getValues(), height: undefined, weight: undefined, unit: 'metric' });
                      }}
                      className="flex-1"
                    >
                      Metric
                    </Button>
                    <Button
                      type="button"
                      variant={field.value === 'imperial' ? 'default' : 'outline'}
                      onClick={() => {
                        field.onChange('imperial');
                        setBmiResult(null);
                        form.reset({ ...form.getValues(), height: undefined, weight: undefined, unit: 'imperial' });
                      }}
                      className="flex-1"
                    >
                      Imperial
                    </Button>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="height"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Height ({unit === 'metric' ? 'cm' : 'in'})</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder={unit === 'metric' ? 'e.g. 175' : 'e.g. 69'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight ({unit === 'metric' ? 'kg' : 'lbs'})</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder={unit === 'metric' ? 'e.g. 70' : 'e.g. 154'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">Calculate BMI</Button>
          </CardFooter>
        </form>
      </Form>
      {bmiResult && (
        <Alert className="m-6 mt-0">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Your BMI Result</AlertTitle>
            <AlertDescription className="flex flex-col items-center justify-center text-center p-4">
                <span className={cn('text-6xl font-bold tracking-tighter', bmiResult.color)}>
                {bmiResult.value.toFixed(1)}
                </span>
                <span className={cn('text-xl font-semibold', bmiResult.color)}>
                {bmiResult.category}
                </span>
            </AlertDescription>
        </Alert>
      )}
    </Card>
  );
}
