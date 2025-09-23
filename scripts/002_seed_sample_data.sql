-- This script adds some sample data for testing (optional)
-- You can run this after the main schema to have some test data

-- Note: This will only work after you have created a user account
-- Replace 'your-user-id-here' with your actual user ID from auth.users

-- Sample business profile (you'll need to replace the user_id)
-- INSERT INTO business_profiles (user_id, business_name, email, phone, address, city, state, zip_code, country)
-- VALUES (
--     'your-user-id-here',
--     'Sample Business LLC',
--     'contact@samplebusiness.com',
--     '+1 (555) 123-4567',
--     '123 Business St',
--     'Business City',
--     'CA',
--     '90210',
--     'United States'
-- );

-- Sample customers (you'll need to replace the user_id)
-- INSERT INTO customers (user_id, name, email, phone, address, city, state, zip_code, country)
-- VALUES 
--     ('your-user-id-here', 'John Doe', 'john@example.com', '+1 (555) 987-6543', '456 Customer Ave', 'Customer City', 'NY', '10001', 'United States'),
--     ('your-user-id-here', 'Jane Smith', 'jane@example.com', '+1 (555) 456-7890', '789 Client Blvd', 'Client Town', 'TX', '75001', 'United States');

-- Note: Uncomment and modify the above INSERT statements after you create your account
-- and replace 'your-user-id-here' with your actual user ID
