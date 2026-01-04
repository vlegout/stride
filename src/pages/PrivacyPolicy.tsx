import { Box, Typography, Link as MuiLink } from "@mui/material";
import PageHeader from "../components/ui/PageHeader";
import SectionContainer from "../components/ui/SectionContainer";
import LegalSection from "../components/LegalSection";

export default function PrivacyPolicy() {
  return (
    <Box sx={{ width: "100%" }}>
      <PageHeader title="Privacy Policy" subtitle="Last Updated: January 4, 2026" />
      <SectionContainer maxWidth={{ xs: "100%", sm: "800px", md: "900px" }} centered variant="paper" elevation={2}>
        <Box sx={{ textAlign: "left" }}>
          <LegalSection title="1. Introduction">
            <Typography variant="body1" paragraph>
              Welcome to Stride. This Privacy Policy explains how Vincent Legout ("we", "us", or "our") collects, uses,
              and protects your personal data when you use the Stride web application (the "Service").
            </Typography>
            <Typography variant="body1" paragraph>
              We are committed to protecting your privacy and complying with the General Data Protection Regulation
              (GDPR) and other applicable data protection laws.
            </Typography>
          </LegalSection>

          <LegalSection title="2. Data Controller">
            <Typography variant="body1" paragraph>
              The data controller responsible for your personal data is:
            </Typography>
            <Box sx={{ ml: 2, mb: 2 }}>
              <Typography variant="body1">Vincent Legout</Typography>
              <Typography variant="body1">
                Email: <MuiLink href="mailto:vincent@legout.info">vincent@legout.info</MuiLink>
              </Typography>
              <Typography variant="body1">Location: France</Typography>
            </Box>
          </LegalSection>

          <LegalSection title="3. Data We Collect">
            <Typography variant="body1" paragraph>
              We collect the following types of personal data:
            </Typography>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
              3.1 Authentication Data (via Google OAuth)
            </Typography>
            <Box sx={{ ml: 2, mb: 2 }}>
              <Typography variant="body1" component="div">
                <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                  <li>First name and last name</li>
                  <li>Email address</li>
                  <li>Google account ID</li>
                  <li>Profile picture URL</li>
                </ul>
              </Typography>
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
              3.2 Activity and Fitness Data
            </Typography>
            <Box sx={{ ml: 2, mb: 2 }}>
              <Typography variant="body1" component="div">
                <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                  <li>GPS location data (latitude, longitude, city, country) from uploaded activities</li>
                  <li>Health and performance metrics (heart rate, power output, speed, pace, cadence)</li>
                  <li>Activity type (running, cycling, swimming, etc.)</li>
                  <li>Distance, duration, elevation, and calories</li>
                  <li>Training stress scores and performance metrics</li>
                  <li>FIT file data and metadata</li>
                </ul>
              </Typography>
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
              3.3 User Preferences
            </Typography>
            <Box sx={{ ml: 2, mb: 2 }}>
              <Typography variant="body1" component="div">
                <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                  <li>Map provider preference (OpenStreetMap or Mapbox)</li>
                  <li>Training zone configurations</li>
                </ul>
              </Typography>
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
              3.4 Technical Data
            </Typography>
            <Box sx={{ ml: 2, mb: 2 }}>
              <Typography variant="body1" component="div">
                <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                  <li>Browser type and version</li>
                  <li>IP address (for authentication)</li>
                  <li>Usage patterns and interactions with the Service</li>
                </ul>
              </Typography>
            </Box>
          </LegalSection>

          <LegalSection title="4. How We Use Your Data">
            <Typography variant="body1" paragraph>
              We process your personal data for the following purposes:
            </Typography>
            <Box sx={{ ml: 2, mb: 2 }}>
              <Typography variant="body1" component="div">
                <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                  <li>To provide and maintain the Service</li>
                  <li>To authenticate and manage your account</li>
                  <li>To process, analyze, and visualize your activity data with charts and maps</li>
                  <li>To calculate performance metrics and training zone breakdowns</li>
                  <li>To store and retrieve your uploaded FIT files</li>
                  <li>To improve and optimize the Service</li>
                  <li>To communicate with you about service updates or issues</li>
                </ul>
              </Typography>
            </Box>
          </LegalSection>

          <LegalSection title="5. Legal Basis for Processing (GDPR)">
            <Typography variant="body1" paragraph>
              Under GDPR Article 6, we process your data based on:
            </Typography>
            <Box sx={{ ml: 2, mb: 2 }}>
              <Typography variant="body1" component="div">
                <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                  <li>
                    <strong>Consent</strong>: You provide consent when creating an account and uploading activity data
                  </li>
                  <li>
                    <strong>Legitimate interests</strong>: To operate, maintain, and improve our Service
                  </li>
                  <li>
                    <strong>Contractual necessity</strong>: To fulfill our obligations in providing the Service to you
                  </li>
                </ul>
              </Typography>
            </Box>
          </LegalSection>

          <LegalSection title="6. Data Storage and Security">
            <Typography variant="body1" paragraph>
              Your data is stored securely using the following measures:
            </Typography>
            <Box sx={{ ml: 2, mb: 2 }}>
              <Typography variant="body1" component="div">
                <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                  <li>
                    <strong>Database</strong>: PostgreSQL database with access controls
                  </li>
                  <li>
                    <strong>File Storage</strong>: AWS S3 for secure storage of FIT files and metadata
                  </li>
                  <li>
                    <strong>Authentication</strong>: JWT tokens with 7-day expiration
                  </li>
                  <li>
                    <strong>Encryption</strong>: HTTPS/TLS encryption for data in transit
                  </li>
                  <li>
                    <strong>Access Controls</strong>: User data is isolated and only accessible by the account owner
                  </li>
                </ul>
              </Typography>
            </Box>
            <Typography variant="body1" paragraph>
              While we implement reasonable security measures, no method of transmission over the internet is 100%
              secure. We cannot guarantee absolute security.
            </Typography>
          </LegalSection>

          <LegalSection title="7. Data Retention">
            <Typography variant="body1" paragraph>
              We retain your personal data for as long as your account is active or as needed to provide you with the
              Service. You may request deletion of your account and associated data at any time by contacting us.
            </Typography>
            <Typography variant="body1" paragraph>
              When you delete an activity, it is marked as deleted in our system but may remain in backups for a limited
              period.
            </Typography>
          </LegalSection>

          <LegalSection title="8. Your Rights Under GDPR">
            <Typography variant="body1" paragraph>
              As a data subject under GDPR, you have the following rights:
            </Typography>
            <Box sx={{ ml: 2, mb: 2 }}>
              <Typography variant="body1" component="div">
                <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                  <li>
                    <strong>Right of Access</strong>: Request a copy of your personal data
                  </li>
                  <li>
                    <strong>Right to Rectification</strong>: Request correction of inaccurate data
                  </li>
                  <li>
                    <strong>Right to Erasure</strong>: Request deletion of your personal data ("right to be forgotten")
                  </li>
                  <li>
                    <strong>Right to Data Portability</strong>: Request your data in a machine-readable format
                  </li>
                  <li>
                    <strong>Right to Object</strong>: Object to processing of your personal data
                  </li>
                  <li>
                    <strong>Right to Restrict Processing</strong>: Request limitation of data processing
                  </li>
                  <li>
                    <strong>Right to Withdraw Consent</strong>: Withdraw consent at any time
                  </li>
                </ul>
              </Typography>
            </Box>
            <Typography variant="body1" paragraph>
              To exercise any of these rights, please contact us at{" "}
              <MuiLink href="mailto:vincent@legout.info">vincent@legout.info</MuiLink>. We will respond within 30 days.
            </Typography>
          </LegalSection>

          <LegalSection title="9. Third-Party Services">
            <Typography variant="body1" paragraph>
              We use the following third-party services that may process your data:
            </Typography>
            <Box sx={{ ml: 2, mb: 2 }}>
              <Typography variant="body1" component="div">
                <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                  <li>
                    <strong>Google OAuth</strong>: For authentication (subject to{" "}
                    <MuiLink href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                      Google Privacy Policy
                    </MuiLink>
                    )
                  </li>
                  <li>
                    <strong>AWS S3</strong>: For file storage (subject to{" "}
                    <MuiLink href="https://aws.amazon.com/privacy/" target="_blank" rel="noopener noreferrer">
                      AWS Privacy Notice
                    </MuiLink>
                    )
                  </li>
                  <li>
                    <strong>Garmin Connect API</strong>: For activity sync (subject to{" "}
                    <MuiLink href="https://www.garmin.com/privacy/" target="_blank" rel="noopener noreferrer">
                      Garmin Privacy Policy
                    </MuiLink>
                    )
                  </li>
                  <li>
                    <strong>Mapbox</strong>: For map rendering if selected (subject to{" "}
                    <MuiLink href="https://www.mapbox.com/legal/privacy" target="_blank" rel="noopener noreferrer">
                      Mapbox Privacy Policy
                    </MuiLink>
                    )
                  </li>
                </ul>
              </Typography>
            </Box>
          </LegalSection>

          <LegalSection title="10. Cookies and Tracking">
            <Typography variant="body1" paragraph>
              We use local storage in your browser to:
            </Typography>
            <Box sx={{ ml: 2, mb: 2 }}>
              <Typography variant="body1" component="div">
                <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                  <li>Store authentication tokens (JWT)</li>
                  <li>Remember your preferences (map provider selection)</li>
                  <li>Maintain your session</li>
                </ul>
              </Typography>
            </Box>
            <Typography variant="body1" paragraph>
              We do not use third-party tracking cookies or analytics tools.
            </Typography>
          </LegalSection>

          <LegalSection title="11. International Data Transfers">
            <Typography variant="body1" paragraph>
              Your data is primarily processed and stored within the European Union. Some third-party services (AWS S3,
              Google OAuth) may transfer data outside the EU. These transfers are protected by appropriate safeguards
              such as Standard Contractual Clauses approved by the European Commission.
            </Typography>
          </LegalSection>

          <LegalSection title="12. Children's Privacy">
            <Typography variant="body1" paragraph>
              Our Service is not intended for children under 16 years of age. We do not knowingly collect personal data
              from children. If you believe we have collected data from a child, please contact us immediately.
            </Typography>
          </LegalSection>

          <LegalSection title="13. Changes to This Privacy Policy">
            <Typography variant="body1" paragraph>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by updating
              the "Last Updated" date at the top of this page. Your continued use of the Service after changes
              constitutes acceptance of the updated policy.
            </Typography>
          </LegalSection>

          <LegalSection title="14. Contact Us">
            <Typography variant="body1" paragraph>
              If you have any questions about this Privacy Policy or wish to exercise your rights, please contact:
            </Typography>
            <Box sx={{ ml: 2, mb: 2 }}>
              <Typography variant="body1">Vincent Legout</Typography>
              <Typography variant="body1">
                Email: <MuiLink href="mailto:vincent@legout.info">vincent@legout.info</MuiLink>
              </Typography>
            </Box>
            <Typography variant="body1" paragraph>
              You also have the right to lodge a complaint with the French data protection authority (CNIL) if you
              believe your data protection rights have been violated.
            </Typography>
          </LegalSection>
        </Box>
      </SectionContainer>
    </Box>
  );
}
