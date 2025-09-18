'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

const dietData = [
  { name: 'Breakfast', calories: 450 },
  { name: 'Lunch', calories: 650 },
  { name: 'Dinner', calories: 700 },
  { name: 'Snacks', calories: 300 },
];

const exerciseData = [
    { name: 'Running', calories: 300 },
    { name: 'Weightlifting', calories: 250 },
    { name: 'Yoga', calories: 150 },
];

export default function TrackingPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Track Your Progress</h1>
        <p className="text-muted-foreground">
          Log your meals and workouts to stay on top of your goals.
        </p>
      </header>

      <Tabs defaultValue="diet" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="diet">Diet Tracking</TabsTrigger>
          <TabsTrigger value="exercise">Exercise Tracking</TabsTrigger>
        </TabsList>
        <TabsContent value="diet">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Log a Meal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meal">Meal</Label>
                  <Input id="meal" placeholder="e.g., Chicken Salad" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calories">Calories</Label>
                  <Input id="calories" type="number" placeholder="e.g., 450" />
                </div>
                <Button className="w-full">Log Meal</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Today's Calorie Intake</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dietData}>
                    <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                        contentStyle={{
                            background: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))"
                        }}
                    />
                    <Bar dataKey="calories" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="exercise">
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Log a Workout</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="exercise">Exercise</Label>
                  <Input id="exercise" placeholder="e.g., Morning Run" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ex-calories">Calories Burned</Label>
                  <Input id="ex-calories" type="number" placeholder="e.g., 300" />
                </div>
                <Button className="w-full">Log Workout</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Today's Exercise</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={exerciseData}>
                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                        contentStyle={{
                            background: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))"
                        }}
                    />
                    <Bar dataKey="calories" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
