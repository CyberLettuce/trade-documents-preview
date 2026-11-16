# Exporter Account Management

Settings contains the single user-management page. Email address, name and Basic/Administrator access level are saved with the browser-local exporter account. Standard legacy roles are interpreted as Basic. Administrators manage users, company details and signatories; Basic users retain application, stored-data, reporting and preference access, with company details and signatories read-only. Both UI and state-update guards protect restricted changes. Users cannot remove themselves or change their own role, and an Administrator must remain.

This prototype does not create real logins, send invitations, or enforce permissions on a server. Production authentication and backend authorization are required for shared accounts.
