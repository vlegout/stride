import { Box, Typography, Link as MuiLink } from "@mui/material";
import PageHeader from "../components/ui/PageHeader";
import SectionContainer from "../components/ui/SectionContainer";
import LegalSection from "../components/LegalSection";

export default function TermsOfService() {
  return (
    <Box sx={{ width: "100%" }}>
      <PageHeader title="Terms of Service" subtitle="Effective Date: January 4, 2026" />
      <SectionContainer maxWidth={{ xs: "100%", sm: "800px", md: "900px" }} centered variant="paper" elevation={2}>
        <Box sx={{ textAlign: "left" }}>
          <LegalSection title="1. Acceptance of Terms">
            <Typography variant="body1" paragraph>
              By accessing or using Stride (the "Service"), you agree to be bound by these Terms of Service ("Terms").
              If you do not agree to these Terms, you may not use the Service.
            </Typography>
            <Typography variant="body1" paragraph>
              The Service is operated by Vincent Legout ("we", "us", or "our"), an individual based in France.
            </Typography>
          </LegalSection>

          <LegalSection title="2. Service Description">
            <Typography variant="body1" paragraph>
              Stride is a web application that allows users to:
            </Typography>
            <Box sx={{ ml: 2, mb: 2 }}>
              <Typography variant="body1" component="div">
                <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                  <li>Upload and store FIT files from fitness activities</li>
                  <li>Visualize running and cycling activities with interactive charts and maps</li>
                  <li>Analyze performance metrics including pace, heart rate, power, and training zones</li>
                  <li>Track fitness progress and best performances</li>
                  <li>Sync activities from third-party services (such as Garmin Connect)</li>
                </ul>
              </Typography>
            </Box>
          </LegalSection>

          <LegalSection title="3. Eligibility">
            <Typography variant="body1" paragraph>
              You must be at least 16 years old to use the Service. By using the Service, you represent and warrant that
              you meet this age requirement.
            </Typography>
          </LegalSection>

          <LegalSection title="4. User Accounts">
            <Typography variant="body1" paragraph>
              To use the Service, you must create an account using Google OAuth authentication. You are responsible for:
            </Typography>
            <Box sx={{ ml: 2, mb: 2 }}>
              <Typography variant="body1" component="div">
                <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                  <li>Maintaining the security of your Google account</li>
                  <li>All activities that occur under your account, whether authorized by you or not</li>
                  <li>Notifying us immediately of any unauthorized access to your account</li>
                </ul>
              </Typography>
            </Box>
          </LegalSection>

          <LegalSection title="5. User Responsibilities">
            <Typography variant="body1" paragraph>
              When using the Service, you agree to:
            </Typography>
            <Box sx={{ ml: 2, mb: 2 }}>
              <Typography variant="body1" component="div">
                <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                  <li>Provide accurate and truthful information</li>
                  <li>Use the Service only for lawful purposes</li>
                  <li>Not upload malicious files or content that could harm the Service or other users</li>
                  <li>Not attempt to reverse engineer, decompile, or hack the Service</li>
                  <li>Not use automated tools to access or scrape data from the Service without permission</li>
                  <li>Respect the intellectual property rights of others</li>
                </ul>
              </Typography>
            </Box>
          </LegalSection>

          <LegalSection title="6. Acceptable Use Policy">
            <Typography variant="body1" paragraph>
              You may not use the Service to:
            </Typography>
            <Box sx={{ ml: 2, mb: 2 }}>
              <Typography variant="body1" component="div">
                <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                  <li>Violate any applicable laws, regulations, or third-party rights</li>
                  <li>Upload or transmit viruses, malware, or other harmful code</li>
                  <li>Harass, abuse, or harm other users or individuals</li>
                  <li>Impersonate another person or misrepresent your affiliation with any entity</li>
                  <li>Interfere with or disrupt the Service or servers/networks connected to it</li>
                  <li>Collect or store personal data about other users without consent</li>
                </ul>
              </Typography>
            </Box>
          </LegalSection>

          <LegalSection title="7. Content Ownership and License">
            <Typography variant="body1" paragraph>
              You retain ownership of all activity data, FIT files, and other content you upload to the Service ("User
              Content"). By uploading User Content, you grant us a limited, non-exclusive, royalty-free license to:
            </Typography>
            <Box sx={{ ml: 2, mb: 2 }}>
              <Typography variant="body1" component="div">
                <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                  <li>Store, process, and display your User Content</li>
                  <li>
                    Perform technical operations necessary to provide the Service (e.g., processing FIT files,
                    generating charts)
                  </li>
                  <li>Create backups and derivatives for operational purposes</li>
                </ul>
              </Typography>
            </Box>
            <Typography variant="body1" paragraph>
              This license terminates when you delete your User Content or close your account, except for content
              retained in backups for a limited period.
            </Typography>
          </LegalSection>

          <LegalSection title="8. Intellectual Property Rights">
            <Typography variant="body1" paragraph>
              The Service, including its design, code, features, and branding, is owned by Vincent Legout and protected
              by copyright and other intellectual property laws. The source code is available under the MIT License on
              GitHub.
            </Typography>
            <Typography variant="body1" paragraph>
              You may not copy, modify, distribute, or create derivative works from the Service without our express
              written permission, except as permitted by the MIT License for the open-source code.
            </Typography>
          </LegalSection>

          <LegalSection title="9. Limitation of Liability">
            <Typography variant="body1" paragraph>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW:
            </Typography>
            <Box sx={{ ml: 2, mb: 2 }}>
              <Typography variant="body1" component="div">
                <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                  <li>
                    The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, either express or
                    implied
                  </li>
                  <li>We do not guarantee that the Service will be uninterrupted, secure, or error-free</li>
                  <li>We are not liable for any loss of data, including activity data or FIT files</li>
                  <li>
                    We are not responsible for the accuracy of fitness metrics, calculations, or performance analysis
                  </li>
                  <li>
                    We shall not be liable for any indirect, incidental, special, consequential, or punitive damages
                  </li>
                </ul>
              </Typography>
            </Box>
            <Typography variant="body1" paragraph>
              Our total liability to you for any claims arising from your use of the Service shall not exceed €100 or
              the amount you paid to us in the past 12 months, whichever is greater.
            </Typography>
          </LegalSection>

          <LegalSection title="10. Disclaimers">
            <Typography variant="body1" paragraph>
              <strong>Health and Safety:</strong> The Service provides fitness data for informational purposes only. It
              is not a substitute for professional medical advice, diagnosis, or treatment. Consult with a healthcare
              provider before starting any fitness program.
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Data Accuracy:</strong> While we strive for accuracy, we do not guarantee that activity metrics,
              GPS data, or performance calculations are completely accurate or reliable.
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Third-Party Services:</strong> We are not responsible for the availability, content, or actions of
              third-party services (Google OAuth, Garmin Connect, AWS, etc.).
            </Typography>
          </LegalSection>

          <LegalSection title="11. Service Availability and Modifications">
            <Typography variant="body1" paragraph>
              We reserve the right to:
            </Typography>
            <Box sx={{ ml: 2, mb: 2 }}>
              <Typography variant="body1" component="div">
                <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                  <li>Modify, suspend, or discontinue the Service (or any part of it) at any time</li>
                  <li>Change features, functionality, or pricing</li>
                  <li>Perform maintenance that may temporarily restrict access</li>
                  <li>Set storage limits or impose usage restrictions</li>
                </ul>
              </Typography>
            </Box>
            <Typography variant="body1" paragraph>
              We will make reasonable efforts to notify users of significant changes, but are not obligated to do so.
            </Typography>
          </LegalSection>

          <LegalSection title="12. Termination">
            <Typography variant="body1" paragraph>
              You may terminate your account at any time by contacting us at{" "}
              <MuiLink href="mailto:vincent@legout.info">vincent@legout.info</MuiLink>. Upon termination, your right to
              access the Service will cease immediately.
            </Typography>
            <Typography variant="body1" paragraph>
              We reserve the right to suspend or terminate your account if you violate these Terms or engage in conduct
              that we deem harmful to the Service or other users.
            </Typography>
            <Typography variant="body1" paragraph>
              Upon termination, we may delete your User Content, subject to our data retention policies and legal
              obligations. We recommend exporting your data before terminating your account.
            </Typography>
          </LegalSection>

          <LegalSection title="13. Privacy and Data Protection">
            <Typography variant="body1" paragraph>
              Your use of the Service is also governed by our <MuiLink href="/privacy">Privacy Policy</MuiLink>, which
              explains how we collect, use, and protect your personal data in compliance with GDPR and other applicable
              data protection laws.
            </Typography>
          </LegalSection>

          <LegalSection title="14. Indemnification">
            <Typography variant="body1" paragraph>
              You agree to indemnify and hold harmless Vincent Legout from any claims, damages, losses, liabilities, and
              expenses (including legal fees) arising from:
            </Typography>
            <Box sx={{ ml: 2, mb: 2 }}>
              <Typography variant="body1" component="div">
                <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                  <li>Your use of the Service</li>
                  <li>Your violation of these Terms</li>
                  <li>Your violation of any third-party rights</li>
                  <li>Your User Content</li>
                </ul>
              </Typography>
            </Box>
          </LegalSection>

          <LegalSection title="15. Governing Law and Jurisdiction">
            <Typography variant="body1" paragraph>
              These Terms are governed by and construed in accordance with the laws of France, without regard to its
              conflict of law provisions.
            </Typography>
            <Typography variant="body1" paragraph>
              Any disputes arising from these Terms or your use of the Service shall be subject to the exclusive
              jurisdiction of the courts of France.
            </Typography>
          </LegalSection>

          <LegalSection title="16. Severability">
            <Typography variant="body1" paragraph>
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will
              remain in full force and effect.
            </Typography>
          </LegalSection>

          <LegalSection title="17. Entire Agreement">
            <Typography variant="body1" paragraph>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and us
              regarding the Service and supersede any prior agreements.
            </Typography>
          </LegalSection>

          <LegalSection title="18. Changes to These Terms">
            <Typography variant="body1" paragraph>
              We may update these Terms from time to time. Significant changes will be communicated by updating the
              "Effective Date" at the top of this page. Your continued use of the Service after changes constitutes
              acceptance of the updated Terms.
            </Typography>
          </LegalSection>

          <LegalSection title="19. Contact Information">
            <Typography variant="body1" paragraph>
              If you have any questions about these Terms of Service, please contact:
            </Typography>
            <Box sx={{ ml: 2, mb: 2 }}>
              <Typography variant="body1">Vincent Legout</Typography>
              <Typography variant="body1">
                Email: <MuiLink href="mailto:vincent@legout.info">vincent@legout.info</MuiLink>
              </Typography>
              <Typography variant="body1">
                GitHub:{" "}
                <MuiLink href="https://github.com/vlegout/stride" target="_blank" rel="noopener noreferrer">
                  https://github.com/vlegout/stride
                </MuiLink>
              </Typography>
            </Box>
          </LegalSection>
        </Box>
      </SectionContainer>
    </Box>
  );
}
