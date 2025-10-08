-- Create resources table for help center articles and SEO blog content
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL CHECK (length(title) > 0 AND length(title) <= 255),
    slug TEXT UNIQUE NOT NULL CHECK (length(slug) > 0 AND length(slug) <= 100),
    content TEXT NOT NULL CHECK (length(content) > 0),
    excerpt TEXT CHECK (length(excerpt) <= 500),
    category TEXT NOT NULL DEFAULT 'General' CHECK (length(category) <= 50),
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
    is_published BOOLEAN DEFAULT false NOT NULL,
    meta_title TEXT CHECK (length(meta_title) <= 255),
    meta_description TEXT CHECK (length(meta_description) <= 500),
    featured_image_url TEXT CHECK (length(featured_image_url) <= 500),
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reading_time_minutes INTEGER DEFAULT 5 CHECK (reading_time_minutes > 0),
    sort_order INTEGER DEFAULT 0
);

-- Create optimized composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_resources_published_slug ON public.resources(is_published, slug) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_resources_published_category ON public.resources(is_published, category, created_at DESC) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_resources_published_sort ON public.resources(is_published, sort_order, view_count DESC, created_at DESC) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_resources_tags_gin ON public.resources USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_resources_search ON public.resources USING GIN(to_tsvector('english', title || ' ' || COALESCE(excerpt, '') || ' ' || content)) WHERE is_published = true;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_resources_updated_at 
    BEFORE UPDATE ON public.resources 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create a function to increment view count (simplified and more efficient)
CREATE OR REPLACE FUNCTION increment_resource_view_count(resource_slug TEXT)
RETURNS INTEGER AS $$
BEGIN
    UPDATE public.resources 
    SET view_count = view_count + 1 
    WHERE slug = resource_slug AND is_published = true;
    
    RETURN (SELECT view_count FROM public.resources WHERE slug = resource_slug);
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security (RLS)
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (simplified and more secure)
-- Allow everyone to read published resources
CREATE POLICY "Anyone can view published resources" ON public.resources
    FOR SELECT USING (is_published = true);

-- Allow authenticated users to manage resources (admin only)
CREATE POLICY "Authenticated users can manage resources" ON public.resources
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert some sample data
INSERT INTO public.resources (
    title, 
    slug, 
    content, 
    excerpt, 
    category, 
    tags, 
    is_published, 
    meta_title, 
    meta_description,
    reading_time_minutes
) VALUES 
(
    'Getting Started with MNUDA',
    'getting-started-with-mnuda',
    '<h1>Welcome to MNUDA</h1><p>MNUDA (Minnesota Ultimate Data App) is your comprehensive gateway to Minnesota''s property data, demographic insights, and government services. This guide will help you get started with the platform and understand its core features.</p><h2>What is MNUDA?</h2><p>MNUDA is designed to empower citizens, businesses, and researchers with transparent, accessible information about Minnesota. Whether you''re looking for property information, demographic data, or government services, MNUDA provides the tools you need.</p><h2>Key Features</h2><ul><li>Property Intelligence: Comprehensive property data including ownership history, tax assessments, and market analytics</li><li>Demographic Insights: Population statistics, community data, and social indicators</li><li>Government Services: Direct access to Minnesota government services and official records</li><li>Research Tools: Advanced analytics and data visualization capabilities</li></ul><h2>Getting Started</h2><p>To begin using MNUDA, simply navigate to the map interface and start searching for properties or addresses. The platform is designed to be intuitive and user-friendly, with comprehensive help documentation available throughout.</p>',
    'Learn the basics of using MNUDA for property and demographic research.',
    'Getting Started',
    ARRAY['basics', 'tutorial', 'introduction'],
    true,
    'Getting Started with MNUDA - Help Center',
    'Learn how to get started with MNUDA for property and demographic research in Minnesota.',
    8
),
(
    'Understanding Property Data',
    'understanding-property-data',
    '<h1>Understanding Property Data in MNUDA</h1><p>Property data in MNUDA includes a wealth of information about real estate throughout Minnesota. This comprehensive guide will help you understand what data is available and how to interpret the results.</p><h2>Types of Property Data</h2><h3>Ownership Information</h3><p>MNUDA provides current and historical ownership data, including:</p><ul><li>Current property owner names and contact information</li><li>Previous ownership history</li><li>Ownership transfer dates and details</li><li>Property management companies</li></ul><h3>Tax Assessment Data</h3><p>Comprehensive tax information including:</p><ul><li>Current assessed value</li><li>Tax history and trends</li><li>Property tax payments and status</li><li>Exemptions and special assessments</li></ul><h3>Property Characteristics</h3><p>Detailed property information such as:</p><ul><li>Square footage and lot size</li><li>Number of bedrooms and bathrooms</li><li>Year built and construction details</li><li>Property type and zoning</li></ul><h2>How to Use Property Data</h2><p>Property data can be used for various purposes including market research, investment analysis, and due diligence. The data is updated regularly to ensure accuracy and completeness.</p>',
    'Comprehensive guide to understanding property data and how to interpret results.',
    'Property Data',
    ARRAY['property', 'data', 'ownership', 'taxes'],
    true,
    'Understanding Property Data - MNUDA Help',
    'Learn how to interpret property data including ownership, taxes, and assessments.',
    12
),
(
    'Demographic Insights Guide',
    'demographic-insights-guide',
    '<h1>Demographic Insights in MNUDA</h1><p>Demographic data provides valuable insights into Minnesota''s diverse communities. This guide explains how to access and interpret demographic information through MNUDA.</p><h2>Available Demographic Data</h2><h3>Population Statistics</h3><p>Comprehensive population data including:</p><ul><li>Current population counts by area</li><li>Population density and distribution</li><li>Age demographics and household composition</li><li>Population growth trends</li></ul><h3>Economic Indicators</h3><p>Economic data such as:</p><ul><li>Median household income</li><li>Employment statistics</li><li>Industry composition</li><li>Economic development indicators</li></ul><h3>Community Characteristics</h3><p>Community-level information including:</p><ul><li>Education levels and school performance</li><li>Crime statistics and safety data</li><li>Housing characteristics and affordability</li><li>Transportation and infrastructure</li></ul><h2>Using Demographic Data</h2><p>Demographic insights can help with market research, community planning, and investment decisions. The data is sourced from official government sources and updated regularly.</p>',
    'How to use demographic data to understand Minnesota communities.',
    'Demographics',
    ARRAY['demographics', 'population', 'census', 'community'],
    true,
    'Demographic Insights Guide - MNUDA',
    'Learn how to use demographic data to understand Minnesota communities and populations.',
    10
),
(
    'Exporting Data and Reports',
    'exporting-data-and-reports',
    '<h1>Exporting Data and Reports from MNUDA</h1><p>MNUDA offers multiple export formats to help you work with your research data. This guide covers all available export options and how to use them effectively.</p><h2>Available Export Formats</h2><h3>CSV (Comma-Separated Values)</h3><p>CSV files are ideal for:</p><ul><li>Spreadsheet applications like Excel or Google Sheets</li><li>Data analysis and manipulation</li><li>Importing into other systems</li><li>Basic reporting and visualization</li></ul><h3>JSON (JavaScript Object Notation)</h3><p>JSON format is perfect for:</p><ul><li>Web applications and APIs</li><li>Programmatic data processing</li><li>Database imports</li><li>Custom software integration</li></ul><h3>XLSX (Excel Spreadsheet)</h3><p>XLSX files provide:</p><ul><li>Formatted spreadsheets with multiple sheets</li><li>Charts and visualizations</li><li>Advanced formatting options</li><li>Professional presentation</li></ul><h3>PDF Reports</h3><p>PDF exports offer:</p><ul><li>Professional document formatting</li><li>Print-ready layouts</li><li>Embedded charts and graphs</li><li>Easy sharing and distribution</li></ul><h2>How to Export Data</h2><p>To export your research data, navigate to the export section in your session and select your preferred format. You can customize the data included in your export and choose specific fields or entities.</p>',
    'Learn how to export your research data in various formats.',
    'Data Export',
    ARRAY['export', 'reports', 'csv', 'pdf', 'data'],
    true,
    'Exporting Data and Reports - MNUDA Help',
    'Learn how to export your MNUDA research data in CSV, JSON, XLSX, and PDF formats.',
    7
),
(
    'Account and Billing FAQ',
    'account-and-billing-faq',
    '<h1>Account and Billing FAQ</h1><p>This comprehensive FAQ addresses common questions about MNUDA accounts, subscriptions, and billing.</p><h2>Account Management</h2><h3>How do I create an account?</h3><p>Creating an account is simple and free. Click the "Sign Up" button on the homepage and provide your email address and a secure password. You''ll receive a confirmation email to verify your account.</p><h3>Can I use MNUDA without an account?</h3><p>Yes! MNUDA offers limited functionality for guest users. However, creating an account provides access to additional features, saved sessions, and higher usage limits.</p><h3>How do I reset my password?</h3><p>If you''ve forgotten your password, click "Forgot Password" on the login page and enter your email address. You''ll receive instructions to reset your password.</p><h2>Billing and Subscriptions</h2><h3>What subscription plans are available?</h3><p>MNUDA offers both free and premium subscription options. Free accounts include basic functionality with daily usage limits, while premium accounts provide unlimited access and advanced features.</p><h3>How do I upgrade my account?</h3><p>You can upgrade your account at any time through the account settings page. Premium subscriptions are billed monthly or annually with automatic renewal.</p><h3>Can I cancel my subscription?</h3><p>Yes, you can cancel your subscription at any time through your account settings. Your premium features will remain active until the end of your current billing period.</p><h2>Payment and Billing</h2><h3>What payment methods do you accept?</h3><p>We accept all major credit cards, debit cards, and PayPal for subscription payments.</p><h3>How do I update my payment information?</h3><p>You can update your payment information through the billing section of your account settings.</p>',
    'Frequently asked questions about accounts, subscriptions, and billing.',
    'Account',
    ARRAY['account', 'billing', 'subscription', 'faq'],
    true,
    'Account and Billing FAQ - MNUDA',
    'Get answers to common questions about MNUDA accounts, subscriptions, and billing.',
    15
),
(
    'Privacy and Data Security',
    'privacy-and-data-security',
    '<h1>Privacy and Data Security at MNUDA</h1><p>MNUDA takes your privacy and data security seriously. This document outlines our commitment to protecting your information and maintaining the highest security standards.</p><h2>Our Privacy Commitment</h2><p>We are committed to protecting your privacy and ensuring the security of your personal information. Our privacy practices are designed to be transparent and give you control over your data.</p><h2>Data Collection and Use</h2><h3>Information We Collect</h3><p>We collect only the information necessary to provide our services:</p><ul><li>Account information (email, name, password)</li><li>Usage data to improve our services</li><li>Search queries and results (anonymized)</li><li>Technical information for system optimization</li></ul><h3>How We Use Your Information</h3><p>Your information is used to:</p><ul><li>Provide and improve our services</li><li>Process your requests and transactions</li><li>Communicate with you about your account</li><li>Ensure system security and prevent fraud</li></ul><h2>Data Security</h2><h3>Encryption</h3><p>All data is encrypted in transit and at rest using industry-standard encryption protocols. We use SSL/TLS encryption for all data transmission and AES-256 encryption for data storage.</p><h3>Access Controls</h3><p>Access to your data is strictly controlled and limited to authorized personnel who need it to provide our services. All access is logged and monitored.</p><h3>Regular Security Audits</h3><p>We conduct regular security audits and penetration testing to identify and address potential vulnerabilities.</p><h2>Your Rights</h2><p>You have the right to:</p><ul><li>Access your personal data</li><li>Correct inaccurate information</li><li>Delete your account and data</li><li>Export your data</li><li>Opt out of marketing communications</li></ul><h2>Contact Us</h2><p>If you have questions about our privacy practices or want to exercise your rights, please contact us at privacy@mnuda.com.</p>',
    'Learn about MNUDA''s privacy policies and data security measures.',
    'Privacy',
    ARRAY['privacy', 'security', 'data protection', 'gdpr'],
    true,
    'Privacy and Data Security - MNUDA',
    'Learn about MNUDA''s commitment to privacy and data security.',
    11
);

-- Create a view for published resources with better performance
CREATE OR REPLACE VIEW public.published_resources AS
SELECT 
    id,
    title,
    slug,
    content,
    excerpt,
    category,
    tags,
    created_at,
    updated_at,
    view_count,
    meta_title,
    meta_description,
    featured_image_url,
    reading_time_minutes,
    sort_order
FROM public.resources
WHERE is_published = true;

-- Grant permissions (simplified)
GRANT SELECT ON public.published_resources TO anon, authenticated;
GRANT ALL ON public.resources TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.resources IS 'Help center articles and blog content with SEO optimization';
COMMENT ON COLUMN public.resources.slug IS 'URL-friendly identifier, must be unique';
COMMENT ON COLUMN public.resources.tags IS 'Array of tags for categorization and search';
COMMENT ON COLUMN public.resources.view_count IS 'Number of times this resource has been viewed';
COMMENT ON COLUMN public.resources.sort_order IS 'Custom ordering for manual article arrangement';
