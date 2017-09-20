INSERT INTO [Permissions]
([Id], [Name], [Description]) VALUES
('534A9C1D-0D77-42AB-92F6-3E7F27317689', 'Permissions - View', 'Can view permissions')

INSERT INTO [Permissions]
([Id], [Name], [Description]) VALUES
('AAF07984-BCE8-41F2-A5E6-8C1D7FFBB0B2', 'Permissions - Modify', 'Can modify permisions')

INSERT INTO [dbo].[PermissionsInRoles]
([PermissionId], [RoleId]) VALUES
('534A9C1D-0D77-42AB-92F6-3E7F27317689','D2595A95-630C-4E66-9B2E-1F804154FDF5')

INSERT INTO [dbo].[PermissionsInRoles]
([PermissionId], [RoleId]) VALUES
('AAF07984-BCE8-41F2-A5E6-8C1D7FFBB0B2','D2595A95-630C-4E66-9B2E-1F804154FDF5')

UPDATE [Settings] SET [Value]='2017-09-21 00:00:00' WHERE [Name]='database.version'