import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
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
                Privacy Policy
              </h1>
            </div>
            <div className="prose prose-invert max-w-none text-muted-foreground space-y-6">
              <p>Last updated: July 29, 2024</p>
              <p>
                This Privacy Policy describes Our policies and procedures on
                the collection, use and disclosure of Your information when You
                use the Service and tells You about Your privacy rights and how
                the law protects You.
              </p>
              <h2 className="text-2xl font-semibold text-foreground">
                Collecting and Using Your Personal Data
              </h2>
              <p>
                While using Our Service, We may ask You to provide Us with
                certain personally identifiable information that can be used to
                contact or identify You. Personally identifiable information may
                include, but is not limited to: Email address, First name and
                last name, Usage Data.
              </p>
              <h2 className="text-2xl font-semibold text-foreground">
                Use of Your Personal Data
              </h2>
              <p>
                The Company may use Personal Data for the following purposes: To
                provide and maintain our Service, including to monitor the
                usage of our Service. To manage Your Account: to manage Your
                registration as a user of the Service.
              </p>
              <h2 className="text-2xl font-semibold text-foreground">
                Security of Your Personal Data
              </h2>
              <p>
                The security of Your Personal Data is important to Us, but
                remember that no method of transmission over the Internet, or
                method of electronic storage is 100% secure. While We strive to
                use commercially acceptable means to protect Your Personal
Data, We cannot guarantee its absolute security.
              </p>
              <h2 className="text-2xl font-semibold text-foreground">
                Contact Us
              </h2>
              <p>
                If you have any questions about this Privacy Policy, You can
                contact us: by email at contact@dallenge.com
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
