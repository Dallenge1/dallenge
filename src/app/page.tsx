
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BrainCircuit, PlayCircle, Star, Users } from 'lucide-react';
import { NAV_LINKS } from '@/lib/placeholder-data';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LandingPage() {
  const featureLinks = NAV_LINKS.filter(
    (link) =>
      link.href === '/feed' ||
      link.href === '/leaderboard' ||
      link.href === '/profile'
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-4 lg:px-6 h-14 flex items-center sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <Link
          href="#"
          className="flex items-center justify-center"
          prefetch={false}
        >
          <BrainCircuit className="h-6 w-6 text-primary" />
          <span className="ml-2 text-lg font-bold">DAWION</span>
        </Link>
        <nav className="ml-auto flex gap-2 sm:gap-4 items-center">
          <ThemeToggle />
          <Button asChild variant="ghost">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-20 md:py-32 lg:py-40">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:gap-16">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    Unlock Your Potential with DAWION
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Your all-in-one platform for learning, wellness, and
                    personal growth. Explore videos, challenge your mind, and
                    connect with a vibrant community.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/signup">Get Started for Free</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                     <Link href="#features">Learn More</Link>
                  </Button>
                </div>
              </div>
              <Image
                src="https://picsum.photos/seed/landing-hero/600/400"
                width="600"
                height="400"
                alt="Hero"
                className="mx-auto aspect-[3/2] overflow-hidden rounded-xl object-cover sm:w-full"
                data-ai-hint="wellness education"
              />
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-20 md:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Everything You Need to Thrive
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From AI-powered personal training to brain-teasing games and a
                  supportive community, DAWION has it all.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-8 py-12 lg:grid-cols-3">
              {featureLinks.map((feature) => {
                const image = PlaceHolderImages.find(img => img.id.startsWith(feature.href.substring(1, 6)));
                return (
                <div key={feature.label} className="flip-card">
                  <div className="flip-card-inner">
                    <div className="flip-card-front group flex flex-col h-full items-center justify-center rounded-xl border bg-card p-6 shadow-lg transition-all hover:border-primary">
                       <feature.icon className="h-16 w-16 text-primary mb-4" />
                       <h3 className="text-2xl font-bold text-center">{feature.label}</h3>
                       <p className="text-sm text-muted-foreground mt-2 text-center">{feature.description}</p>
                    </div>
                    <div className="flip-card-back group flex flex-col h-full items-center justify-center rounded-xl border bg-card p-6 shadow-lg">
                      {image && (
                         <Image
                          src={image.imageUrl}
                          alt={feature.label}
                          width={400}
                          height={225}
                          className="rounded-md object-cover mb-4"
                          data-ai-hint={image.imageHint}
                        />
                      )}
                      <p className="text-sm text-center text-muted-foreground">{feature.description}</p>
                      <Button asChild variant="link" className="mt-2">
                        <Link href={feature.href}>Explore &rarr;</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </div>
        </section>

        <section className="w-full py-20 md:py-32">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Ready to Start Your Journey?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join thousands of users who are transforming their lives with
                DAWION. Sign up today and unlock your full potential.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
               <Button asChild size="lg" className="w-full">
                <Link href="/signup">Create Your Account</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          &copy; 2024 DAWION. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link
            href="#"
            className="text-xs hover:underline underline-offset-4"
            prefetch={false}
          >
            Terms of Service
          </Link>
          <Link
            href="#"
            className="text-xs hover:underline underline-offset-4"
            prefetch={false}
          >
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
