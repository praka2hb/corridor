-- Normalize existing user role values to match enum UserRole
UPDATE "User" SET role = 'MEMBER'   WHERE role = 'member';
UPDATE "User" SET role = 'ORG_ADMIN' WHERE role = 'org_admin';
UPDATE "User" SET role = 'TEAM_LEAD' WHERE role = 'team_lead';

