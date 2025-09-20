import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 md:px-6 lg:py-16">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center mb-8">
              <Button asChild variant="ghost" size="icon">
                <Link href="/">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl ml-4">
                Terms of Service
              </h1>
            </div>
            <div className="prose prose-invert max-w-none text-muted-foreground space-y-6">
              <p>Last updated: July 29, 2024</p>
              <p>
                Please read these terms and conditions carefully before using
                Our Service.
              </p>
              <h2 className="text-2xl font-semibold text-foreground">
                Interpretation and Definitions
              </h2>
              <p>
                The words of which the initial letter is capitalized have
                meanings defined under the following conditions. The following
                definitions shall have the same meaning regardless of whether
                they appear in singular or in plural.
              </p>
              <h2 className="text-2xl font-semibold text-foreground">
                Acknowledgment
              </h2>
              <p>
                These are the Terms and Conditions governing the use of this
                Service and the agreement that operates between You and the
                Company. These Terms and Conditions set out the rights and
                obligations of all users regarding the use of the Service.
              </p>
              <p>
                Your access to and use of the Service is conditioned on Your
                acceptance of and compliance with these Terms and Conditions.
                These Terms and Conditions apply to all visitors, users and
                others who access or use the Service.
              </p>
              <h2 className="text-2xl font-semibold text-foreground">
                User Accounts
              </h2>
              <p>
                When you create an account with Us, You must provide Us
                information that is accurate, complete, and current at all
                times. Failure to do so constitutes a breach of the Terms, which
                may result in immediate termination of Your account on Our
                Service.
              </p>
              <h2 className="text-2xl font-semibold text-foreground">
                Termination
              </h2>
              <p>
                We may terminate or suspend Your Account immediately, without
                prior notice or liability, for any reason whatsoever, including
                without limitation if You breach these Terms and Conditions.
              </p>
              <h2 className="text-2xl font-semibold text-foreground">
                Contact Us
              </h2>
              <p>
                If you have any questions about these Terms and Conditions, You
                can contact us: by email at contact@dallenge.com
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
