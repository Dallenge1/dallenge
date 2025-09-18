import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { NAV_LINKS } from '@/lib/placeholder-data';
import Link from 'next/link';

export default function DashboardPage() {
  const featureLinks = NAV_LINKS.filter((link) => link.href !== '/dashboard');

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to DAWION</h1>
        <p className="text-muted-foreground">
          Your all-in-one platform for learning and wellness.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {featureLinks.map((feature) => (
          <Link href={feature.href} key={feature.href} className="group">
            <Card className="h-full transition-all duration-300 hover:shadow-lg hover:border-primary">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <feature.icon className="h-8 w-8 text-primary" />
                  <div className="flex flex-col">
                    <CardTitle className="text-lg group-hover:text-primary">
                      {feature.label}
                    </CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
