INSERT INTO [Permissions]
([Id], [Name], [Description]) VALUES
('73016218-9257-46ED-ACF4-17006B3CEA3E', 'Client devices status - Modify', 'Can modify client devices status')

INSERT INTO [dbo].[PermissionsInRoles]
([PermissionId], [RoleId]) VALUES
('73016218-9257-46ED-ACF4-17006B3CEA3E','4771B508-6909-482D-9644-E54CB2952333')

INSERT INTO [dbo].[PermissionsInRoles]
([PermissionId], [RoleId]) VALUES
('73016218-9257-46ED-ACF4-17006B3CEA3E','D2595A95-630C-4E66-9B2E-1F804154FDF5')

UPDATE [Settings] SET [Value]='2017-09-26 01:15:00' WHERE [Name]='database.version'
