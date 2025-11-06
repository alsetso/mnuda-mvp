'use client';

import PageLayout from '@/components/PageLayout';
import Link from 'next/link';

export default function TermsOfServicePageClient() {
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <PageLayout showHeader={true} showFooter={true} containerMaxWidth="7xl">
      <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-black transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-black text-black mb-6">Terms of Service</h1>
          <p className="text-sm text-gray-600 mb-8">Last updated: {currentDate}</p>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-4">1. Agreement to Terms</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User,&quot; &quot;you,&quot; or &quot;your&quot;) and MNUDA Network, a Minnesota-based entity (&quot;MNUDA,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), governing your access to and use of the MNUDA website located at mnuda.com (the &quot;Website&quot;) and any related services, applications, features, content, and functionality offered by MNUDA (collectively, the &quot;Services&quot;).
              </p>
              <p>
                By accessing, browsing, or using the Services, you acknowledge that you have read, understood, and agree to be bound by these Terms and all applicable laws and regulations of the State of Minnesota and the United States. If you do not agree with any part of these Terms, you must immediately discontinue your use of the Services and may not access or use the Services.
              </p>
              <p>
                These Terms apply to all visitors, users, and others who access or use the Services. By using the Services, you represent and warrant that you are at least eighteen (18) years of age and have the legal capacity to enter into these Terms.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-4">2. Definitions</h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>
                <strong>&quot;Services&quot;</strong> means all products, services, websites, applications, tools, features, and functionality provided by MNUDA, including but not limited to skip tracing services, property search and mapping tools, asset management systems, workflow automation tools, advertising services, print services, community features, and any related software or technology.
              </p>
              <p>
                <strong>&quot;User Content&quot;</strong> means any data, information, text, graphics, photos, or other materials uploaded, posted, transmitted, or otherwise made available by you through the Services.
              </p>
              <p>
                <strong>&quot;Third-Party Services&quot;</strong> means any external services, APIs, data providers, or third-party integrations utilized by or accessible through the Services.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-4">3. Description of Services</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                MNUDA provides a technology platform that combines software tools, data services, and business resources to facilitate real estate investment activities in Minnesota. The Services include, but are not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Skip tracing and people search services</li>
                <li>Interactive property mapping and geocoding tools</li>
                <li>Real estate asset management and tracking systems</li>
                <li>Data processing and workflow automation tools</li>
                <li>Digital advertising campaign management</li>
                <li>Print and direct mail services</li>
                <li>Community features and networking tools</li>
                <li>Minnesota property and location data directories</li>
              </ul>
              <p>
                MNUDA reserves the right to modify, suspend, or discontinue any aspect of the Services at any time, with or without notice, and without liability to you or any third party.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-4">4. User Accounts and Registration</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                To access certain features of the Services, you may be required to create an account and provide accurate, current, and complete information. You are solely responsible for maintaining the confidentiality of your account credentials, including your username and password, and for all activities that occur under your account.
              </p>
              <p>
                You agree to: (a) immediately notify MNUDA of any unauthorized use of your account or any other breach of security; (b) ensure that you exit from your account at the end of each session; and (c) use a strong password and restrict access to your computer or device. MNUDA will not be liable for any loss or damage arising from your failure to comply with this section.
              </p>
              <p>
                You represent and warrant that all information provided during registration is accurate, current, and complete, and you agree to update such information to maintain its accuracy. MNUDA reserves the right to suspend or terminate your account if any information provided is found to be inaccurate, not current, or incomplete.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-4">5. Acceptable Use Policy</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                You agree to use the Services only for lawful purposes and in accordance with these Terms and all applicable federal, state, and local laws, rules, and regulations, including but not limited to Minnesota state laws and regulations governing real estate transactions, fair housing, data privacy, and consumer protection.
              </p>
              <p>
                You agree not to, and will not permit any third party to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Services in any manner that violates any applicable law, regulation, or court order</li>
                <li>Infringe upon or violate the intellectual property rights, privacy rights, or other rights of any third party</li>
                <li>Harass, abuse, harm, or defame any individual or entity</li>
                <li>Transmit, upload, or distribute any viruses, malware, worms, Trojan horses, or other malicious code</li>
                <li>Attempt to gain unauthorized access to the Services, other accounts, computer systems, or networks connected to the Services</li>
                <li>Interfere with or disrupt the integrity or performance of the Services or the data contained therein</li>
                <li>Use the Services to collect, store, or process personal information in violation of applicable privacy laws, including the Minnesota Government Data Practices Act and federal privacy regulations</li>
                <li>Use automated systems, bots, scrapers, or crawlers to access the Services without express written permission</li>
                <li>Reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code of any software component of the Services</li>
                <li>Use the Services for any commercial purpose without MNUDA&apos;s express written consent, except as expressly permitted herein</li>
                <li>Impersonate any person or entity or falsely state or misrepresent your affiliation with any person or entity</li>
                <li>Use skip tracing or people search services for stalking, harassment, or any unlawful purpose</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-4">6. User Content and Data</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                You retain all ownership rights in any User Content you submit, post, or display on or through the Services. By submitting User Content, you grant MNUDA a worldwide, non-exclusive, royalty-free, perpetual, irrevocable, sublicensable, and transferable license to use, reproduce, distribute, prepare derivative works of, display, and perform such User Content in connection with the Services and MNUDA&apos;s business, including for the purpose of promoting and redistributing part or all of the Services.
              </p>
              <p>
                You are solely responsible for your User Content and the consequences of posting or publishing it. You represent and warrant that: (a) you own or have the necessary licenses, rights, consents, and permissions to use and authorize MNUDA to use all User Content in the manner contemplated by these Terms; and (b) your User Content does not violate any third-party rights, including intellectual property rights, privacy rights, or publicity rights.
              </p>
              <p>
                MNUDA reserves the right, but has no obligation, to monitor, review, edit, or remove any User Content at any time, for any reason, in its sole discretion, without prior notice.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-4">7. Intellectual Property Rights</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                The Services, including all content, features, functionality, software, text, graphics, logos, icons, images, audio clips, digital downloads, data compilations, and the design, selection, and arrangement thereof, are the exclusive property of MNUDA or its licensors and are protected by United States and international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <p>
                The MNUDA name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of MNUDA or its affiliates. You may not use such marks without the prior written permission of MNUDA. All other names, logos, product and service names, designs, and slogans on the Services are the trademarks of their respective owners.
              </p>
              <p>
                Except as expressly provided in these Terms, no part of the Services and no content may be copied, reproduced, republished, uploaded, posted, publicly displayed, encoded, translated, transmitted, or distributed in any way to any other computer, server, website, or other medium for publication or distribution or for any commercial enterprise, without MNUDA&apos;s express prior written consent.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-4">8. Third-Party Services and Content</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                The Services may integrate with or provide access to third-party services, APIs, data providers, and content (&quot;Third-Party Services&quot;). Your use of Third-Party Services is subject to the terms and conditions and privacy policies of such third parties, which you should review before using such services.
              </p>
              <p>
                MNUDA does not endorse, warrant, or assume responsibility for any Third-Party Services or the content, accuracy, or opinions expressed therein. MNUDA expressly disclaims all liability for any loss or damage arising from your use of or reliance on any Third-Party Services.
              </p>
              <p>
                When using skip tracing or people search services, you acknowledge that such services may utilize third-party data providers and that the accuracy, completeness, or timeliness of such data is not guaranteed. You agree to use such services in compliance with the Fair Credit Reporting Act (FCRA), the Telephone Consumer Protection Act (TCPA), and all other applicable federal and state laws.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-4">9. Privacy and Data Protection</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Your privacy is important to us. Our collection, use, and disclosure of your personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Services, you consent to the collection and use of your information as described in our Privacy Policy.
              </p>
              <p>
                In addition to our Privacy Policy, MNUDA complies with applicable data protection laws, including Minnesota state data privacy laws and regulations. You acknowledge that certain information may be transmitted over networks and may be subject to security breaches, and MNUDA cannot guarantee the absolute security of your data.
              </p>
              <p>
                You are responsible for ensuring that any personal information you collect, store, or process through the Services complies with all applicable privacy laws, including but not limited to the Minnesota Government Data Practices Act, the Minnesota Consumer Data Privacy Act (if applicable), and federal regulations such as the Gramm-Leach-Bliley Act and the Health Insurance Portability and Accountability Act (HIPAA), where applicable.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-4">10. Disclaimers</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                THE SERVICES ARE PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
              </p>
              <p>
                MNUDA DOES NOT WARRANT THAT: (a) THE SERVICES WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE; (b) THE RESULTS THAT MAY BE OBTAINED FROM THE USE OF THE SERVICES WILL BE ACCURATE OR RELIABLE; (c) THE QUALITY OF ANY PRODUCTS, SERVICES, INFORMATION, OR OTHER MATERIAL PURCHASED OR OBTAINED BY YOU THROUGH THE SERVICES WILL MEET YOUR EXPECTATIONS; OR (d) ANY ERRORS IN THE SERVICES WILL BE CORRECTED.
              </p>
              <p>
                MNUDA MAKES NO WARRANTIES REGARDING THE ACCURACY, RELIABILITY, COMPLETENESS, OR TIMELINESS OF ANY DATA, INFORMATION, OR CONTENT PROVIDED THROUGH THE SERVICES, INCLUDING BUT NOT LIMITED TO PROPERTY DATA, SKIP TRACING RESULTS, GEOCODING DATA, OR THIRD-PARTY CONTENT.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-4">11. Limitation of Liability</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, INCLUDING MINNESOTA STATE LAW, IN NO EVENT SHALL MNUDA, ITS AFFILIATES, AGENTS, DIRECTORS, EMPLOYEES, SUPPLIERS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, INCLUDING WITHOUT LIMITATION DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATING TO THE USE OF, OR INABILITY TO USE, THE SERVICES.
              </p>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, MNUDA ASSUMES NO LIABILITY OR RESPONSIBILITY FOR ANY: (a) ERRORS, MISTAKES, OR INACCURACIES OF CONTENT; (b) PERSONAL INJURY OR PROPERTY DAMAGE RESULTING FROM YOUR ACCESS TO OR USE OF THE SERVICES; (c) ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SECURE SERVERS AND/OR ANY PERSONAL INFORMATION STORED THEREIN; (d) ANY INTERRUPTION OR CESSATION OF TRANSMISSION TO OR FROM THE SERVICES; (e) ANY BUGS, VIRUSES, TROJAN HORSES, OR THE LIKE THAT MAY BE TRANSMITTED TO OR THROUGH THE SERVICES BY ANY THIRD PARTY; OR (f) ANY ERRORS OR OMISSIONS IN ANY CONTENT OR FOR ANY LOSS OR DAMAGE INCURRED AS A RESULT OF THE USE OF ANY CONTENT POSTED, EMAILED, TRANSMITTED, OR OTHERWISE MADE AVAILABLE THROUGH THE SERVICES.
              </p>
              <p>
                IN NO EVENT SHALL MNUDA&apos;S TOTAL LIABILITY TO YOU FOR ALL DAMAGES EXCEED THE AMOUNT OF ONE HUNDRED DOLLARS ($100.00) OR THE AMOUNT YOU PAID MNUDA IN THE TWELVE (12) MONTHS PRIOR TO THE ACTION GIVING RISE TO THE LIABILITY, WHICHEVER IS GREATER.
              </p>
              <p>
                SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF INCIDENTAL OR CONSEQUENTIAL DAMAGES, SO THE ABOVE LIMITATIONS OR EXCLUSIONS MAY NOT APPLY TO YOU. THESE TERMS GIVE YOU SPECIFIC LEGAL RIGHTS, AND YOU MAY ALSO HAVE OTHER RIGHTS WHICH VARY FROM JURISDICTION TO JURISDICTION.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-4">12. Indemnification</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                You agree to defend, indemnify, and hold harmless MNUDA, its affiliates, licensors, and service providers, and its and their respective officers, directors, employees, contractors, agents, licensors, suppliers, successors, and assigns from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys&apos; fees) arising out of or relating to your violation of these Terms or your use of the Services, including, but not limited to: (a) your User Content; (b) your use of any information obtained from the Services; (c) your violation of any third-party right, including any intellectual property right, privacy right, or publicity right; or (d) your violation of any applicable law, rule, or regulation.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-4">13. Termination</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                MNUDA may terminate or suspend your account and access to the Services immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms. Upon termination, your right to use the Services will immediately cease.
              </p>
              <p>
                If you wish to terminate your account, you may simply discontinue using the Services or contact us to request account deletion. All provisions of these Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-4">14. Governing Law and Jurisdiction</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the State of Minnesota, without regard to its conflict of law provisions. You agree to submit to the personal and exclusive jurisdiction of the state and federal courts located in Hennepin County, Minnesota, for the resolution of any disputes arising out of or relating to these Terms or the Services.
              </p>
              <p>
                If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary so that these Terms shall otherwise remain in full force and effect and enforceable.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-4">15. Dispute Resolution</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                For any dispute you have with MNUDA, you agree to first contact us and attempt to resolve the dispute informally. If MNUDA has not been able to resolve the dispute with you informally, we each agree to resolve any claim, dispute, or controversy (excluding claims for injunctive or other equitable relief) arising out of or in connection with or relating to these Terms through binding arbitration in accordance with the Commercial Arbitration Rules of the American Arbitration Association (&quot;AAA&quot;) then in effect, except as provided herein.
              </p>
              <p>
                The arbitration will be conducted in Hennepin County, Minnesota, unless you and MNUDA agree otherwise. Each party will be responsible for paying any AAA filing, administrative, and arbitrator fees in accordance with AAA rules. The award rendered by the arbitrator shall include costs of arbitration, reasonable attorneys&apos; fees, and reasonable costs for expert and other witnesses, and any judgment on the award rendered by the arbitrator may be entered in any court of competent jurisdiction.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-4">16. Modifications to Terms</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                MNUDA reserves the right, at its sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least thirty (30) days&apos; notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
              </p>
              <p>
                By continuing to access or use the Services after any revisions become effective, you agree to be bound by the revised Terms. If you do not agree to the new Terms, you are no longer authorized to use the Services.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-4">17. Entire Agreement</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                These Terms, together with our Privacy Policy and any other legal notices published by MNUDA on the Services, shall constitute the entire agreement between you and MNUDA concerning the Services. If any provision of these Terms is deemed invalid by a court of competent jurisdiction, the invalidity of such provision shall not affect the validity of the remaining provisions of these Terms, which shall remain in full force and effect.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-4">18. Contact Information</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <p className="font-semibold">
                MNUDA Network<br />
                Email: support@mnuda.com<br />
                Website: mnuda.com
              </p>
              <p>
                For legal notices or service of process, please contact us at the address provided above or through our website contact form.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-4">19. Acknowledgment</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                BY USING THE SERVICES, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE, UNDERSTAND THEM, AND AGREE TO BE BOUND BY THEM. IF YOU DO NOT AGREE TO THESE TERMS, YOU MUST NOT USE THE SERVICES.
              </p>
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
