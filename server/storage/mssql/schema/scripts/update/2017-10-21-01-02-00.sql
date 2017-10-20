INSERT INTO [Permissions]
([Id], [Name], [Description]) VALUES
('BCC1956C-FB45-4A97-A121-78F9C7DCD368', 'Reports - View', 'Can view reports')

INSERT INTO [dbo].[PermissionsInRoles]
([PermissionId], [RoleId]) VALUES
('BCC1956C-FB45-4A97-A121-78F9C7DCD368','D2595A95-630C-4E66-9B2E-1F804154FDF5')

UPDATE [Settings] SET [Value]='2017-10-21 01:02:00' WHERE [Name]='database.version'