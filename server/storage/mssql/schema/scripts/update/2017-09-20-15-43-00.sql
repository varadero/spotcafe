INSERT INTO [Permissions]
([Id], [Name], [Description]) VALUES
('4EE5A359-B891-4C98-BE26-99033A456DE0', 'Roles - View', 'Can view roles')

INSERT INTO [Permissions]
([Id], [Name], [Description]) VALUES
('88BA6EBF-A9EB-4BC0-BC1F-520F56F94918', 'Roles - Modify', 'Can modify roles')

INSERT INTO [dbo].[PermissionsInRoles]
([PermissionId], [RoleId]) VALUES
('4EE5A359-B891-4C98-BE26-99033A456DE0','D2595A95-630C-4E66-9B2E-1F804154FDF5')

INSERT INTO [dbo].[PermissionsInRoles]
([PermissionId], [RoleId]) VALUES
('88BA6EBF-A9EB-4BC0-BC1F-520F56F94918','D2595A95-630C-4E66-9B2E-1F804154FDF5')

UPDATE [Settings] SET [Value]='2017-09-20 15:43:00' WHERE [Name]='database.version'